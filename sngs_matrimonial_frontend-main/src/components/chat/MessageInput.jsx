"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MessageInput Component
 *
 * Text input area for composing messages with send button and emoji support.
 *
 * @param {Object} props - Component props
 * @param {Function} props.onSendMessage - Callback when message is sent (receives message text)
 * @param {Function} props.onTyping - Callback when user is typing
 * @param {boolean} props.isLoading - Whether a message is currently being sent
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {string} props.placeholder - Placeholder text
 */
export default function MessageInput({
  onSendMessage,
  onTyping,
  isLoading = false,
  disabled = false,
  placeholder = "Type a message...",
}) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Handle message change and typing indicator
  const handleChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Trigger typing indicator
    if (onTyping && value.trim()) {
      if (!isTyping) {
        setIsTyping(true);
        onTyping(true);
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTyping(false);
      }, 1000);
    } else if (isTyping && !value.trim()) {
      setIsTyping(false);
      if (onTyping) onTyping(false);
    }
  };

  // Handle send message
  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && onSendMessage && !isLoading) {
      onSendMessage(trimmedMessage);
      setMessage("");
      setIsTyping(false);
      if (onTyping) onTyping(false);

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  // Handle Enter key to send (Shift+Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="border-t bg-white px-4 py-3 shrink-0 sticky bottom-0 z-20">
      <div className="flex items-end gap-2">
        {/* Message Textarea */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={cn(
            "min-h-[40px] max-h-[120px] resize-none font-maven text-[15px] leading-relaxed",
            "border-gray-300 focus:ring-0",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          rows={1}
        />

        {/* Send Button */}
        <Button
          type="button"
          onClick={handleSend}
          disabled={!message.trim() || disabled || isLoading}
          className={cn(
            "shrink-0 bg-success-alt hover:bg-success-alt/90 text-black mb-1",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          size="icon"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      {/* Helper Text */}
      <p className="text-[11px] font-telex text-gray-500 mt-2 px-1">
        Press Enter to send, Shift + Enter for new line
      </p>
    </div>
  );
}
