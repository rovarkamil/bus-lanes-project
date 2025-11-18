/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface VideoPreviewerProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
}

export const VideoPreviewer = ({
  isOpen,
  onClose,
  videoUrl,
}: VideoPreviewerProps) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[85vw] md:max-w-[75vw] lg:max-w-[65vw] max-h-[90vh] p-0 bg-background/95">
        <div className="relative w-full h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <video
            src={videoUrl}
            className="w-full h-full rounded-lg p-2"
            controls
            autoPlay
            onLoadedData={() => setIsLoading(false)}
            style={{ objectFit: "contain" }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
