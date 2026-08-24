"use client";

import { useState, useEffect, useRef } from "react";
import ChatList from "./ChatList";
import ChatConversation from "./ChatConversation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import OnlineStatusBadge from "./OnlineStatusBadge";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import useChatStore from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useLandingStore } from "@/store/landingStore";
import Link from "next/link";
import { toastInfo } from "@/lib/toast";

/**
 * ChatLayout Component
 *
 * Full-page chat layout container with ChatList sidebar and ChatConversation panel.
 * Responsive for mobile (stacked layout on mobile).
 * Connects to Zustand stores for data management.
 *
 * @param {Object} props - Component props
 * @param {string} props.initialUserId - Optional ID of user to open conversation with on mount
 */
export default function ChatLayout({ initialUserId = null }) {
  const { user, membership } = useAuthStore();
  const hasNoMembership = !membership?.isActive || membership?.isExpired || membership?.credits <= 0;
  const { clearSelectedChatUserId } = useLandingStore();
  const {
    conversations,
    activeConversationId,
    messages,
    onlineUsers,
    setActiveConversationId,
    loadConversations,
    getOrCreateConversation,
    sendMessage,
    markMessageAsRead,
    markConversationAsRead,
    loadMessages,
    createConversationWithMessage,
    deleteConversation,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    error,
  } = useChatStore();

  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationOnMobile, setShowConversationOnMobile] = useState(false);

  // Get active conversation details
  const activeConversation = conversations.find(
    (conv) => conv._id === activeConversationId
  );

  // Load conversations on mount - empty dependency array to run once
  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle initialUserId - create conversation immediately when chat button is clicked
  useEffect(() => {
    if (initialUserId && user) {
      // Create or get conversation immediately
      getOrCreateConversation(initialUserId);
      // Clear from landing store to prevent persistence
      clearSelectedChatUserId();
    }
    // Only re-run when initialUserId or user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUserId, user?._id]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId, 50, 0);
      // Mark all messages in conversation as read
      markConversationAsRead(activeConversationId);
    }
    // Only re-run when activeConversationId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  // Clean up empty conversations when navigating away from Messages tab
  // Store reference to current empty conversations to delete on unmount
  const emptyConversationIdsRef = useRef([]);

  useEffect(() => {
    // Update the list of empty conversation IDs whenever conversations change
    emptyConversationIdsRef.current = conversations
      .filter((conv) => !conv.lastMessage)
      .map((conv) => conv._id);
  }, [conversations]);

  useEffect(() => {
    // Only run cleanup on component unmount
    return () => {
      // Delete all empty conversations when leaving Messages tab
      if (emptyConversationIdsRef.current.length > 0) {
        emptyConversationIdsRef.current.forEach((convId) => {
          deleteConversation(convId).catch(() => {});
        });
      }
    };
  }, [deleteConversation]);

  // Detect mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);

    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  // Handle conversation selection
  const handleSelectConversation = (conversationId) => {
    setActiveConversationId(conversationId);
    if (isMobileView) {
      setShowConversationOnMobile(true);
    }
  };

  // Handle back button on mobile
  const handleBackToList = () => {
    setShowConversationOnMobile(false);
    setActiveConversationId(null);
  };

  // Get initials for avatar fallback
  const getInitials = (name) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Handle sending a message
  const handleSendMessage = async (messageContent) => {
    if (!activeConversationId || !messageContent.trim()) return;
    await sendMessage(activeConversationId, messageContent);
  };

  // Handle marking message as read
  const handleMarkAsRead = (messageId) => {
    if (activeConversationId) {
      markMessageAsRead(messageId, activeConversationId);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Chat List Sidebar - Hidden on mobile when conversation is shown */}
      <div
        className={cn(
          "w-full md:w-80 lg:w-96 border-r bg-white flex flex-col min-h-0",
          isMobileView && showConversationOnMobile && "hidden"
        )}
      >
        <ChatList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          isLoading={isLoadingConversations}
          error={error}
        />
      </div>

      {/* Conversation Panel - Hidden on mobile when no conversation is selected */}
      <div
        className={cn(
          "flex-1 flex flex-col min-h-0",
          isMobileView && !showConversationOnMobile && "hidden"
        )}
      >
        {/* Conversation Header */}
        {activeConversation && (
          <div className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {/* Back Button (Mobile Only) */}
              {isMobileView && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToList}
                  className="shrink-0 text-secondary hover:text-primary hover:bg-primary/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}

              {/* User Avatar and Info - Clickable to view profile */}
              <Link
                href={`/profiles/${activeConversation.otherParticipant?._id}`}
                onClick={(e) => {
                  if (hasNoMembership) {
                    e.preventDefault();
                    toastInfo('Get membership to view full profiles');
                  }
                }}
                className="relative shrink-0 cursor-pointer group"
              >
                <Avatar className="w-10 h-10 ring-2 ring-transparent group-hover:ring-primary transition-all">
                  <AvatarImage
                    src={activeConversation.otherParticipant?.profilePicture?.url || activeConversation.otherParticipant?.profilePicture}
                    alt={activeConversation.otherParticipant?.fullName}
                  />
                  <AvatarFallback className="bg-secondary text-white font-telex">
                    {getInitials(activeConversation.otherParticipant?.fullName || 'User')}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div>
                <h3 className="font-maven font-semibold text-[15px] text-gray-900">
                  {activeConversation.otherParticipant?.fullName || 'Unknown'}
                </h3>
              </div>
            </div>

          </div>
        )}

        {/* Conversation Messages */}
        <ChatConversation
          conversationId={activeConversationId}
          messages={messages}
          currentUserId={user?._id}
          onSendMessage={handleSendMessage}
          onMarkAsRead={handleMarkAsRead}
          isLoadingMore={isLoadingMessages}
          isSending={isSending}
          error={error}
        />
      </div>
    </div>
  );
}
