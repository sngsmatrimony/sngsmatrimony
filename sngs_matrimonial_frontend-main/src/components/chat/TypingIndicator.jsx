"use client";

import { cn } from "@/lib/utils";

/**
 * TypingIndicator Component
 *
 * Displays an animated "User is typing..." indicator with three dots animation.
 *
 * @param {Object} props - Component props
 * @param {Array<string>} props.typingUsers - Array of user IDs who are currently typing
 * @param {Object} props.typingUserDetails - Map of user IDs to user details (name, etc.)
 */
export default function TypingIndicator({ typingUsers = [], typingUserDetails = {} }) {
  if (!typingUsers || typingUsers.length === 0) {
    return null;
  }

  // Get the name of the first typing user
  const firstTypingUserId = typingUsers[0];
  const typingUserName = typingUserDetails[firstTypingUserId]?.name || "Someone";

  return (
    <div className="flex w-full justify-start mb-3 animate-fadeIn">
      <div className="max-w-[70%] rounded-2xl rounded-bl-sm px-4 py-3 bg-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          {/* Typing User Name */}
          <span className="text-xs font-telex text-gray-600">
            {typingUserName} is typing
          </span>

          {/* Three Dots Animation */}
          <div className="flex items-center gap-1">
            <span
              className="w-2 h-2 bg-gray-400 rounded-full animate-typingDot"
              style={{ animationDelay: "0ms" }}
            ></span>
            <span
              className="w-2 h-2 bg-gray-400 rounded-full animate-typingDot"
              style={{ animationDelay: "200ms" }}
            ></span>
            <span
              className="w-2 h-2 bg-gray-400 rounded-full animate-typingDot"
              style={{ animationDelay: "400ms" }}
            ></span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes typingDot {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-typingDot {
          animation: typingDot 1.4s infinite ease-in-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
