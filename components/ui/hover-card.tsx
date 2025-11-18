"use client";

import * as React from "react";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import { cn } from "@/lib/utils";

const HoverCard = HoverCardPrimitive.Root;

const HoverCardTrigger = HoverCardPrimitive.Trigger;

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      // Base styles
      "z-50 rounded-xl border shadow-lg",
      "max-w-[300px] min-w-[200px] w-fit", // Flexible width with constraints
      "bg-white/95 dark:bg-gray-950/95 backdrop-blur-lg",
      "p-4", // Slightly reduced padding
      "outline-none ring-1 ring-black/5 dark:ring-white/5",

      // Text handling
      "break-words whitespace-normal",
      "text-sm leading-relaxed",
      "max-h-[300px] overflow-y-auto", // Max height with scrolling

      // Modern animations
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
      "data-[side=bottom]:slide-in-from-top-2",
      "data-[side=left]:slide-in-from-right-2",
      "data-[side=right]:slide-in-from-left-2",
      "data-[side=top]:slide-in-from-bottom-2",

      // Glass morphism effect
      "before:absolute before:inset-0 before:-z-10",
      "before:rounded-xl before:bg-gradient-to-b",
      "before:from-white/5 before:to-white/5",
      "dark:before:from-black/5 dark:before:to-black/5",
      "before:backdrop-blur-xl",

      // Border gradient
      "after:absolute after:inset-0 after:-z-20",
      "after:rounded-xl after:bg-gradient-to-b",
      "after:from-white/10 after:to-white/5",
      "dark:after:from-white/5 dark:after:to-transparent",

      // Custom scrollbar
      "scrollbar-thin scrollbar-track-transparent",
      "scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800",

      className
    )}
    {...props}
  />
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

export { HoverCard, HoverCardTrigger, HoverCardContent };
