/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TabsProps {
  tabs: {
    label: string;
    value: string;
    count?: number;
  }[];
  value: string;
  onValueChange: (value: string) => void;
}

export function CustomTabs({ tabs, value, onValueChange }: TabsProps) {
  return (
    <div className="relative flex w-full gap-x-1 rounded-lg bg-muted/50 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onValueChange(tab.value)}
          className={cn(
            "relative flex flex-1 items-center justify-center gap-x-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:text-primary",
            value === tab.value && "text-primary"
          )}
        >
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs",
                value === tab.value
                  ? "bg-primary/10 text-primary"
                  : "bg-muted-foreground/10"
              )}
            >
              {tab.count}
            </span>
          )}
          {value === tab.value && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 rounded-md bg-background"
              style={{ zIndex: -1 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
