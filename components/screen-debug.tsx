/* eslint-disable @zohodesk/no-hardcoding/no-hardcoding */
/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

const getBreakpoint = (width: number) => {
  if (width >= 1536) return "2xl";
  if (width >= 1280) return "xl";
  if (width >= 1024) return "lg";
  if (width >= 768) return "md";
  if (width >= 640) return "sm";
  return "xs";
};

const getBreakpointColor = (breakpoint: string) => {
  const colors = {
    "2xl": "bg-purple-500",
    xl: "bg-blue-500",
    lg: "bg-green-500",
    md: "bg-yellow-500",
    sm: "bg-orange-500",
    xs: "bg-red-500",
  } as const;

  return colors[breakpoint as keyof typeof colors] || "bg-gray-500";
};

export function ScreenDebug() {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    breakpoint: "xs",
  });

  useEffect(() => {
    // Initialize dimensions
    const updateDimensions = () => {
      const width = window.innerWidth;
      setDimensions({
        width,
        height: window.innerHeight,
        breakpoint: getBreakpoint(width),
      });
    };

    // Set initial dimensions
    updateDimensions();

    // Add event listener
    window.addEventListener("resize", updateDimensions);

    // Cleanup
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-black/80 px-3 py-1.5 font-mono text-xs text-white">
      <span>
        {dimensions.width}x{dimensions.height}
      </span>
      <Badge
        className={`${getBreakpointColor(
          dimensions.breakpoint
        )} border-none font-mono`}
      >
        {dimensions.breakpoint}
      </Badge>
    </div>
  );
}
