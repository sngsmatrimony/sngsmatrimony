"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import OnlineStatusBadge from "./OnlineStatusBadge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { toastInfo } from "@/lib/toast";

/**
 * ChatList Component
 *
 * Sidebar showing list of conversations. Each item shows:
 * profile picture, name, last message preview, timestamp, unread badge
 *
 * @param {Object} props - Component props
 * @param {Array<Object>} props.conversations - Array of conversation objects
 * @param {string} props.conversations[].id - Conversation ID
 * @param {Object} props.conversations[].user - Other user in the conversation
 * @param {string} props.conversations[].user.id - User ID
 * @param {string} props.conversations[].user.name - User name
 * @param {string} props.conversations[].user.profilePicture - User profile picture URL
 * @param {boolean} props.conversations[].user.isOnline - User online status
 * @param {Object} props.conversations[].lastMessage - Last message object
 * @param {string} props.conversations[].lastMessage.content - Message content
 * @param {string} props.conversations[].lastMessage.timestamp - Message timestamp
 * @param {number} props.conversations[].unreadCount - Number of unread messages
 * @param {string} props.activeConversationId - ID of the currently active conversation
 * @param {Function} props.onSelectConversation - Callback when a conversation is selected
 * @param {boolean} props.isLoading - Whether conversations are loading
 * @param {Object} props.error - Error object if any
 */
export default function ChatList({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  isLoading = false,
  error = null,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const { membership } = useAuthStore();
  const hasNoMembership = !membership?.isActive || membership?.isExpired || membership?.credits <= 0;

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conversation) => {
    const otherParticipant = conversation.otherParticipant || {};
    const userName = otherParticipant.fullName || otherParticipant.name || '';
    return userName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Format timestamp (e.g., "2h ago", "Yesterday")
  const formatTimestamp = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "";
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Truncate last message
  const truncateMessage = (message, maxLength = 40) => {
    if (message.length <= maxLength) return message;
    return `${message.substring(0, maxLength)}...`;
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border-r">
      {/* Header */}
      <div className="px-4 py-4 border-b bg-white shrink-0">
        <h2 className="text-xl font-viga text-secondary mb-3">Messages</h2>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-telex text-sm border-gray-300 focus:border-primary focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-secondary animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-maven text-red-600 mb-2">
              {typeof error === 'string' ? error : error.message || "Failed to load conversations"}
            </p>
            <p className="text-xs font-telex text-gray-500">
              Please check your connection and try again
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading &&
          !error &&
          filteredConversations.length === 0 &&
          conversations.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-base font-maven text-gray-600">
                No conversations yet
              </p>
              <p className="text-sm font-telex text-gray-500 mt-1">
                Start messaging someone to begin
              </p>
            </div>
          )}

        {/* No Search Results */}
        {!isLoading &&
          !error &&
          filteredConversations.length === 0 &&
          conversations.length > 0 &&
          searchQuery && (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-maven text-gray-600">
                No conversations found for &quot;{searchQuery}&quot;
              </p>
            </div>
          )}

        {/* Conversation Items */}
        {!isLoading &&
          !error &&
          filteredConversations.map((conversation) => {
            const otherUser = conversation.otherParticipant || {};
            const userName = otherUser.fullName || otherUser.name || 'Unknown';
            const profilePictureUrl = otherUser.profilePicture?.url || otherUser.profilePicture || '/images/default-profile.png';

            return (
              <button
                key={conversation._id}
                onClick={() => onSelectConversation(conversation._id)}
                className={cn(
                  "w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100",
                  activeConversationId === conversation._id &&
                    "bg-primary/5 border-l-4 border-l-primary"
                )}
              >
              {/* Avatar with Online Status - Clickable to view profile */}
              <Link
                href={`/profiles/${otherUser._id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasNoMembership) {
                    e.preventDefault();
                    toastInfo('Get membership to view full profiles');
                  }
                }}
                className="relative shrink-0 cursor-pointer group"
              >
                <Avatar className="w-12 h-12 ring-2 ring-transparent group-hover:ring-primary transition-all">
                  <AvatarImage
                    src={profilePictureUrl}
                    alt={userName}
                  />
                  <AvatarFallback className="bg-secondary text-white font-telex">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
              </Link>

              {/* Conversation Details */}
              <div className="flex-1 min-w-0 text-left">
                {/* Name and Timestamp */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3
                    className={cn(
                      "font-maven font-semibold text-[15px] text-gray-900 truncate",
                      conversation.unreadCount > 0 && "text-gray-900"
                    )}
                  >
                    {userName}
                  </h3>
                  <span className="text-[11px] font-telex text-gray-500 shrink-0">
                    {conversation.lastMessage?.timestamp &&
                      formatTimestamp(conversation.lastMessage.timestamp)}
                  </span>
                </div>

                {/* Last Message and Unread Badge */}
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      "text-sm font-telex text-gray-600 truncate",
                      conversation.unreadCount > 0 &&
                        "text-gray-900 font-medium"
                    )}
                  >
                    {conversation.lastMessage?.preview
                      ? truncateMessage(conversation.lastMessage.preview)
                      : "No messages yet"}
                  </p>

                  {conversation.unreadCount > 0 && (
                    <Badge
                      className="bg-primary text-black font-telex text-[10px] px-1.5 py-0 min-w-5 h-5 flex items-center justify-center shrink-0"
                    >
                      {conversation.unreadCount > 99
                        ? "99+"
                        : conversation.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
              </button>
            );
          })}

      </div>
    </div>
  );
}
