import { io } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

let socket = null;

/**
 * Initialize Socket.io connection with authentication
 * @param {string} token - JWT authentication token
 * @returns {Object} Socket.io instance
 */
export const initializeSocket = (token) => {
  if (socket) {
    return socket;
  }

  socket = io(BACKEND_URL, {
    auth: {
      token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling'],
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

/**
 * Get current socket instance
 * @returns {Object} Socket.io instance or null if not connected
 */
export const getSocket = () => {
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Send a message
 * @param {Object} data - Message data { conversationId, recipientId, encryptedContent, type, media }
 */
export const sendMessage = (data) => {
  if (!socket) return;
  socket.emit('message:send', data);
};

/**
 * Mark message as read
 * @param {Object} data - { messageId, conversationId }
 */
export const markMessageAsRead = (data) => {
  if (!socket) return;
  socket.emit('message:read', data);
};

/**
 * Broadcast typing start event
 * @param {Object} data - { conversationId, recipientId }
 */
export const broadcastTypingStart = (data) => {
  if (!socket) return;
  socket.emit('typing:start', data);
};

/**
 * Broadcast typing stop event
 * @param {Object} data - { conversationId, recipientId }
 */
export const broadcastTypingStop = (data) => {
  if (!socket) return;
  socket.emit('typing:stop', data);
};

/**
 * Listen for incoming messages
 * @param {Function} callback - Called when message received
 */
export const onMessageReceived = (callback) => {
  if (!socket) return;
  socket.on('message:received', callback);
};

/**
 * Listen for message delivery confirmation
 * @param {Function} callback - Called when message delivered
 */
export const onMessageDelivered = (callback) => {
  if (!socket) return;
  socket.on('message:delivered', callback);
};

/**
 * Listen for read receipts
 * @param {Function} callback - Called when message read
 */
export const onMessageReadReceipt = (callback) => {
  if (!socket) return;
  socket.on('message:readReceipt', callback);
};

/**
 * Listen for typing indicators
 * @param {Function} callback - Called when user typing status changes
 */
export const onTypingIndicator = (callback) => {
  if (!socket) return;
  socket.on('typing:indicator', callback);
};

/**
 * Listen for user online status
 * @param {Function} callback - Called when user comes online
 */
export const onUserOnline = (callback) => {
  if (!socket) return;
  socket.on('user:online', callback);
};

/**
 * Listen for user offline status
 * @param {Function} callback - Called when user goes offline
 */
export const onUserOffline = (callback) => {
  if (!socket) return;
  socket.on('user:offline', callback);
};

/**
 * Listen for message errors
 * @param {Function} callback - Called on message error
 */
export const onMessageError = (callback) => {
  if (!socket) return;
  socket.on('message:error', callback);
};

/**
 * Remove all listeners for a specific event
 * @param {string} event - Event name to remove listeners for
 */
export const removeListener = (event) => {
  if (!socket) return;
  socket.removeAllListeners(event);
};

export default socket;
