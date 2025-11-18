"use client";

import { FC, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const Loader: FC<TableSkeletonProps> = ({
  rows = 10,
  columns = 7,
  className,
}) => {
  const [visibleRows, setVisibleRows] = useState(0);

  useEffect(() => {
    if (visibleRows < rows) {
      const timeout = setTimeout(() => setVisibleRows(visibleRows + 1), 80);
      return () => clearTimeout(timeout);
    }
  }, [visibleRows, rows]);

  return (
    <div className={cn("w-full flex flex-col items-center justify-center py-12", className)}>
      <div className="w-full rounded-2xl shadow-xl bg-white/70 dark:bg-black/30 border border-white/30 dark:border-black/40 backdrop-blur-xl overflow-hidden animate-fade-in">
        <div className="w-full">
          <div className="flex w-full">
            {[...Array(columns)].map((_, i) => (
              <div
                key={i}
                className="h-10 flex-1 bg-muted animate-pulse rounded-none first:rounded-tl-2xl last:rounded-tr-2xl"
              />
            ))}
          </div>
          {[...Array(rows)].map((_, rowIdx) => (
            <div
              key={rowIdx}
              className="flex w-full border-t border-muted/20"
              style={{
                opacity: rowIdx < visibleRows ? 1 : 0,
                transform: rowIdx < visibleRows ? "none" : "translateY(24px)",
                transition: "opacity 0.5s, transform 0.5s"
              }}
            >
              {[...Array(columns)].map((_, colIdx) => (
                <div
                  key={colIdx}
                  className="h-10 flex-1 bg-muted animate-pulse m-1 rounded-lg"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Add these to your global CSS or Tailwind config:
// .animate-shimmer { background-size: 200% 100%; animation: shimmer 1.5s linear infinite; }
// @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
// .animate-fade-in { animation: fadeIn 0.7s both; }
// @keyframes fadeIn { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: none; } }
// .animate-fade-in-up { animation: fadeInUp 0.7s both; }
// @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px);} to { opacity: 1; transform: none; } }
