const User = require('../models/User');
const MembershipPlan = require('../models/MembershipPlan');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');
const Razorpay = require('razorpay');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * GET /api/membership/plans
 * Get all active membership plans
 */
exports.getPlans = async (req, res) => {
  try {
    const plans = await MembershipPlan.find({ isActive: true }).sort({ price: 1 });

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ message: 'Error fetching membership plans' });
  }
};

/**
 * GET /api/membership/me
 * Get current user's membership details
 */
exports.getMyMembership = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .select('membership')
      .populate('membership.planId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if membership has expired
    const isExpired = user.membership.expiryDate &&
                      new Date(user.membership.expiryDate) < new Date();

    res.status(200).json({
      success: true,
      data: {
        ...user.membership.toObject(),
        isExpired,
      },
    });
  } catch (error) {
    console.error('Error fetching membership:', error);
    res.status(500).json({ message: 'Error fetching membership details' });
  }
};

/**
 * POST /api/membership/create-order
 * Create Razorpay order
 */
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.body;

    // Validate plan
    const plan = await MembershipPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ message: 'Invalid or inactive plan' });
    }

    // Create Razorpay order
    const options = {
      amount: plan.price.amount * 100, // Convert to paise
      currency: plan.price.currency,
      receipt: `rcpt_${Date.now()}`, // Must be <= 40 characters
      notes: {
        userId,
        planId: plan._id.toString(),
        credits: plan.credits,
        validityDays: plan.validityDays,
      },
    };

    const order = await razorpay.orders.create(options);

    // Create transaction record
    const transaction = await Transaction.create({
      userId,
      planId,
      razorpayOrderId: order.id,
      amount: plan.price.amount,
      currency: plan.price.currency,
      creditsGranted: plan.credits,
      validityDays: plan.validityDays,
      status: 'pending',
    });

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount, // Return order amount in paise
        currency: plan.price.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        planName: plan.name,
        credits: plan.credits,
        validityDays: plan.validityDays,
      },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating payment order' });
  }
};

/**
 * GET /api/membership/order/:orderId
 * Fetch order details for payment page
 */
exports.getOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    // Find transaction by Razorpay order ID
    const transaction = await Transaction.findOne({
      razorpayOrderId: orderId,
      userId,
      status: 'pending', // Only allow pending orders
    }).populate('planId');

    if (!transaction) {
      return res.status(404).json({ message: 'Order not found or already processed' });
    }

    // Return order details
    res.status(200).json({
      success: true,
      data: {
        orderId: transaction.razorpayOrderId,
        amount: transaction.amount * 100, // Convert to paise for frontend
        currency: transaction.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        planName: transaction.planId.name,
        credits: transaction.creditsGranted,
        validityDays: transaction.validityDays,
      },
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order details' });
  }
};

/**
 * POST /api/membership/verify-payment
 * Verify Razorpay payment and activate membership
 */
exports.verifyPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      // Mark transaction as failed
      await Transaction.updateOne(
        { razorpayOrderId: razorpay_order_id },
        {
          status: 'failed',
          failureReason: 'Invalid signature',
          updatedAt: Date.now(),
        }
      );

      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Get transaction
    const transaction = await Transaction.findOne({ razorpayOrderId: razorpay_order_id });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Update transaction
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    transaction.status = 'success';
    transaction.updatedAt = Date.now();
    await transaction.save();

    // Activate membership
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate expiry date (null if unlimited validity)
    const expiryDate = transaction.validityDays === null
      ? null  // Unlimited validity - no expiry
      : (() => {
          const date = new Date();
          date.setDate(date.getDate() + transaction.validityDays);
          return date;
        })();

    // If user has existing active membership with credits, add to existing credits
    // Otherwise, set new membership
    if (user.membership.isActive && user.membership.expiryDate && new Date(user.membership.expiryDate) > new Date()) {
      user.membership.credits += transaction.creditsGranted;
      // Extend expiry date if new expiry is later
      if (expiryDate !== null && (!user.membership.expiryDate || expiryDate > user.membership.expiryDate)) {
        user.membership.expiryDate = expiryDate;
      } else if (expiryDate === null && user.membership.expiryDate !== null) {
        // If upgrading to unlimited, remove expiry
        user.membership.expiryDate = null;
      }
    } else {
      user.membership.isActive = true;
      user.membership.credits = transaction.creditsGranted;
      user.membership.expiryDate = expiryDate;
      user.membership.purchasedAt = Date.now();
    }

    user.membership.planId = transaction.planId;
    
    // Save with validateModifiedOnly to avoid validation errors on unchanged required fields
    await user.save({ validateModifiedOnly: true });

    res.status(200).json({
      success: true,
      message: 'Payment verified and membership activated',
      data: {
        credits: user.membership.credits,
        expiryDate: user.membership.expiryDate,
      },
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Error verifying payment' });
  }
};

/**
 * GET /api/membership/transactions
 * Get user's transaction history
 */
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    const transactions = await Transaction.find({ userId })
      .populate('planId', 'name credits validityDays')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

/**
 * POST /api/membership/refund/:transactionId
 * Initiate refund for a transaction (admin only)
 */
exports.initiateRefund = async (req, res) => {
  try {
    const userId = req.user.id;
    const { transactionId } = req.params;
    const { amount, reason } = req.body;

    // Verify user is admin
    const admin = await User.findById(userId);
    if (admin.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can initiate refunds' });
    }

    // Find transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'success') {
      return res.status(400).json({ message: 'Can only refund successful transactions' });
    }

    // Validate refund amount
    const refundAmount = amount || transaction.amount;
    if (refundAmount > transaction.amount) {
      return res.status(400).json({ message: 'Refund amount exceeds transaction amount' });
    }

    // Create refund on Razorpay
    const refund = await razorpay.payments.refund(
      transaction.razorpayPaymentId,
      {
        amount: Math.round(refundAmount * 100), // Convert to paise
        notes: {
          reason: reason || 'Refund requested',
          initiatedBy: userId,
        },
      }
    );

    // Update transaction with refund details
    transaction.refundId = refund.id;
    transaction.refundStatus = refund.status === 'processed' ? 'processed' : 'pending';
    transaction.refundAmount = refundAmount;
    transaction.refundReason = reason;
    transaction.updatedAt = Date.now();
    await transaction.save();

    // Deduct credits from user if full refund
    if (refundAmount === transaction.amount) {
      const user = await User.findById(transaction.userId);
      if (user && user.membership) {
        user.membership.credits = Math.max(0, user.membership.credits - transaction.creditsGranted);
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Refund initiated successfully',
      data: {
        refundId: refund.id,
        refundStatus: transaction.refundStatus,
        refundAmount: refundAmount,
      },
    });
  } catch (error) {
    console.error('Error initiating refund:', error);
    res.status(500).json({ message: 'Error initiating refund' });
  }
};
