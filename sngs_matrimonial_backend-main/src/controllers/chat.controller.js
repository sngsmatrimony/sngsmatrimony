const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const UserKeys = require('../models/UserKeys');
const { activeUsers } = require('../sockets/chat.socket');

/**
 * Get all conversations for the current user
 * Only returns conversations that have at least one message
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
      deletedBy: { $ne: userId },
      // Now returns all conversations, including empty ones without messages
    })
      .populate({
        path: 'participants',
        select: 'fullName profilePicture',
      })
      .sort({ updatedAt: -1 });

    // Convert to plain objects and include unread count for this user
    const conversationsWithUnread = conversations
      .map((conv) => {
        const plainConv = conv.toObject();

        // Filter out null/undefined participants
        const validParticipants = (plainConv.participants || []).filter(
          (p) => p !== null && p !== undefined && p._id
        );

        // Skip conversations with invalid participants
        if (validParticipants.length < 2) {
          console.warn(
            `Conversation ${plainConv._id} has invalid participants. Skipping.`
          );
          return null;
        }

        const otherParticipant = validParticipants.find(
          (p) => p._id.toString() !== userId.toString()
        );

        if (!otherParticipant || !otherParticipant.fullName) {
          console.error(
            `No valid otherParticipant for conversation ${plainConv._id}`
          );
          return null;
        }

        return {
          ...plainConv,
          participants: validParticipants,
          unreadCount: conv.unreadCounts?.get(userId.toString()) || 0,
          otherParticipant,
        };
      })
      .filter((conv) => conv !== null); // Remove invalid conversations

    res.status(200).json({
      success: true,
      data: conversationsWithUnread,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations',
      error: error.message,
    });
  }
};

/**
 * Get or create a conversation with a specific user
 */
exports.getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { otherUserId } = req.params;

    // Prevent self-conversation
    if (otherUserId === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create conversation with yourself',
      });
    }

    // Validate that otherUserId exists
    const User = require('../models/User');
    const otherUserExists = await User.findById(otherUserId);
    if (!otherUserExists) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] },
      deletedBy: { $ne: userId },
    })
      .populate({
        path: 'participants',
        select: 'fullName profilePicture',
      });

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [userId, otherUserId],
        unreadCounts: new Map([
          [userId.toString(), 0],
          [otherUserId.toString(), 0],
        ]),
      });
      await conversation.save();

      conversation = await Conversation.findById(conversation._id)
        .populate({
          path: 'participants',
          select: 'fullName profilePicture',
        });
    }

    const plainConv = conversation.toObject();

    // Filter out null/undefined participants
    const validParticipants = (plainConv.participants || []).filter(
      (p) => p !== null && p !== undefined && p._id
    );

    if (validParticipants.length < 2) {
      return res.status(500).json({
        success: false,
        message: 'Conversation has invalid participants',
      });
    }

    const otherParticipant = validParticipants.find(
      (p) => p._id.toString() !== userId.toString()
    );

    if (!otherParticipant) {
      return res.status(500).json({
        success: false,
        message: 'Could not find other participant',
      });
    }

    const unreadCount = conversation.unreadCounts?.get(userId.toString()) || 0;

    res.status(200).json({
      success: true,
      data: {
        ...plainConv,
        participants: validParticipants,
        unreadCount,
        otherParticipant,
      },
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting conversation',
      error: error.message,
    });
  }
};

/**
 * Create conversation with user and send first message
 * Atomic operation to avoid empty conversations
 */
exports.createConversationAndSendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { otherUserId } = req.params;
    const { content } = req.body;

    // Validate input
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }

    // Validate message length (max 4000 characters)
    if (content.length > 4000) {
      return res.status(400).json({
        success: false,
        message: 'Message too long (max 4000 characters)',
      });
    }

    // Prevent self-conversation
    if (otherUserId === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create conversation with yourself',
      });
    }

    // Validate that otherUserId exists
    const User = require('../models/User');
    const otherUserExists = await User.findById(otherUserId);
    if (!otherUserExists) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] },
      deletedBy: { $ne: userId },
    });

    // If conversation doesn't exist, create it
    if (!conversation) {
      conversation = new Conversation({
        participants: [userId, otherUserId],
        unreadCounts: new Map([
          [userId.toString(), 0],
          [otherUserId.toString(), 0],
        ]),
      });
      await conversation.save();
    }

    // Create and send the message
    const newMessage = new Message({
      conversationId: conversation._id,
      senderId: userId,
      encryptedContent: content,
      type: 'text',
      deliveredTo: [userId],
    });

    await newMessage.save();

    // Populate sender details
    const populatedMessage = await Message.findById(newMessage._id).populate({
      path: 'senderId',
      select: 'fullName profilePicture.url',
    });

    // Update conversation with last message
    conversation.lastMessage = {
      messageId: newMessage._id,
      senderId: userId,
      preview: content.substring(0, 100),
      timestamp: new Date(),
    };

    // Increment unread count for the other participant
    const currentUnread = conversation.unreadCounts.get(otherUserId.toString()) || 0;
    conversation.unreadCounts.set(otherUserId.toString(), currentUnread + 1);
    conversation.updatedAt = new Date();

    await conversation.save();

    // Populate conversation participants
    await conversation.populate({
      path: 'participants',
      select: 'fullName profilePicture',
    });

    // Prepare response
    const plainConv = conversation.toObject();

    // Filter out null/undefined participants
    const validParticipants = (plainConv.participants || []).filter(
      (p) => p !== null && p !== undefined && p._id
    );

    if (validParticipants.length < 2) {
      return res.status(500).json({
        success: false,
        message: 'Conversation has invalid participants',
      });
    }

    const otherParticipant = validParticipants.find(
      (p) => p._id.toString() !== userId.toString()
    );

    if (!otherParticipant) {
      return res.status(500).json({
        success: false,
        message: 'Could not find other participant',
      });
    }

    // Find the recipient (the user who is NOT the sender)
    const recipientIdForMessage = otherUserId;

    // Check if the recipient has read the message (will be false for new messages)
    const isReadByRecipient = populatedMessage.readBy.some(
      (read) => read.userId.toString() === recipientIdForMessage.toString()
    );

    const transformedMessage = {
      _id: populatedMessage._id,
      id: populatedMessage._id,
      conversationId: populatedMessage.conversationId,
      content: populatedMessage.encryptedContent,
      timestamp: populatedMessage.createdAt,
      senderId: populatedMessage.senderId._id,
      senderName: populatedMessage.senderId.fullName,
      senderProfilePicture: populatedMessage.senderId.profilePicture?.url,
      type: populatedMessage.type,
      isDelivered: true,
      isRead: isReadByRecipient,
    };

    // Emit socket event for real-time updates to the recipient
    const io = req.app.io;
    if (io) {
      const recipientSocket = activeUsers.get(otherUserId.toString());
      if (recipientSocket) {
        io.to(recipientSocket).emit('message:received', {
          message: transformedMessage,
          conversationId: conversation._id.toString(),
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        conversation: {
          ...plainConv,
          participants: validParticipants,
          unreadCount: 0,
          otherParticipant,
        },
        message: transformedMessage,
      },
    });
  } catch (error) {
    console.error('Error creating conversation and sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating conversation and sending message',
      error: error.message,
    });
  }
};

/**
 * Get messages for a specific conversation
 */
exports.getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Fetch conversation to get participants for read receipt calculation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const messages = await Message.find({
      conversationId,
      deletedBy: { $ne: req.user._id },
    })
      .populate({
        path: 'senderId',
        select: 'fullName profilePicture.url _id',
      })
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .lean(); // Return plain JS objects for faster read

    // Transform messages to match frontend expectations
    const transformedMessages = messages.map((msg) => {
      // Find the recipient (the user who is NOT the sender)
      const recipientId = conversation.participants.find(
        (participantId) => participantId.toString() !== msg.senderId._id.toString()
      );

      // Check if the recipient has read the message
      const isReadByRecipient = msg.readBy.some(
        (read) => read.userId.toString() === recipientId.toString()
      );

      return {
        _id: msg._id,
        id: msg._id, // Backward compatibility
        conversationId: msg.conversationId,
        content: msg.encryptedContent, // Map encryptedContent to content
        timestamp: msg.createdAt, // Map createdAt to timestamp
        senderId: msg.senderId._id || msg.senderId,
        senderName: msg.senderId.fullName,
        senderProfilePicture: msg.senderId.profilePicture?.url,
        type: msg.type,
        isDelivered: msg.deliveredTo.length > 0,
        isRead: isReadByRecipient,
      };
    });

    // Reverse to get chronological order
    transformedMessages.reverse();

    res.status(200).json({
      success: true,
      data: transformedMessages,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message,
    });
  }
};

/**
 * Send a new message to a conversation
 */
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }

    // Validate message length (max 4000 characters)
    if (content.length > 4000) {
      return res.status(400).json({
        success: false,
        message: 'Message too long (max 4000 characters)',
      });
    }

    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    // Verify user is a participant
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation',
      });
    }

    // Create the message
    const newMessage = new Message({
      conversationId,
      senderId: userId,
      encryptedContent: content, // For MVP, storing as plain text. Encryption to be added later
      type: 'text',
      deliveredTo: [userId], // Mark as delivered to sender
    });

    await newMessage.save();

    // Populate sender details
    const populatedMessage = await Message.findById(newMessage._id).populate({
      path: 'senderId',
      select: 'fullName profilePicture.url',
    });

    // Get the other participant
    const otherParticipantId = conversation.participants.find(
      (id) => id.toString() !== userId.toString()
    );

    // Update conversation with last message
    conversation.lastMessage = {
      messageId: newMessage._id,
      senderId: userId,
      preview: content.substring(0, 100), // First 100 chars as preview
      timestamp: new Date(),
    };

    // Increment unread count for the other participant
    const currentUnread = conversation.unreadCounts.get(
      otherParticipantId.toString()
    ) || 0;
    conversation.unreadCounts.set(
      otherParticipantId.toString(),
      currentUnread + 1
    );

    // Update the updatedAt timestamp
    conversation.updatedAt = new Date();

    await conversation.save();

    // Find the recipient (the user who is NOT the sender)
    const recipientId = conversation.participants.find(
      (id) => id.toString() !== userId.toString()
    );

    // Check if the recipient has read the message
    const isReadByRecipient = populatedMessage.readBy.some(
      (read) => read.userId.toString() === recipientId.toString()
    );

    // Transform message response to match frontend expectations
    const transformedMessage = {
      _id: populatedMessage._id,
      id: populatedMessage._id, // Backward compatibility
      conversationId: populatedMessage.conversationId,
      content: populatedMessage.encryptedContent, // Map encryptedContent to content
      timestamp: populatedMessage.createdAt, // Map createdAt to timestamp
      senderId: populatedMessage.senderId._id || populatedMessage.senderId,
      senderName: populatedMessage.senderId.fullName,
      senderProfilePicture: populatedMessage.senderId.profilePicture?.url,
      type: populatedMessage.type,
      isDelivered: populatedMessage.deliveredTo.length > 0,
      isRead: isReadByRecipient,
    };

    // Emit socket event for real-time updates to the recipient
    const io = req.app.io;
    if (io) {
      const recipientSocket = activeUsers.get(otherParticipantId.toString());
      if (recipientSocket) {
        io.to(recipientSocket).emit('message:received', {
          message: transformedMessage,
          conversationId: conversation._id.toString(),
        });
      }
    }

    res.status(201).json({
      success: true,
      data: transformedMessage,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message,
    });
  }
};

/**
 * Register user's Signal Protocol keys
 */
exports.registerKeys = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      identityKeyPair,
      signedPreKey,
      preKeys,
    } = req.body;

    // Check if user already has keys
    let userKeys = await UserKeys.findOne({ userId });

    if (userKeys) {
      // Update existing keys
      userKeys.identityKeyPair = identityKeyPair;
      userKeys.signedPreKey = signedPreKey;
      userKeys.preKeys = preKeys;
      userKeys.nextPreKeyId = preKeys.length;
      userKeys.updatedAt = new Date();
    } else {
      // Create new keys record
      userKeys = new UserKeys({
        userId,
        identityKeyPair,
        signedPreKey,
        preKeys,
        nextPreKeyId: preKeys.length,
      });
    }

    await userKeys.save();

    res.status(200).json({
      success: true,
      message: 'Keys registered successfully',
      data: {
        userId,
        identityKeyPublicKey: identityKeyPair.publicKey,
        signedPreKeyId: signedPreKey.keyId,
      },
    });
  } catch (error) {
    console.error('Error registering keys:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering keys',
      error: error.message,
    });
  }
};

/**
 * Get a user's public keys for encryption
 */
exports.getUserPublicKeys = async (req, res) => {
  try {
    const { userId } = req.params;

    const userKeys = await UserKeys.findOne({ userId })
      .select('identityKeyPair.publicKey signedPreKey preKeys deviceId')
      .lean();

    if (!userKeys) {
      return res.status(404).json({
        success: false,
        message: 'User has not registered encryption keys',
      });
    }

    // Get one available pre-key (not yet used)
    const availablePreKey = userKeys.preKeys.find((pk) => !pk.used);

    if (!availablePreKey) {
      return res.status(400).json({
        success: false,
        message: 'No available pre-keys for user',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        deviceId: userKeys.deviceId,
        identityKey: userKeys.identityKeyPair.publicKey,
        signedPreKey: {
          keyId: userKeys.signedPreKey.keyId,
          publicKey: userKeys.signedPreKey.publicKey,
          signature: userKeys.signedPreKey.signature,
        },
        preKey: {
          keyId: availablePreKey.keyId,
          publicKey: availablePreKey.publicKey,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user keys:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user keys',
      error: error.message,
    });
  }
};

/**
 * Mark message as read
 */
exports.markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { conversationId } = req.body;
    const userId = req.user._id;

    // Mark the message as read
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
    )
      .populate('senderId', 'fullName')
      .lean();

    // Update conversation unread count
    if (conversationId) {
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        const userIdStr = userId.toString();
        const currentUnread = conversation.unreadCounts.get(userIdStr) || 0;
        if (currentUnread > 0) {
          // Reset unread count to 0 for this user
          conversation.unreadCounts.set(userIdStr, 0);
          await conversation.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking message as read',
      error: error.message,
    });
  }
};

/**
 * Delete a conversation (soft delete)
 */
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $addToSet: { deletedBy: userId },
      },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting conversation',
      error: error.message,
    });
  }
};
