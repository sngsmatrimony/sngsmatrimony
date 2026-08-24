# Production Deployment Guide - Razorpay Payment System

This guide provides step-by-step instructions for deploying the SNGS Matrimonial payment system to production with Razorpay.

## Overview

The payment system consists of:

- **Frontend**: Dedicated payment page with black background (`/payment/[orderId]`)
- **Backend**: RESTful API with order creation, verification, and webhook handling
- **Database**: MongoDB with transaction logging
- **Payment Gateway**: Razorpay (Standard Checkout)
- **Webhooks**: Automated payment confirmation from Razorpay

---

## Pre-Deployment Checklist

### 1. Razorpay Account Setup

#### Get Live API Keys

- [ ] Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
- [ ] Navigate to **Settings → API Keys**
- [ ] Switch to **Live Mode** (top toggle)
- [ ] Click "Generate Live Key"
- [ ] Copy `Key ID` (starts with `rzp_live_`)
- [ ] Copy `Key Secret` (keep this secure!)

#### Enable Payment Methods

- [ ] Go to **Settings → Configuration → Payment Methods**
- [ ] Enable all desired methods:
  - ✅ Cards (Debit/Credit)
  - ✅ UPI
  - ✅ Netbanking
  - ✅ Wallets (Paytm, PhonePe, Google Pay, etc.)
  - ✅ EMI (optional)

### 2. Domain & SSL Setup

- [ ] Ensure your domain has a valid **SSL certificate** (HTTPS required)
- [ ] Update frontend API URL to HTTPS:

  ```env
  REACT_APP_API_URL=https://yourdomain.com
  ```

### 3. Backend Environment Configuration

Update `.env` file in backend with production values:

```env
# Server
NODE_ENV=production
PORT=4000

# Database
MONGODB_URI=your_production_mongodb_uri

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_production_supabase_service_role_key
SUPABASE_BUCKET=media

# JWT
JWT_SECRET=your_production_jwt_secret
JWT_EXPIRE=7d

# Razorpay (LIVE KEYS)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx        # ← LIVE KEY
RAZORPAY_KEY_SECRET=your_live_key_secret     # ← KEEP SECURE!
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret  # ← From next step
```

Keep `SUPABASE_SERVICE_ROLE_KEY` on the backend only. The migrated media URLs currently use the public Storage URL format; use a private bucket and signed URLs before production if horoscope documents or profile media require access control. Never commit `backend_env.txt` or any file containing real credentials, and rotate credentials that have previously been committed or shared.

### 4. Razorpay Webhook Setup

**This is CRITICAL for production** - webhooks ensure payments are confirmed even if the user closes their browser.

#### Create Webhook in Razorpay Dashboard

1. **Navigate to Webhooks**
   - Go to **Settings → Webhooks** in Razorpay Dashboard

2. **Add New Webhook**
   - **Webhook URL**: `https://yourdomain.com/api/membership/webhook`
   - **Alert Email**: <your-support@yourdomain.com>
   - **Events to Send**:
     - ✅ `payment.captured` - Payment successful
     - ✅ `payment.failed` - Payment failed
   - Click "Create Webhook"

3. **Copy Webhook Secret**
   - The secret will be displayed after creation
   - Add to your backend `.env`:

     ```env
     RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
     ```

4. **Test Webhook Delivery**
   - In Razorpay Dashboard, click your webhook
   - Click "Send Test Event"
   - Check your server logs to verify delivery:

     ```txt
     [Webhook] Processing event: payment.captured
     ```

---

## Deployment Steps

### Step 1: Backend Deployment

```bash
# Navigate to backend directory
cd sngs_matrimonial_backend

# Install dependencies
npm install

# Build (if using TypeScript)
npm run build

# Start production server
npm start
# Or use a process manager like PM2:
pm2 start "npm start" --name "sngs-matrimonial-api"
```

### Step 2: Frontend Deployment

```bash
# Navigate to frontend directory
cd sngs_matrimonial_frontend

# Build
npm run build

# Deploy to Vercel (recommended for Next.js):
vercel --prod

# Or deploy to your server:
# Copy .next, public, node_modules to production server
# Run: npm start
```

### Step 3: Verify Deployment

```bash
# Check health endpoint
curl https://yourdomain.com/api/health
# Expected response: { "status": "success", "message": "Server is running" }

# Check webhook endpoint is accessible
curl -X POST https://yourdomain.com/api/membership/webhook
# Should respond (won't process without valid signature)
```

---

## Testing Payment Flow

### 1. Test with Small Amounts

Start with test payments of ₹1-10 to verify:

```txt
Test Flow:
1. Navigate to https://yourdomain.com/membership/purchase
2. Click "Proceed to Secure Payment"
3. Should redirect to /payment/[orderId]
4. Page should show black background with "Loading payment gateway..."
5. Razorpay modal should auto-open
```

### 2. Complete Test Payment

Use Razorpay test card:

```txt
Card Number: 4111 1111 1111 1111
Expiry:      12/25
CVV:         123
OTP:         123456 (if prompted)
```

### 3. Verify Payment Success

After payment:

- [ ] User is redirected to success screen
- [ ] Transaction ID is displayed
- [ ] Credits are added to user account
- [ ] Membership status shows as "active"
- [ ] Check webhook logs in Razorpay Dashboard - should show "Delivered"

### 4. Test Webhook Delivery

The webhook should:

- [ ] Update transaction status to "success"
- [ ] Add credits to user membership
- [ ] Set membership expiry date

Check backend logs:

```txt
[Webhook] Processing event: payment.captured
[Webhook] Successfully activated membership for user [userId], payment: [paymentId]
```

### 5. Test Error Scenarios

- [ ] **Cancel Payment**: Close Razorpay modal → should redirect to `/membership/purchase`
- [ ] **Failed Payment**: Use declined test card `4000000000000002` → transaction marked as failed
- [ ] **Invalid Order**: Manually navigate to invalid order ID → redirects to purchase page

---

## Monitoring & Maintenance

### Payment Monitoring

**Daily Checks:**

```bash
# Check transaction success rate
db.transactions.find({ status: 'success' }).count()
db.transactions.find({ status: 'failed' }).count()
db.transactions.find({ status: 'pending' }).count()
```

**Monitor Webhook Delivery:**

- [ ] Razorpay Dashboard → Webhooks → Logs
- [ ] Look for any failed deliveries
- [ ] Set up alerts for webhook failures

### Logs to Monitor

**Backend Logs** (check for errors):

```txt
[Webhook] Processing event: payment.captured
ERROR: Webhook processing error:
[Webhook] Invalid webhook signature
```

**Database Logs:**

```txt
db.transactions.find({ status: 'failed' }).sort({ createdAt: -1 })
```

---

## Common Issues & Solutions

### Issue: Razorpay Modal Not Opening

**Symptoms**: Black screen appears, modal doesn't open

**Solutions**:

1. Verify Razorpay script loaded: Check browser console for script load error
2. Verify API key: Ensure `RAZORPAY_KEY_ID` is set correctly in backend
3. Check network tab: Verify order creation API call succeeds
4. Verify order fetch: Check if `/api/membership/order/:orderId` returns valid data

### Issue: Payment Success But Credits Not Added

**Symptoms**: User completes payment, sees success screen, but credits aren't added

**Possible Causes**:

1. **Webhook not configured**: Set up webhook in Razorpay Dashboard
2. **Webhook not reaching server**: Check if server is accessible from Razorpay
3. **Invalid RAZORPAY_WEBHOOK_SECRET**: Verify secret matches Razorpay Dashboard
4. **SSL issue**: Ensure HTTPS is working correctly

**Debug Steps**:

```bash
# Check webhook logs in Razorpay Dashboard
# Settings → Webhooks → Click webhook → View Logs

# Check server logs for webhook processing
tail -f /path/to/backend/logs.txt | grep Webhook

# Check database for transaction status
db.transactions.findOne({ razorpayOrderId: 'order_xyz' })
```

### Issue: Webhook Delivery Failures

**Symptoms**: Webhook shows "Pending" or "Failed" in Razorpay Dashboard

**Causes & Solutions**:

1. **Server not accessible**: Verify domain is accessible from internet
2. **SSL certificate invalid**: Ensure valid certificate
3. **Incorrect webhook URL**: Verify URL in Razorpay Dashboard
4. **Server error on webhook endpoint**: Check backend logs for errors
5. **Network firewall**: Whitelist Razorpay IP ranges (if applicable)

**Razorpay IP Ranges**:
Razorpay may send from multiple IPs. If you have a firewall, whitelist:

- Check latest ranges: <https://razorpay.com/docs/>

---

## Refund Management

### Admin Refund Process

To refund a payment:

```bash
# API endpoint
POST /api/membership/refund/:transactionId
Authorization: Bearer {admin_token}

# Request body
{
  "amount": 1000,              # Optional, defaults to full amount
  "reason": "Customer request" # Optional
}

# Response
{
  "success": true,
  "message": "Refund initiated successfully",
  "data": {
    "refundId": "rfnd_xyz",
    "refundStatus": "processed",
    "refundAmount": 1000
  }
}
```

**Note**: User can use this endpoint to initiate refunds through an admin panel.

---

## Transaction Analytics

### Key Metrics to Track

```javascript
// Success rate
const successCount = await Transaction.countDocuments({ status: 'success' });
const failureCount = await Transaction.countDocuments({ status: 'failed' });
const successRate = (successCount / (successCount + failureCount)) * 100;

// Revenue
const totalRevenue = await Transaction.aggregate([
  { $match: { status: 'success' } },
  { $group: { _id: null, total: { $sum: '$amount' } } }
]);

// Credits sold
const creditsSold = await Transaction.aggregate([
  { $match: { status: 'success' } },
  { $group: { _id: null, total: { $sum: '$creditsGranted' } } }
]);

// Popular plans
const topPlans = await Transaction.aggregate([
  { $match: { status: 'success' } },
  { $group: { _id: '$planId', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);
```

---

## Security Checklist

- [ ] **API Keys**: Stored securely in environment variables
- [ ] **Webhook Secret**: Stored in `.env`, never exposed
- [ ] **HTTPS**: All payment endpoints use HTTPS
- [ ] **JWT Tokens**: Protected routes require valid JWT
- [ ] **Order Ownership**: Users can only pay for their own orders
- [ ] **Amount Validation**: Backend validates plan amounts
- [ ] **Signature Verification**: All webhooks verified with HMAC SHA256
- [ ] **Rate Limiting**: Consider adding rate limiting for API endpoints
- [ ] **Logging**: All payment events logged for audit trail
- [ ] **No Payment Storage**: Card details handled by Razorpay, never stored

---

## Rollback Plan

If critical issues occur:

```bash
# Keep backup of last stable version
git tag production-stable
git push origin production-stable

# Rollback to previous version
git checkout production-stable
npm install
npm start
```

---

## Support & Documentation

- **Razorpay Dashboard**: <https://dashboard.razorpay.com>
- **Razorpay API Docs**: <https://razorpay.com/docs/>
- **Payment Integration Guide**: <https://razorpay.com/docs/payments/>
- **Webhook Documentation**: <https://razorpay.com/docs/webhooks/>
- **Test Card Details**: <https://razorpay.com/docs/payments/test/>

---

## Contact & Escalation

For issues or questions:

1. Check Razorpay Dashboard logs
2. Check server application logs
3. Check database transaction records
4. Contact Razorpay support if payment gateway issue
5. Contact development team for backend issues

---

**Last Updated**: 2025-12-28
**Version**: 1.0.0
