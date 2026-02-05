# Stripe Integration Setup Guide

## Quick Start (5 minutes)

### 1. Install Stripe SDK
```bash
cd backend
npm install stripe
```

### 2. Get Stripe API Keys

1. Create account at https://stripe.com
2. Go to Dashboard → Developers → API keys
3. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)

### 3. Create Products & Prices

In Stripe Dashboard → Products:

**Product 1: Twin OS Pro**
- Name: "Twin OS Pro"
- Description: "Multi-dimensional taste intelligence for creative professionals"
- Price: $15.00 USD/month recurring
- Copy the **Price ID** (starts with `price_`)

**Product 2: Twin OS Elite**
- Name: "Twin OS Elite"  
- Description: "Complete aesthetic intelligence platform for tastemakers"
- Price: $50.00 USD/month recurring
- Copy the **Price ID** (starts with `price_`)

### 4. Configure Environment Variables

Create/edit `backend/.env`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PRICE_ID_PRO=price_YOUR_PRO_PRICE_ID
STRIPE_PRICE_ID_ELITE=price_YOUR_ELITE_PRICE_ID

# For production webhooks (optional in development)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

### 5. Set Up Webhooks (Optional but Recommended)

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your URL: `https://yourdomain.com/api/subscription/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`

### 6. Test the Integration

Start the backend server:
```bash
cd backend
npm start
```

Test checkout creation:
```bash
curl -X POST http://localhost:5000/api/subscription/create-checkout   -H "Content-Type: application/json"   -d '{"tier": "pro", "user_id": "test_user", "successUrl": "http://localhost:3000/success", "cancelUrl": "http://localhost:3000/cancel"}'
```

You should receive a `checkoutUrl` in the response. Open it in a browser to test the checkout flow.

### 7. Test Card Numbers

Use these test cards in Stripe Checkout:

**Success:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Decline:**
- Card: `4000 0000 0000 0002`

**Requires Authentication:**
- Card: `4000 0025 0000 3155`

## Webhook Testing

### Option 1: Stripe CLI (Recommended)

Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
curl -s https://packages.stripe.com/api/v1/keys | sudo apt-key add -
sudo apt-get update
sudo apt-get install stripe
```

Forward webhooks to localhost:
```bash
stripe login
stripe listen --forward-to localhost:5000/api/subscription/webhook
```

The CLI will output a webhook secret like `whsec_...` - add this to your `.env`.

### Option 2: ngrok (for manual testing)

```bash
ngrok http 5000
# Use the https URL as your webhook endpoint in Stripe Dashboard
```

## Production Checklist

- [ ] Replace test API key (`sk_test_...`) with live key (`sk_live_...`)
- [ ] Create production products/prices in Stripe Dashboard
- [ ] Update environment variables with production values
- [ ] Set up production webhook endpoint
- [ ] Test full checkout flow in production mode
- [ ] Enable Stripe Radar for fraud protection
- [ ] Set up billing email notifications
- [ ] Configure tax settings if applicable

## Troubleshooting

**"Stripe not configured" error:**
- Check that `STRIPE_SECRET_KEY` is set in `.env`
- Verify `npm install stripe` completed successfully
- Restart the server after adding environment variables

**"Stripe price not configured" error:**
- Check that `STRIPE_PRICE_ID_PRO` and `STRIPE_PRICE_ID_ELITE` are set
- Verify the price IDs are correct (should start with `price_`)
- Make sure prices are set to recurring/subscription mode (not one-time)

**Webhooks not receiving events:**
- Check webhook endpoint URL is correct and publicly accessible
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly
- Check server logs for webhook signature verification errors
- Use Stripe Dashboard → Developers → Webhooks → Events to see webhook attempts

**Test checkout redirecting to wrong URL:**
- Update `successUrl` and `cancelUrl` in frontend PricingPage.js
- Make sure URLs include full domain (not relative paths)

## API Endpoints

**GET /api/subscription/status**
```bash
curl http://localhost:5000/api/subscription/status?user_id=default_user
```

**POST /api/subscription/create-checkout**
```bash
curl -X POST http://localhost:5000/api/subscription/create-checkout   -H "Content-Type: application/json"   -d '{"tier": "pro", "user_id": "default_user"}'
```

**POST /api/subscription/cancel**
```bash
curl -X POST http://localhost:5000/api/subscription/cancel   -H "Content-Type: application/json"   -d '{"user_id": "default_user"}'
```

## Next Steps

Once Stripe is configured:
1. Test the full checkout flow from frontend
2. Verify subscription status updates in database
3. Test webhook events (payment success, cancellation, etc.)
4. Implement feature gating based on subscription tier
5. Add usage tracking for free tier limits
