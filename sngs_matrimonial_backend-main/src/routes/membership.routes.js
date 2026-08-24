const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const membershipController = require('../controllers/membership.controller');
const webhookController = require('../controllers/webhook.controller');

const router = express.Router();

// Get active membership plans (public)
router.get('/plans', membershipController.getPlans);

// Get current user's membership details (protected)
router.get('/me', verifyToken, membershipController.getMyMembership);

// Create Razorpay order (protected)
router.post('/create-order', verifyToken, membershipController.createOrder);

// Get order details for payment page (protected)
router.get('/order/:orderId', verifyToken, membershipController.getOrder);

// Verify payment and activate membership (protected)
router.post('/verify-payment', verifyToken, membershipController.verifyPayment);

// Get user's transaction history (protected)
router.get('/transactions', verifyToken, membershipController.getTransactions);

// Initiate refund for transaction (admin only - protected)
router.post('/refund/:transactionId', verifyToken, membershipController.initiateRefund);

// Razorpay webhook (no authentication - Razorpay sends this)
// Use express.raw() to capture raw body for signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), webhookController.handleRazorpayWebhook);

module.exports = router;
