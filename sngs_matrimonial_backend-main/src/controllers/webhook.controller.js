const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

/**
 * POST /api/membership/webhook
 * Handle Razorpay webhook events
 * Events: payment.captured, payment.failed
 */
exports.handleRazorpayWebhook = async (req, res) => {
  try {
    // Get webhook signature from headers
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return res.status(500).json({ message: 'Webhook secret not configured' });
    }

    // Verify webhook signature
    const body = req.rawBody || req.body;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(typeof body === 'string' ? body : JSON.stringify(body))
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      console.error('Invalid webhook signature:', {
        received: webhookSignature,
        expected: expectedSignature,
      });
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // Parse webhook data
    const eventData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const event = eventData.event;
    const payload = eventData.payload;

    console.log(`[Webhook] Processing event: ${event}`);

    // Handle payment.captured event
    if (event === 'payment.captured') {
      return handlePaymentCaptured(payload, res);
    }

    // Handle payment.failed event
    if (event === 'payment.failed') {
      return handlePaymentFailed(payload, res);
    }

    // Unknown event - still acknowledge receipt
    console.log(`[Webhook] Unhandled event type: ${event}`);
    res.status(200).json({ message: 'Event received' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent Razorpay from retrying
    res.status(200).json({ message: 'Webhook processed with error' });
  }
};

/**
 * Handle payment.captured event
 * Activates membership when payment is captured
 */
async function handlePaymentCaptured(payload, res) {
  try {
    const payment = payload.payment.entity;
    const razorpayOrderId = payment.order_id;
    const razorpayPaymentId = payment.id;

    console.log(`[Webhook] Processing payment.captured for order: ${razorpayOrderId}`);

    // Find transaction
    const transaction = await Transaction.findOne({
      razorpayOrderId,
      status: 'pending', // Only process pending transactions
    }).populate('planId userId');

    if (!transaction) {
      console.warn(`[Webhook] Transaction not found for order: ${razorpayOrderId}`);
      return res.status(200).json({ message: 'Transaction not found' });
    }

    // Update transaction to mark as processed
    transaction.razorpayPaymentId = razorpayPaymentId;
    transaction.status = 'success';
    transaction.updatedAt = Date.now();
    await transaction.save();

    // Activate membership
    const user = await User.findById(transaction.userId);
    if (!user) {
      console.error(`[Webhook] User not found for transaction: ${transaction._id}`);
      return res.status(200).json({ message: 'User not found' });
    }

    // Calculate expiry date (null if unlimited validity)
    const expiryDate = transaction.validityDays === null
      ? null  // Unlimited validity - no expiry
      : (() => {
          const date = new Date();
          date.setDate(date.getDate() + transaction.validityDays);
          return date;
        })();

    // Check if user has existing active membership (null expiryDate means unlimited validity)
    const hasActiveMembership =
      user.membership?.isActive &&
      (!user.membership?.expiryDate || new Date(user.membership.expiryDate) > new Date());

    if (hasActiveMembership) {
      // Add credits to existing membership
      user.membership.credits = (user.membership.credits || 0) + transaction.creditsGranted;
      // Extend expiry date if new expiry is later (or if upgrading to unlimited)
      if (expiryDate === null && user.membership.expiryDate !== null) {
        // Upgrading to unlimited validity
        user.membership.expiryDate = null;
      } else if (expiryDate !== null && user.membership.expiryDate !== null && expiryDate > new Date(user.membership.expiryDate)) {
        // Extending limited validity
        user.membership.expiryDate = expiryDate;
      } else if (expiryDate !== null && user.membership.expiryDate === null) {
        // Keep unlimited validity (don't downgrade to limited)
        // Do nothing
      }
    } else {
      // Create new membership
      user.membership.isActive = true;
      user.membership.credits = transaction.creditsGranted;
      user.membership.expiryDate = expiryDate;
      user.membership.purchasedAt = Date.now();
    }

    user.membership.planId = transaction.planId;
    await user.save();

    console.log(
      `[Webhook] Successfully activated membership for user ${user._id}, payment: ${razorpayPaymentId}`
    );

    res.status(200).json({ message: 'Payment captured and membership activated' });
  } catch (error) {
    console.error('[Webhook] Error processing payment.captured:', error);
    // Return 200 to prevent Razorpay from retrying
    res.status(200).json({ message: 'Webhook processed with error' });
  }
}

/**
 * Handle payment.failed event
 * Marks transaction as failed
 */
async function handlePaymentFailed(payload, res) {
  try {
    const payment = payload.payment.entity;
    const razorpayOrderId = payment.order_id;
    const failureReason = payment.error_description || 'Payment failed';

    console.log(`[Webhook] Processing payment.failed for order: ${razorpayOrderId}`);

    // Find and update transaction
    const transaction = await Transaction.findOne({
      razorpayOrderId,
    });

    if (!transaction) {
      console.warn(`[Webhook] Transaction not found for order: ${razorpayOrderId}`);
      return res.status(200).json({ message: 'Transaction not found' });
    }

    // Update transaction status
    transaction.status = 'failed';
    transaction.failureReason = failureReason;
    transaction.updatedAt = Date.now();
    await transaction.save();

    console.log(`[Webhook] Marked transaction as failed: ${razorpayOrderId}`);

    res.status(200).json({ message: 'Payment failed notification recorded' });
  } catch (error) {
    console.error('[Webhook] Error processing payment.failed:', error);
    // Return 200 to prevent Razorpay from retrying
    res.status(200).json({ message: 'Webhook processed with error' });
  }
}
