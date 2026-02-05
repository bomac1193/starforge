import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Pro Tier Pricing Page
 * Three-tier pricing: Personal (free), Pro ($15/mo), Elite ($50/mo)
 */
const PricingPage = () => {
  const [currentTier, setCurrentTier] = useState('personal');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await axios.get('/api/subscription/status');
      if (response.data.success) {
        setCurrentTier(response.data.tier || 'personal');
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    }
  };

  const handleUpgrade = async (tier) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/subscription/create-checkout', {
        tier,
        successUrl: window.location.origin + '/dashboard?checkout=success',
        cancelUrl: window.location.origin + '/pricing?checkout=cancelled'
      });

      if (response.data.success && response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tiers = [
    {
      id: 'personal',
      name: 'Personal',
      price: 'Free',
      priceMonthly: 0,
      description: 'For creative individuals exploring their aesthetic',
      features: [
        'Basic Twin OS generation',
        'Visual DNA from CLAROSA photos',
        'Audio upload & analysis (up to 50 tracks)',
        'Single context view',
        'Community support'
      ],
      cta: 'Current Plan',
      ctaAction: null,
      recommended: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$15',
      priceMonthly: 15,
      description: 'For multi-hyphenate creators with distinct artistic identities',
      features: [
        'Everything in Personal',
        'DJ library import (Rekordbox & Serato)',
        'Context comparison (DJ vs Personal music)',
        'Taste coherence analysis (6 metrics)',
        'Sonic palette extraction (Audio DNA)',
        'Cross-modal coherence (Visual + Audio)',
        'Unlimited track analysis',
        'Export all data (JSON, CSV)',
        'Priority email support'
      ],
      cta: 'Upgrade to Pro',
      ctaAction: () => handleUpgrade('pro'),
      recommended: true
    },
    {
      id: 'elite',
      name: 'Elite',
      price: '$50',
      priceMonthly: 50,
      description: 'For tastemakers defining culture and building communities',
      features: [
        'Everything in Pro',
        'Cultural moment detection',
        'Influence genealogy mapping',
        'Rarity scoring & uniqueness analysis',
        'Scene mapping & subculture taxonomy',
        'API access for integrations',
        'Priority processing (10x faster)',
        'White-label branding options',
        'Dedicated account manager',
        'Early access to new features'
      ],
      cta: 'Upgrade to Elite',
      ctaAction: () => handleUpgrade('elite'),
      recommended: false
    }
  ];

  return (
    <div className="min-h-screen bg-brand-bg py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-display-xl mb-4 text-brand-text">Twin OS Pro</h1>
          <p className="text-body text-brand-secondary max-w-2xl mx-auto">
            Multi-dimensional taste intelligence for creative tastemakers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier) => (
            <div key={tier.id} className={'border ' + (tier.recommended ? 'border-brand-text bg-brand-border' : 'border-brand-border') + ' p-8 relative'}>
              {tier.recommended && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-brand-text text-brand-bg px-4 py-1 text-body-sm uppercase">Recommended</span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-display-md mb-2 text-brand-text">{tier.name}</h2>
                <div className="mb-3">
                  <span className="text-h1 text-brand-text">{tier.price}</span>
                  {tier.priceMonthly > 0 && <span className="text-body text-brand-secondary">/month</span>}
                </div>
                <p className="text-body-sm text-brand-secondary">{tier.description}</p>
              </div>

              <div className="mb-8">
                <p className="uppercase-label text-brand-secondary mb-3">Included</p>
                <ul className="space-y-2">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="text-body-sm text-brand-text flex items-start">
                      <span className="mr-2">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={tier.ctaAction}
                disabled={loading || currentTier === tier.id || !tier.ctaAction}
                className={'w-full py-3 text-center transition-colors ' + (currentTier === tier.id ? 'bg-brand-border text-brand-secondary cursor-not-allowed' : tier.recommended ? 'bg-brand-text text-brand-bg hover:bg-brand-secondary' : 'border border-brand-text text-brand-text hover:bg-brand-text hover:text-brand-bg')}
              >
                {loading ? 'Loading...' : tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
