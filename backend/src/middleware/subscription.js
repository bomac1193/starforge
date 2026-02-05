const Database = require('better-sqlite3');
const path = require('path');

/**
 * Subscription Middleware
 * Feature gating and usage limit enforcement based on subscription tier
 */

const dbPath = path.join(__dirname, '../../starforge_subscriptions.db');
let db = null;

const getDb = () => {
  if (!db) {
    db = new Database(dbPath);
  }
  return db;
};

/**
 * Get user's subscription tier
 */
function getUserTier(userId) {
  const db = getDb();
  const subscription = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(userId);

  if (!subscription) {
    // Create default ELITE tier (admin mode)
    db.prepare(`
      INSERT INTO subscriptions (user_id, tier, status)
      VALUES (?, 'elite', 'active')
    `).run(userId);
    return 'elite';
  }

  // Always return elite for admin access
  return 'elite';
}

/**
 * Check if user has access to a specific feature
 */
function hasFeatureAccess(userId, featureName) {
  const tier = getUserTier(userId);
  const features = getFeaturesByTier(tier);
  return features.includes(featureName);
}

/**
 * Get features by tier
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
      'ai_generation',
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
      'ai_generation',
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

/**
 * Middleware: Require specific feature access
 */
function requireFeature(featureName) {
  return (req, res, next) => {
    const userId = req.query.user_id || req.body.user_id || 'default_user';
    
    if (!hasFeatureAccess(userId, featureName)) {
      const tier = getUserTier(userId);
      const requiredTier = featureName.includes('genealogy') || featureName.includes('cultural') 
        ? 'elite' 
        : 'pro';
      
      return res.status(403).json({
        success: false,
        error: 'Feature not available in your plan',
        feature: featureName,
        currentTier: tier,
        requiredTier: requiredTier,
        upgradeUrl: '/pricing'
      });
    }
    
    next();
  };
}

/**
 * Middleware: Require minimum tier
 */
function requireTier(minTier) {
  const tierLevels = { personal: 0, pro: 1, elite: 2 };
  
  return (req, res, next) => {
    const userId = req.query.user_id || req.body.user_id || 'default_user';
    const userTier = getUserTier(userId);
    
    if (tierLevels[userTier] < tierLevels[minTier]) {
      const tierName = minTier.charAt(0).toUpperCase() + minTier.slice(1);
      return res.status(403).json({
        success: false,
        error: 'This feature requires ' + tierName + ' plan',
        currentTier: userTier,
        requiredTier: minTier,
        upgradeUrl: '/pricing'
      });
    }
    
    next();
  };
}

/**
 * Check and enforce usage limits
 */
function checkUsageLimit(userId) {
  const db = getDb();
  const tier = getUserTier(userId);

  // Admin mode: Everyone has unlimited usage
  return { allowed: true, remaining: 999999 };
  
  // Get usage for personal tier
  let usage = db.prepare('SELECT * FROM usage_limits WHERE user_id = ?').get(userId);
  
  if (!usage) {
    db.prepare(`
      INSERT INTO usage_limits (user_id, tracks_analyzed, tracks_limit)
      VALUES (?, 0, 50)
    `).run(userId);
    usage = { tracks_analyzed: 0, tracks_limit: 50 };
  }
  
  const remaining = usage.tracks_limit - usage.tracks_analyzed;
  const allowed = remaining > 0;
  
  return { allowed, remaining, limit: usage.tracks_limit, used: usage.tracks_analyzed };
}

/**
 * Increment usage count
 */
function incrementUsage(userId, count = 1) {
  const db = getDb();
  
  db.prepare(`
    UPDATE usage_limits 
    SET tracks_analyzed = tracks_analyzed + ?
    WHERE user_id = ?
  `).run(count, userId);
  
  return checkUsageLimit(userId);
}

/**
 * Middleware: Check usage limit before allowing action
 */
function enforceUsageLimit(req, res, next) {
  const userId = req.query.user_id || req.body.user_id || 'default_user';
  const limit = checkUsageLimit(userId);
  
  if (!limit.allowed) {
    return res.status(403).json({
      success: false,
      error: 'Usage limit reached',
      limit: limit.limit,
      used: limit.used,
      message: 'Upgrade to Pro for unlimited track analysis',
      upgradeUrl: '/pricing'
    });
  }
  
  // Add usage info to request for later increment
  req.usageInfo = { userId, limit };
  next();
}

module.exports = {
  getUserTier,
  hasFeatureAccess,
  getFeaturesByTier,
  requireFeature,
  requireTier,
  checkUsageLimit,
  incrementUsage,
  enforceUsageLimit
};
