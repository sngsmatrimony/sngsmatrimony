const mongoose = require('mongoose');

const userKeysSchema = new mongoose.Schema({
  // Reference to the user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User keys must belong to a user'],
    unique: true,
  },

  // Signal Protocol - Identity Key Pair (persistent, long-term)
  identityKeyPair: {
    publicKey: {
      type: String, // Base64 encoded
      required: true,
    },
    privateKey: {
      type: String, // Base64 encoded - should be stored securely
      required: true,
    },
  },

  // Signal Protocol - Signed Pre Key (changes periodically)
  signedPreKey: {
    keyId: {
      type: Number,
      required: true,
    },
    publicKey: {
      type: String, // Base64 encoded
      required: true,
    },
    privateKey: {
      type: String, // Base64 encoded
      required: true,
    },
    signature: {
      type: String, // Base64 encoded - signature of public key by identity key
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },

  // Signal Protocol - Pre Keys (one-time use keys, large pool)
  preKeys: {
    type: [
      {
        keyId: Number,
        publicKey: String, // Base64 encoded
        privateKey: String, // Base64 encoded
        used: {
          type: Boolean,
          default: false,
        },
        usedAt: Date,
      },
    ],
    default: [],
  },

  // Track next pre key ID to generate
  nextPreKeyId: {
    type: Number,
    default: 1,
  },

  // Device ID for Signal Protocol
  deviceId: {
    type: Number,
    default: 1,
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

// Note: userId field already has an implicit index via unique: true constraint
// Explicit index is not needed and causes duplicate index warning

const UserKeys = mongoose.model('UserKeys', userKeysSchema);

module.exports = UserKeys;
