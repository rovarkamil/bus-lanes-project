"use client";

import * as React from "react";
import NextImage, { ImageProps as NextImageProps } from "next/image";
import { cn } from "@/lib/utils";

export interface ImageProps extends NextImageProps {
  className?: string;
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ className, alt, ...props }, ref) => {
    return (
      <NextImage
        className={cn("transition-all", className)}
        alt={alt}
        ref={ref as any}
        {...props}
      />
    );
  }
);
Image.displayName = "Image";

export { Image }; 