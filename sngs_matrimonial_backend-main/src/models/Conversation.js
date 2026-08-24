const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  // Participants in the conversation
  participants: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    required: [true, 'Conversation must have participants'],
    validate: [
      function (val) {
        return val.length === 2;
      },
      'Conversation must have exactly 2 participants',
    ],
  },

  // Last message reference (for quick preview)
  lastMessage: {
    messageId: mongoose.Schema.Types.ObjectId,
    senderId: mongoose.Schema.Types.ObjectId,
    preview: String, // Decrypted preview (optional, can be encrypted)
    timestamp: Date,
  },

  // Track unread counts per participant
  unreadCounts: {
    type: Map,
    of: Number,
    default: new Map(),
  },

  // Soft delete tracking
  deletedBy: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: [],
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Validate participants exist ONLY when creating new conversation or modifying participants
conversationSchema.pre('save', async function (next) {
  // Only validate if this is a new conversation or participants array was modified
  if (!this.isNew && !this.isModified('participants')) {
    return next();
  }

  const User = mongoose.model('User');

  for (const participantId of this.participants) {
    const userExists = await User.findById(participantId);
    if (!userExists) {
      const error = new Error(`Participant ${participantId} does not exist`);
      error.name = 'ValidationError';
      return next(error);
    }
  }

  next();
});

// Index for quick participant lookups
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
