const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/auth.middleware');
const chatController = require('../controllers/chat.controller');

// Validation middleware to handle errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({ field: err.param, message: err.msg }))
    });
  }
  next();
};

// All routes require authentication
router.use(verifyToken);

/**
 * GET /api/chat/conversations
 * Get all conversations for the current user
 */
router.get('/conversations', chatController.getConversations);

/**
 * GET /api/chat/conversations/:otherUserId
 * Get or create a conversation with a specific user
 */
router.get(
  '/conversations/:otherUserId',
  chatController.getOrCreateConversation
);

/**
 * POST /api/chat/users/:otherUserId/conversations/messages
 * Create conversation and send first message atomically
 * Body: { content }
 */
router.post(
  '/users/:otherUserId/conversations/messages',
  chatController.createConversationAndSendMessage
);

/**
 * GET /api/chat/conversations/:conversationId/messages
 * Get messages for a specific conversation
 * Query params: limit (default 50), offset (default 0)
 */
router.get(
  '/conversations/:conversationId/messages',
  chatController.getConversationMessages
);

/**
 * POST /api/chat/conversations/:conversationId/messages
 * Send a new message to a conversation
 * Body: { content }
 */
router.post(
  '/conversations/:conversationId/messages',
  chatController.sendMessage
);

/**
 * POST /api/chat/keys/register
 * Register user's Signal Protocol keys
 * Body: { identityKeyPair, signedPreKey, preKeys }
 */
router.post('/keys/register', chatController.registerKeys);

/**
 * GET /api/chat/keys/:userId
 * Get a user's public keys for encryption
 */
router.get('/keys/:userId', chatController.getUserPublicKeys);

/**
 * PATCH /api/chat/messages/:messageId/read
 * Mark a message as read
 */
router.patch('/messages/:messageId/read', chatController.markMessageAsRead);

/**
 * DELETE /api/chat/conversations/:conversationId
 * Delete (soft delete) a conversation
 */
router.delete(
  '/conversations/:conversationId',
  chatController.deleteConversation
);

module.exports = router;
