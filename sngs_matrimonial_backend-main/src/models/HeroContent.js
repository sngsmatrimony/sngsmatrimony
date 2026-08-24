const mongoose = require('mongoose');

const heroContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'HERO_CONTENT',
      enum: ['HERO_CONTENT'],
    },
    badge: {
      type: String,
      required: true,
      default: 'Welcome to SNGS Matrimonial',
      maxlength: 50,
    },
    title: {
      type: String,
      required: true,
      default: 'Find Your Perfect Match',
      maxlength: 100,
    },
    subtitle: {
      type: String,
      required: true,
      default:
        'Join thousands of individuals on their journey to find true companionship. Our secure platform connects you with compatible matches based on values, interests, and life goals.',
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('HeroContent', heroContentSchema);
