const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipPlan',
    required: true,
  },

  // Razorpay details
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true,
  },
  razorpayPaymentId: {
    type: String,
    default: null,
  },
  razorpaySignature: {
    type: String,
    default: null,
  },

  // Transaction details
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
  },

  // Credits info
  creditsGranted: {
    type: Number,
    required: true,
  },
  validityDays: {
    type: Number,
    required: false,
    default: null,
  },

  // Refund info
  refundId: {
    type: String,
    default: null,
  },
  refundStatus: {
    type: String,
    enum: ['pending', 'processed', 'failed'],
    default: null,
  },
  refundAmount: {
    type: Number,
    default: null,
  },
  refundReason: {
    type: String,
    default: null,
  },

  // Metadata
  failureReason: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

transactionSchema.index({ userId: 1, createdAt: -1 });
// Note: razorpayOrderId index is already created by unique: true constraint
transactionSchema.index({ status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
