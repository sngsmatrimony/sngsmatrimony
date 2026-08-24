'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import useChatStore from '@/store/chatStore';
import {
  initializeSocket,
  disconnectSocket,
  getSocket,
  onMessageReceived,
  onMessageDelivered,
  onMessageReadReceipt,
  onTypingIndicator,
  onUserOnline,
  onUserOffline,
  removeListener,
} from '@/lib/socket';

const SocketContext = createContext(null);

/**
 * SocketProvider - Manages Socket.io connection and event listeners for chat
 *
 * This provider initializes and maintains the socket connection when a user
 * is authenticated. It sets up all chat-related event listeners and connects
 * socket events to the Zustand chat store.
 */
export function SocketProvider({ children }) {
  const { user, token } = useAuthStore();
  const {
    receiveMessage,
    updateMessageStatus,
    setUserTyping,
    setUserOnline,
    loadConversations,
  } = useChatStore();

  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const isInitializedRef = useRef(false);
  const reconnectAttemptRef = useRef(0);

  /**
   * Initialize socket connection and set up event listeners
   */
  const initSocket = useCallback(() => {
    if (!user || !token) {
      return;
    }

    // Prevent multiple initializations
    if (isInitializedRef.current && getSocket()) {
      setIsConnected(true);
      return;
    }

    try {
      const socketInstance = initializeSocket(token);
      setSocket(socketInstance);
      isInitializedRef.current = true;

      // Handle connection state
      socketInstance.on('connect', () => {
        console.log('[SocketContext] Socket connected:', socketInstance.id);
        setIsConnected(true);
        reconnectAttemptRef.current = 0;
        // Reload conversations on reconnect to get any missed messages
        loadConversations();
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('[SocketContext] Socket disconnected:', reason);
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('[SocketContext] Socket connection error:', error);
        setIsConnected(false);
        reconnectAttemptRef.current += 1;
      });

      // Set up chat event listeners
      onMessageReceived(({ message, conversationId }) => {
        console.log('[SocketContext] Message received:', { messageId: message._id, conversationId });
        receiveMessage(message, conversationId);
      });

      onMessageDelivered(({ messageId, conversationId }) => {
        console.log('[SocketContext] Message delivered:', { messageId, conversationId });
        updateMessageStatus(messageId, 'deliveredTo', user._id);
      });

      onMessageReadReceipt(({ messageId, readBy }) => {
        console.log('[SocketContext] Read receipt:', { messageId, readBy });
        updateMessageStatus(messageId, 'readBy', {
          userId: readBy,
          readAt: new Date(),
        });
      });

      onTypingIndicator(({ userId, isTyping }) => {
        setUserTyping(userId, isTyping);
      });

      onUserOnline(({ userId }) => {
        setUserOnline(userId, true);
      });

      onUserOffline(({ userId }) => {
        setUserOnline(userId, false);
      });

    } catch (error) {
      console.error('[SocketContext] Failed to initialize socket:', error);
      setIsConnected(false);
    }
  }, [user, token, receiveMessage, updateMessageStatus, setUserTyping, setUserOnline, loadConversations]);

  /**
   * Clean up socket connection and listeners
   */
  const cleanupSocket = useCallback(() => {
    // Remove all listeners before disconnecting
    removeListener('message:received');
    removeListener('message:delivered');
    removeListener('message:readReceipt');
    removeListener('typing:indicator');
    removeListener('user:online');
    removeListener('user:offline');

    disconnectSocket();
    setSocket(null);
    setIsConnected(false);
    isInitializedRef.current = false;
  }, []);

  // Initialize socket when user is authenticated
  useEffect(() => {
    if (user && token) {
      initSocket();
    } else {
      // Clean up when user logs out
      cleanupSocket();
    }

    // Cleanup on unmount
    return () => {
      // Don't disconnect on unmount if this is just a re-render
      // Only disconnect when user logs out (handled above)
    };
  }, [user, token, initSocket, cleanupSocket]);

  // Handle page visibility changes - reconnect when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && token) {
        const currentSocket = getSocket();
        if (!currentSocket?.connected) {
          console.log('[SocketContext] Page visible, reconnecting socket...');
          initSocket();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, token, initSocket]);

  const value = {
    socket,
    isConnected,
    reconnect: initSocket,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * Hook to access socket context
 * @returns {{ socket: Object | null, isConnected: boolean, reconnect: Function }}
 */
export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export default SocketContext;
