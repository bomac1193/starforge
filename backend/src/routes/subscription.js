const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

/**
 * Subscription Routes
 * Handles Pro/Elite tier subscriptions with Stripe
 * 
 * NOTE: This is a placeholder implementation.
 * For production, you need to:
 * 1. Install stripe: npm install stripe
 * 2. Set STRIPE_SECRET_KEY in environment
 * 3. Set up Stripe webhook endpoint
 * 4. Configure Stripe product/price IDs
 */

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
    
    // TODO: Implement Stripe checkout
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const session = await stripe.checkout.sessions.create({...});
    
    // For now, return placeholder
    res.json({
      success: false,
      error: 'Stripe integration not yet configured',
      message: 'To enable payments, configure Stripe in backend/src/routes/subscription.js',
      tier,
      price: tier === 'pro' ? 15 : 50
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
 */
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    // TODO: Verify webhook signature
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    // Handle events: checkout.session.completed, invoice.paid, etc.
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
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
