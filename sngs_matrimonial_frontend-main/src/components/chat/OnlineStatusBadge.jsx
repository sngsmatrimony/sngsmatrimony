"use client";

import { cn } from "@/lib/utils";

/**
 * OnlineStatusBadge Component
 *
 * Displays a green dot indicator for user's online status.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOnline - Whether the user is currently online
 * @param {("sm"|"md"|"lg")} props.size - Size of the badge (default: "md")
 * @param {string} props.className - Additional CSS classes
 */
export default function OnlineStatusBadge({
  isOnline = false,
  size = "md",
  className
}) {
  if (!isOnline) {
    return null;
  }

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
  };

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
    >
      {/* Pulsing outer ring */}
      <span
        className={cn(
          "absolute inline-flex rounded-full bg-success opacity-75 animate-ping",
          sizeClasses[size]
        )}
      ></span>

      {/* Solid inner dot */}
      <span
        className={cn(
          "relative inline-flex rounded-full bg-success",
          sizeClasses[size]
        )}
      ></span>
    </span>
  );
}
