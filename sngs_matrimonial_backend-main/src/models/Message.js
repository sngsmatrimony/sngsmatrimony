const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Reference to the conversation
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: [true, 'Message must belong to a conversation'],
  },

  // Sender of the message
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Message must have a sender'],
  },

  // Encrypted message content (Signal Protocol encrypted)
  encryptedContent: {
    type: String,
    required: [true, 'Message content is required'],
  },

  // Message type (for future: text, image, video, etc.)
  type: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text',
  },

  // For media files (images, files)
  media: {
    url: String,
    type: String, // e.g., 'image/jpeg', 'application/pdf'
    size: Number, // in bytes
  },

  // Track delivery status
  deliveredTo: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: [],
  },

  // Track read receipts
  readBy: {
    type: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    default: [],
  },

  // Soft delete tracking (users who deleted this message)
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
});

// Automatically delete messages older than 30 days
// This is handled by a cron job in the service layer
// TTL index for automatic deletion after 30 days (2592000 seconds)
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

// Index for quick message lookups by conversation
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Index for sender lookups
messageSchema.index({ senderId: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
