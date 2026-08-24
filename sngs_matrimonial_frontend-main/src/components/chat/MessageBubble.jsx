"use client";

import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";

/**
 * MessageBubble Component
 *
 * Displays an individual message with sender/recipient styling, timestamp, and read receipts.
 *
 * @param {Object} props - Component props
 * @param {Object} props.message - Message object
 * @param {string} props.message.id - Message ID
 * @param {string} props.message.content - Message text content
 * @param {string} props.message.senderId - ID of the sender
 * @param {string} props.message.timestamp - ISO timestamp of the message
 * @param {boolean} props.message.isRead - Whether the message has been read
 * @param {boolean} props.message.isDelivered - Whether the message has been delivered
 * @param {string} props.currentUserId - ID of the current user
 * @param {Function} props.onMarkAsRead - Callback when message is marked as read
 */
export default function MessageBubble({ message, currentUserId, onMarkAsRead }) {
  // Handle both string IDs and ObjectId comparisons
  const senderIdString = typeof message.senderId === 'object'
    ? message.senderId._id
    : message.senderId;
  const currentUserIdString = typeof currentUserId === 'object'
    ? currentUserId._id
    : currentUserId;

  const isSentByCurrentUser = senderIdString?.toString() === currentUserIdString?.toString();

  // Format timestamp to show time (e.g., "2:30 PM")
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return ''; // Handle invalid dates
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Mark as read when received message is viewed
  const handleView = () => {
    if (!isSentByCurrentUser && !message.isRead && onMarkAsRead) {
      onMarkAsRead(message._id || message.id);
    }
  };

  return (
    <div
      className={cn(
        "flex w-full mb-3",
        isSentByCurrentUser ? "justify-end" : "justify-start"
      )}
      onMouseEnter={handleView}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm",
          isSentByCurrentUser
            ? "bg-gray-100 text-black rounded-br-sm"
            : "bg-primary text-black rounded-bl-sm"
        )}
      >
        {/* Message Content */}
        <p className="text-[15px] leading-relaxed font-maven wrap-break-words whitespace-pre-wrap">
          {message.content}
        </p>

        {/* Timestamp and Read Receipts */}
        <div
          className={cn(
            "flex items-center gap-1 mt-1.5",
            isSentByCurrentUser ? "justify-end" : "justify-start"
          )}
        >
          <span
            className={cn(
              "text-[11px] font-telex",
              isSentByCurrentUser ? "text-gray-600" : "text-black/70"
            )}
          >
            {formatTime(message.timestamp)}
          </span>

          {/* Show read receipts only for sent messages */}
          {isSentByCurrentUser && (
            <span className="ml-1 flex items-center">
              {message.isRead ? (
                <CheckCheck className="w-4 h-4 text-[#0084FF]" strokeWidth={2.5} />
              ) : message.isDelivered ? (
                <CheckCheck className="w-4 h-4 text-black/70" strokeWidth={2.5} />
              ) : (
                <Check className="w-4 h-4 text-black/70" strokeWidth={2.5} />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
