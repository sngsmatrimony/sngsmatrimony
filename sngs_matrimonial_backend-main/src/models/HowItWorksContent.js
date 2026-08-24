const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
  },
  { _id: false }
);

const howItWorksContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'HOW_IT_WORKS',
      enum: ['HOW_IT_WORKS'],
    },
    sectionTitle: {
      type: String,
      required: true,
      default: 'Find Your Partner In Just Few Steps',
      maxlength: 200,
    },
    sectionSubtitle: {
      type: String,
      required: true,
      default:
        'SNGS Matrimonial will help you find your perfect match with just a few steps. You focus on what is most important to you, we do all the work.',
      maxlength: 500,
    },
    steps: {
      type: [stepSchema],
      required: true,
      validate: {
        validator: function (v) {
          return v.length === 3;
        },
        message: 'Exactly 3 steps are required',
      },
      default: [
        {
          title: 'Create Profile',
          description:
            'Register to SNGS Matrimonial, fill up your profile completely, and put a beautiful image to showcase yourself.',
        },
        {
          title: 'Find Your Partner',
          description:
            "Search for interests that you like. You'll also be recommended users based on your preferences and values.",
        },
        {
          title: 'Connect & Chat',
          description:
            'Add friends, approach them, and chat with them. Be sure to share your audio, photos, and videos too.',
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('HowItWorksContent', howItWorksContentSchema);
