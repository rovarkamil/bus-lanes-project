"use client";

import { FC } from "react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
}

export const Loader: FC<LoaderProps> = ({ className }) => {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-muted animate-spin border-t-primary"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};
