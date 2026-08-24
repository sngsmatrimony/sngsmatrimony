const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Store active user connections: userId -> socketId
const activeUsers = new Map();

// Store typing timeouts: `${conversationId}:${userId}` -> timeout
const typingTimeouts = new Map();

// Typing indicator timeout duration (5 seconds)
const TYPING_TIMEOUT_MS = 5000;

/**
 * Socket.io authentication middleware
 */
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('No authentication token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id;
    socket.user = user;
    next();
  } catch (error) {
    next(new Error(`Authentication failed: ${error.message}`));
  }
};

/**
 * Setup Socket.io event handlers for chat
 */
const setupChatSockets = (io) => {
  // Middleware for all socket connections
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const userIdStr = userId.toString();

    // Handle reconnection: disconnect old socket if user already connected
    const existingSocketId = activeUsers.get(userIdStr);
    if (existingSocketId && existingSocketId !== socket.id) {
      const existingSocket = io.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        existingSocket.disconnect(true);
      }
    }

    // Track active user
    activeUsers.set(userIdStr, socket.id);

    // Join user's personal room for direct messaging
    socket.join(`user:${userIdStr}`);

    // Broadcast user online status
    socket.broadcast.emit('user:online', { userId: userIdStr });

    /**
     * Send a new message
     */
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, recipientId, encryptedContent, type = 'text', media } = data;

        // Validate message content length (max 4000 characters)
        if (!encryptedContent || encryptedContent.length > 4000) {
          socket.emit('message:error', {
            error: encryptedContent ? 'Message too long (max 4000 characters)' : 'Message content is required'
          });
          return;
        }

        // Create or get conversation
        let conversation;
        if (conversationId) {
          conversation = await Conversation.findById(conversationId);

          // Verify user is a participant in the conversation
          if (!conversation) {
            socket.emit('message:error', { error: 'Conversation not found' });
            return;
          }

          const isParticipant = conversation.participants.some(
            (p) => p.toString() === userId.toString()
          );

          if (!isParticipant) {
            socket.emit('message:error', { error: 'You are not a participant in this conversation' });
            return;
          }
        } else {
          // Prevent self-conversation
          if (recipientId === userId.toString()) {
            socket.emit('message:error', { error: 'Cannot create conversation with yourself' });
            return;
          }

          // Create new conversation
          conversation = new Conversation({
            participants: [userId, recipientId],
            unreadCounts: new Map([[userId.toString(), 0], [recipientId.toString(), 1]]),
          });
          await conversation.save();
        }

        // Create new message
        const message = new Message({
          conversationId: conversation._id,
          senderId: userId,
          encryptedContent,
          type,
          media: media || undefined,
          deliveredTo: [recipientId],
        });

        await message.save();

        // Update conversation's last message
        conversation.lastMessage = {
          messageId: message._id,
          senderId: userId,
          preview: encryptedContent.substring(0, 50),
          timestamp: new Date(),
        };
        conversation.updatedAt = new Date();

        // Increment unread count for recipient
        const recipientIdStr = recipientId.toString();
        const currentUnread = conversation.unreadCounts.get(recipientIdStr) || 0;
        conversation.unreadCounts.set(recipientIdStr, currentUnread + 1);

        await conversation.save();

        // Emit message to recipient
        const recipientSocket = activeUsers.get(recipientIdStr);
        if (recipientSocket) {
          io.to(recipientSocket).emit('message:received', {
            message: message.toObject(),
            conversationId: conversation._id,
          });
        }

        // Emit delivery confirmation to sender
        socket.emit('message:delivered', {
          messageId: message._id,
          conversationId: conversation._id,
        });
      } catch (error) {
        socket.emit('message:error', { error: error.message || 'Failed to send message' });
      }
    });

    /**
     * Mark message as read
     */
    socket.on('message:read', async (data) => {
      try {
        const { messageId, conversationId } = data;

        // Verify user is a participant in the conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit('message:error', { error: 'Conversation not found' });
          return;
        }

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === userId.toString()
        );

        if (!isParticipant) {
          socket.emit('message:error', { error: 'You are not a participant in this conversation' });
          return;
        }

        // Get the message to find the sender
        const message = await Message.findByIdAndUpdate(
          messageId,
          {
            $addToSet: {
              readBy: {
                userId,
                readAt: new Date(),
              },
            },
          },
          { new: true }
        );

        if (!message) {
          socket.emit('message:error', { error: 'Message not found' });
          return;
        }

        // Update conversation unread count
        const currentUnread = conversation.unreadCounts.get(userIdStr) || 0;
        if (currentUnread > 0) {
          conversation.unreadCounts.set(userIdStr, 0);
          await conversation.save();
        }

        // Send read receipt ONLY to the message sender (not broadcast to all)
        const senderId = message.senderId.toString();
        const senderSocket = activeUsers.get(senderId);
        if (senderSocket) {
          io.to(senderSocket).emit('message:readReceipt', {
            messageId,
            conversationId,
            readBy: userId,
            readAt: new Date(),
          });
        }
      } catch (error) {
        socket.emit('message:error', { error: 'Failed to mark message as read' });
      }
    });

    /**
     * User is typing
     */
    socket.on('typing:start', async (data) => {
      try {
        const { conversationId, recipientId } = data;
        const recipientIdStr = recipientId.toString();
        const recipientSocket = activeUsers.get(recipientIdStr);
        const typingKey = `${conversationId}:${userIdStr}`;

        // Clear any existing timeout for this user/conversation
        const existingTimeout = typingTimeouts.get(typingKey);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        if (recipientSocket) {
          io.to(recipientSocket).emit('typing:indicator', {
            conversationId,
            userId: userIdStr,
            isTyping: true,
          });
        }

        // Set auto-clear timeout (5 seconds) in case client doesn't send typing:stop
        const timeout = setTimeout(() => {
          typingTimeouts.delete(typingKey);
          if (recipientSocket && activeUsers.get(recipientIdStr) === recipientSocket) {
            io.to(recipientSocket).emit('typing:indicator', {
              conversationId,
              userId: userIdStr,
              isTyping: false,
            });
          }
        }, TYPING_TIMEOUT_MS);

        typingTimeouts.set(typingKey, { timeout, recipientId: recipientIdStr, conversationId });
      } catch (error) {
        socket.emit('message:error', { error: 'Failed to broadcast typing status' });
      }
    });

    /**
     * User stopped typing
     */
    socket.on('typing:stop', async (data) => {
      try {
        const { conversationId, recipientId } = data;
        const recipientIdStr = recipientId.toString();
        const recipientSocket = activeUsers.get(recipientIdStr);
        const typingKey = `${conversationId}:${userIdStr}`;

        // Clear the typing timeout
        const existingTimeout = typingTimeouts.get(typingKey);
        if (existingTimeout) {
          clearTimeout(existingTimeout.timeout);
          typingTimeouts.delete(typingKey);
        }

        if (recipientSocket) {
          io.to(recipientSocket).emit('typing:indicator', {
            conversationId,
            userId: userIdStr,
            isTyping: false,
          });
        }
      } catch (error) {
        socket.emit('message:error', { error: 'Failed to broadcast typing status' });
      }
    });

    /**
     * User disconnected
     */
    socket.on('disconnect', () => {
      activeUsers.delete(userIdStr);

      // Clear all typing timeouts for this user and notify recipients
      for (const [key, value] of typingTimeouts.entries()) {
        if (key.endsWith(`:${userIdStr}`)) {
          clearTimeout(value.timeout);
          typingTimeouts.delete(key);

          // Notify the recipient that user stopped typing
          const recipientSocket = activeUsers.get(value.recipientId);
          if (recipientSocket) {
            io.to(recipientSocket).emit('typing:indicator', {
              conversationId: value.conversationId,
              userId: userIdStr,
              isTyping: false,
            });
          }
        }
      }

      // Broadcast user offline status
      io.emit('user:offline', { userId: userIdStr });
    });
  });
};

module.exports = {
  setupChatSockets,
  activeUsers,
};
