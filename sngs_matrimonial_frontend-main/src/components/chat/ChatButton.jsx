"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ChatButton Component
 *
 * Reusable button component with message icon for profile cards and detail pages.
 *
 * @param {Object} props - Component props
 * @param {Function} props.onClick - Click handler
 * @param {("default"|"outline"|"ghost")} props.variant - Button variant (default: "default")
 * @param {("sm"|"md"|"lg")} props.size - Button size (default: "md")
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Button text content
 */
export default function ChatButton({
  onClick,
  variant = "default",
  size = "md",
  disabled = false,
  className,
  children = "Send Message",
}) {
  const sizeClasses = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <Button
      onClick={onClick}
      variant={variant}
      disabled={disabled}
      className={cn(
        "font-telex font-medium transition-all duration-200",
        sizeClasses[size],
        variant === "default" && "bg-primary hover:bg-primary/90 text-white",
        variant === "outline" &&
          "border-2 border-primary text-primary hover:bg-primary/10",
        variant === "ghost" && "text-primary hover:bg-primary/10",
        className
      )}
    >
      <MessageCircle className={cn("mr-2", iconSizes[size])} />
      {children}
    </Button>
  );
}
