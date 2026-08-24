"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import MessageInput from "./MessageInput";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ChatConversation Component
 *
 * Message thread display with infinite scroll for loading older messages.
 * Shows typing indicators and read receipts.
 *
 * @param {Object} props - Component props
 * @param {string} props.conversationId - ID of the current conversation
 * @param {Array<Object>} props.messages - Array of message objects
 * @param {string} props.currentUserId - ID of the current user
 * @param {Array<string>} props.typingUsers - Array of user IDs currently typing
 * @param {Object} props.typingUserDetails - Map of user IDs to user details
 * @param {Function} props.onLoadMore - Callback to load more (older) messages
 * @param {Function} props.onSendMessage - Callback when sending a new message
 * @param {Function} props.onTyping - Callback when user starts/stops typing
 * @param {Function} props.onMarkAsRead - Callback to mark message as read
 * @param {boolean} props.hasMoreMessages - Whether there are more messages to load
 * @param {boolean} props.isLoadingMore - Whether older messages are being loaded
 * @param {boolean} props.isSending - Whether a message is currently being sent
 * @param {Object} props.error - Error object if any
 */
export default function ChatConversation({
  conversationId,
  messages = [],
  currentUserId,
  typingUsers = [],
  typingUserDetails = {},
  onLoadMore,
  onSendMessage,
  onTyping,
  onMarkAsRead,
  hasMoreMessages = false,
  isLoadingMore = false,
  isSending = false,
  error = null,
}) {
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const previousScrollHeight = useRef(0);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  };

  // Handle scroll to detect when to load more messages
  const handleScroll = () => {
    if (!messagesContainerRef.current || !onLoadMore) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;

    // Check if scrolled to top
    if (scrollTop === 0 && hasMoreMessages && !isLoadingMore) {
      previousScrollHeight.current = scrollHeight;
      onLoadMore();
    }

    // Determine if user is at the bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldScrollToBottom(isAtBottom);
  };

  // Scroll to bottom on initial load and when new messages arrive
  useEffect(() => {
    if (shouldScrollToBottom) {
      scrollToBottom(messages.length > 0);
    }
  }, [messages, shouldScrollToBottom]);

  // Maintain scroll position when loading older messages
  useEffect(() => {
    if (isLoadingMore && messagesContainerRef.current) {
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight.current;
      messagesContainerRef.current.scrollTop = scrollDiff;
    }
  }, [isLoadingMore, messages]);

  // Scroll to bottom when typing indicator appears
  useEffect(() => {
    if (typingUsers.length > 0 && shouldScrollToBottom) {
      scrollToBottom();
    }
  }, [typingUsers, shouldScrollToBottom]);

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-viga text-secondary mb-2">
            Select a conversation
          </p>
          <p className="text-sm font-maven text-gray-600">
            Choose a conversation from the list to start messaging
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-viga text-gray-900 mb-2">
            Error loading conversation
          </p>
          <p className="text-sm font-maven text-gray-600 mb-4">
            {error.message || "Something went wrong. Please try again."}
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
          >
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white min-h-0">
      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 min-h-0 flex flex-col"
        style={{ scrollBehavior: "smooth" }}
      >
        {/* Load More Button */}
        {hasMoreMessages && (
          <div className="flex justify-center mb-4">
            <Button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              variant="ghost"
              size="sm"
              className="text-secondary hover:text-primary hover:bg-primary/10 font-telex"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load older messages"
              )}
            </Button>
          </div>
        )}

        {/* Loading Indicator at Top */}
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="w-5 h-5 text-secondary animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {messages.length === 0 && !isLoadingMore && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-base font-maven text-gray-600">
                No messages yet. Start the conversation!
              </p>
            </div>
          </div>
        )}

        {/* Message Bubbles */}
        {messages.map((message) => (
          <MessageBubble
            key={message._id || message.id}
            message={message}
            currentUserId={currentUserId}
            onMarkAsRead={onMarkAsRead}
          />
        ))}

        {/* Typing Indicator */}
        <TypingIndicator
          typingUsers={typingUsers}
          typingUserDetails={typingUserDetails}
        />

        {/* Scroll Anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Only show when there's an active conversation */}
      {conversationId && (
        <MessageInput
          onSendMessage={onSendMessage}
          onTyping={onTyping}
          isLoading={isSending}
          disabled={!conversationId}
        />
      )}
    </div>
  );
}
