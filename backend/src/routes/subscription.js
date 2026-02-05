const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

/**
 * Subscription Routes
 * Handles Pro/Elite tier subscriptions with Stripe
 *
 * SETUP INSTRUCTIONS:
 * 1. Install Stripe: npm install stripe
 * 2. Create Stripe account at https://stripe.com
 * 3. Get API keys from Stripe Dashboard → Developers → API keys
 * 4. Set environment variables in .env:
 *    STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
 *    STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe webhook setup)
 *    STRIPE_PRICE_ID_PRO=price_... (create in Stripe Dashboard)
 *    STRIPE_PRICE_ID_ELITE=price_... (create in Stripe Dashboard)
 * 5. Create products/prices in Stripe Dashboard:
 *    - Product: "Twin OS Pro" → Price: $15/month recurring
 *    - Product: "Twin OS Elite" → Price: $50/month recurring
 * 6. Set up webhook endpoint at https://yourdomain.com/api/subscription/webhook
 *    Events to listen for: checkout.session.completed, invoice.paid, customer.subscription.updated
 */

// Initialize Stripe (only if API key is configured)
let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('✓ Stripe initialized');
  } else {
    console.warn('⚠ STRIPE_SECRET_KEY not set - payments disabled');
  }
} catch (error) {
  console.warn('⚠ Stripe module not installed - run: npm install stripe');
}

// Database for subscription management
const dbPath = path.join(__dirname, '../../starforge_subscriptions.db');
let db = null;

const getDb = () => {
  if (!db) {
    db = new Database(dbPath);
    
    // Create subscriptions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        user_id TEXT PRIMARY KEY,
        tier TEXT NOT NULL DEFAULT 'personal',
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        status TEXT DEFAULT 'active',
        current_period_end INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS usage_limits (
        user_id TEXT PRIMARY KEY,
        tracks_analyzed INTEGER DEFAULT 0,
        tracks_limit INTEGER DEFAULT 50,
        last_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  return db;
};

/**
 * GET /api/subscription/status
 * Get current subscription tier and limits
 */
router.get('/status', (req, res) => {
  try {
    const userId = req.query.user_id || 'default_user';
    const db = getDb();
    
    let subscription = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(userId);
    
    if (!subscription) {
      // Create default personal tier
      db.prepare(`
        INSERT INTO subscriptions (user_id, tier, status)
        VALUES (?, 'personal', 'active')
      `).run(userId);
      
      subscription = { user_id: userId, tier: 'personal', status: 'active' };
    }
    
    // Get usage limits
    let usage = db.prepare('SELECT * FROM usage_limits WHERE user_id = ?').get(userId);
    if (!usage) {
      const limit = subscription.tier === 'personal' ? 50 : 999999;
      db.prepare(`
        INSERT INTO usage_limits (user_id, tracks_analyzed, tracks_limit)
        VALUES (?, 0, ?)
      `).run(userId, limit);
      usage = { tracks_analyzed: 0, tracks_limit: limit };
    }
    
    res.json({
      success: true,
      tier: subscription.tier,
      status: subscription.status,
      usage: {
        tracksAnalyzed: usage.tracks_analyzed,
        tracksLimit: usage.tracks_limit,
        remaining: usage.tracks_limit - usage.tracks_analyzed
      },
      features: getFeaturesByTier(subscription.tier)
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/subscription/create-checkout
 * Create Stripe checkout session for upgrade
 */
router.post('/create-checkout', async (req, res) => {
  try {
    const { tier, successUrl, cancelUrl } = req.body;
    const userId = req.body.user_id || 'default_user';

    if (!tier || !['pro', 'elite'].includes(tier)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tier. Must be "pro" or "elite"'
      });
    }

    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({
        success: false,
        error: 'Stripe not configured',
        message: 'Payments are currently unavailable. Please contact support.',
        instructions: 'Set STRIPE_SECRET_KEY environment variable and install stripe: npm install stripe'
      });
    }

    // Get or create Stripe price ID
    const priceId = tier === 'pro'
      ? process.env.STRIPE_PRICE_ID_PRO
      : process.env.STRIPE_PRICE_ID_ELITE;

    if (!priceId) {
      return res.status(503).json({
        success: false,
        error: 'Stripe price not configured',
        message: `Please set STRIPE_PRICE_ID_${tier.toUpperCase()} environment variable`
      });
    }

    const db = getDb();
    let subscription = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(userId);

    // Get or create Stripe customer
    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: {
          user_id: userId,
          source: 'twin_os'
        }
      });
      customerId = customer.id;

      // Save customer ID
      if (subscription) {
        db.prepare('UPDATE subscriptions SET stripe_customer_id = ? WHERE user_id = ?')
          .run(customerId, userId);
      } else {
        db.prepare('INSERT INTO subscriptions (user_id, stripe_customer_id, tier) VALUES (?, ?, ?)')
          .run(userId, customerId, 'personal');
      }
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${req.headers.origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin}/pricing?checkout=cancelled`,
      metadata: {
        user_id: userId,
        tier: tier
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          tier: tier
        }
      }
    });

    res.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/subscription/webhook
 * Handle Stripe webhook events
 * IMPORTANT: This route needs express.raw() middleware configured in server.js
 */
router.post('/webhook', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('⚠ STRIPE_WEBHOOK_SECRET not set - webhook signature verification disabled');
  }

  let event;

  try {
    // Verify webhook signature (if secret is configured)
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // For development: allow unverified webhooks
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  const db = getDb();

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.user_id;
        const tier = session.metadata.tier;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        console.log(`✓ Checkout completed: User ${userId} → ${tier} tier`);

        // Update subscription in database
        db.prepare(`
          UPDATE subscriptions
          SET tier = ?, stripe_customer_id = ?, stripe_subscription_id = ?, status = 'active', updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `).run(tier, customerId, subscriptionId, userId);

        // Update usage limits (unlimited for pro/elite)
        db.prepare(`
          UPDATE usage_limits
          SET tracks_limit = ?
          WHERE user_id = ?
        `).run(999999, userId);

        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        console.log(`✓ Invoice paid: Subscription ${subscriptionId}`);

        // Update subscription status
        db.prepare(`
          UPDATE subscriptions
          SET status = 'active', current_period_end = ?, updated_at = CURRENT_TIMESTAMP
          WHERE stripe_subscription_id = ?
        `).run(invoice.period_end, subscriptionId);

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        console.log(`✗ Invoice payment failed: Subscription ${subscriptionId}`);

        // Mark subscription as past_due
        db.prepare(`
          UPDATE subscriptions
          SET status = 'past_due', updated_at = CURRENT_TIMESTAMP
          WHERE stripe_subscription_id = ?
        `).run(subscriptionId);

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;
        const status = subscription.status;

        console.log(`↻ Subscription updated: ${subscriptionId} → ${status}`);

        db.prepare(`
          UPDATE subscriptions
          SET status = ?, current_period_end = ?, updated_at = CURRENT_TIMESTAMP
          WHERE stripe_subscription_id = ?
        `).run(status, subscription.current_period_end, subscriptionId);

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;

        console.log(`✗ Subscription cancelled: ${subscriptionId}`);

        // Downgrade to personal tier
        db.prepare(`
          UPDATE subscriptions
          SET tier = 'personal', status = 'cancelled', updated_at = CURRENT_TIMESTAMP
          WHERE stripe_subscription_id = ?
        `).run(subscriptionId);

        // Reset usage limits
        db.prepare(`
          UPDATE usage_limits
          SET tracks_limit = 50
          WHERE user_id IN (
            SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?
          )
        `).run(subscriptionId);

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook event:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/subscription/cancel
 * Cancel subscription (downgrade to personal)
 */
router.post('/cancel', (req, res) => {
  try {
    const userId = req.body.user_id || 'default_user';
    const db = getDb();
    
    db.prepare(`
      UPDATE subscriptions 
      SET tier = 'personal', status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(userId);
    
    res.json({
      success: true,
      message: 'Subscription cancelled. Downgraded to Personal tier.'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Helper: Get features by tier
 */
function getFeaturesByTier(tier) {
  const features = {
    personal: [
      'basic_twin_generation',
      'visual_dna',
      'audio_upload_limited'
    ],
    pro: [
      'basic_twin_generation',
      'visual_dna',
      'audio_upload_unlimited',
      'dj_library_import',
      'context_comparison',
      'taste_coherence',
      'sonic_palette',
      'cross_modal_coherence',
      'export_data'
    ],
    elite: [
      'basic_twin_generation',
      'visual_dna',
      'audio_upload_unlimited',
      'dj_library_import',
      'context_comparison',
      'taste_coherence',
      'sonic_palette',
      'cross_modal_coherence',
      'export_data',
      'cultural_moments',
      'influence_genealogy',
      'rarity_scoring',
      'scene_mapping',
      'api_access',
      'priority_processing',
      'white_label'
    ]
  };
  
  return features[tier] || features.personal;
}

module.exports = router;
