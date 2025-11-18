/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePreviewerProps {
  isOpen: boolean;
  onClose: () => void;
  images: { url: string; alt?: string }[];
  initialImageIndex?: number;
}

export const ImagePreviewer = ({
  isOpen,
  onClose,
  images,
  initialImageIndex = 0,
}: ImagePreviewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialImageIndex);
  const [isLoading, setIsLoading] = useState(true);

  // Reset current index when modal opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setCurrentIndex(initialImageIndex);
    }
  };

  const goToNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setIsLoading(true);
  };

  const goToPrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsLoading(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      goToPrevious();
    } else if (e.key === "ArrowRight") {
      goToNext();
    }
  };

  if (!images.length) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-[85vw] md:max-w-[75vw] lg:max-w-[65vw] max-h-[90vh] p-0 bg-background/95 outline-none"
        onKeyDown={handleKeyDown}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-12 right-0 text-white hover:bg-white/10 rounded-full transition-transform duration-300 hover:scale-110 z-50"
          onClick={() => onClose()}
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="relative w-full h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh]">
          {/* Loading spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Main image */}
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={images[currentIndex].url}
              alt={images[currentIndex].alt || "Preview"}
              className="object-contain w-full h-full rounded-lg p-2"
              width={1200}
              height={800}
              onLoadingComplete={() => setIsLoading(false)}
              priority
            />
          </div>

          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 rounded-full transition-transform duration-300 hover:scale-110 z-50"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 rounded-full transition-transform duration-300 hover:scale-110 z-50"
                onClick={goToNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
              <div className="flex gap-2 p-2 rounded-full bg-black/50 backdrop-blur-sm">
                {images.map((image, index) => (
                  <button
                    key={index}
                    className={cn(
                      "w-12 h-12 rounded-md overflow-hidden border-2 transition-all duration-300",
                      currentIndex === index
                        ? "border-primary shadow-lg scale-110"
                        : "border-white/50 hover:border-white"
                    )}
                    onClick={() => {
                      setCurrentIndex(index);
                      setIsLoading(true);
                    }}
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={image.url}
                        alt={image.alt || `Preview ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
