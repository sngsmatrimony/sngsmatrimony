const mongoose = require('mongoose');

const membershipPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD'],
    },
  },
  validityDays: {
    type: Number,
    required: false,
    default: null,
    min: 1,
    validate: {
      validator: function(v) {
        return v === null || v >= 1;
      },
      message: 'Validity days must be null (unlimited) or at least 1'
    }
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
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

// Only one default plan allowed
membershipPlanSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  this.updatedAt = Date.now();
  next();
});

membershipPlanSchema.index({ isActive: 1, isDefault: 1 });

module.exports = mongoose.model('MembershipPlan', membershipPlanSchema);
