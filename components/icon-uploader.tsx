"use client";

import { Button } from "@/components/ui/button";
import { ImageIcon, ImagePlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/loader-table";
import { ImagePreviewer } from "@/components/show-image-previewer";
import { compressImage } from "@/utils/compres-image";
import { useTranslation } from "@/i18n/client";

interface IconUploaderProps {
  onIconSelect: (file: File, uploadedUrl?: string) => void;
  onIconRemove: () => void;
  selectedIcon?: { file: File; url: string } | null;
  maxSize?: number; // in bytes
  label?: string;
  className?: string;
  requiredWidth?: number;
  requiredHeight?: number;
  shouldUploadImmediately?: boolean;
}

export const IconUploader: React.FC<IconUploaderProps> = ({
  onIconSelect,
  onIconRemove,
  selectedIcon,
  maxSize = 1 * 1024 * 1024, // 1MB default for icons
  label = "Icon",
  className,
  requiredWidth,
  requiredHeight,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageLoadingStates, setImageLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [localLoading, setLocalLoading] = useState(false);
  const { t } = useTranslation("Common");

  const handleIconSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setLocalLoading(true);

    const img = new window.Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      // Check file size
      if (file.size > maxSize) {
        toast.error(`Icon size must be less than ${maxSize / (1024 * 1024)}MB`);
        setLocalLoading(false);
        return;
      }

      // Check dimensions if required
      if (requiredWidth && requiredHeight) {
        if (img.width !== requiredWidth || img.height !== requiredHeight) {
          toast.error(
            `Icon dimensions must be exactly ${requiredWidth}x${requiredHeight} pixels`
          );
          setLocalLoading(false);
          return;
        }
      }

      try {
        // Compress the image before displaying
        const compressedFile = await compressImage(file);
        const url = URL.createObjectURL(compressedFile);

        setImageLoadingStates((prev) => ({
          ...prev,
          [url]: true,
        }));

        // Only pass the file to parent without uploading
        onIconSelect(compressedFile);
        setLocalLoading(false);
      } catch (error) {
        console.error("Error processing icon:", error);
        toast.error("Failed to process icon");
        setLocalLoading(false);
      }
    };
  };

  const handleIconRemove = () => {
    if (selectedIcon?.url) {
      URL.revokeObjectURL(selectedIcon.url);
    }
    onIconRemove();
    setImageLoadingStates({});
    const input = document.getElementById("iconInput") as HTMLInputElement;
    if (input) {
      input.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor="iconInput"
        className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300"
      >
        <ImageIcon className="h-4 w-4 text-primary" aria-label={label} />
        {label}
      </label>
      <div
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
          "text-base ring-offset-background focus-within:outline-none focus-within:ring-2",
          "focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed",
          "disabled:opacity-50 md:text-sm",
          "group items-center"
        )}
      >
        {!selectedIcon ? (
          <div
            className="flex items-center gap-2 cursor-pointer w-full"
            onClick={() => document.getElementById("iconInput")?.click()}
          >
            <div className="relative flex-shrink-0">
              <div className="relative p-1 rounded-md text-primary">
                {localLoading ? (
                  <Loader className="h-4 w-4" />
                ) : (
                  <ImagePlus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                )}
              </div>
            </div>
            <span className="text-sm text-muted-foreground">
              {t("UploadIcon")}{" "}
              <span className="text-xs text-muted-foreground/70">
                ({maxSize / (1024 * 1024)}MB
                {requiredWidth && requiredHeight && (
                  <>
                    , {requiredWidth}x{requiredHeight}px
                  </>
                )}
                )
              </span>
            </span>
            <input
              id="iconInput"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleIconSelect}
              disabled={localLoading}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div
                className="relative w-6 h-6 flex-shrink-0 group/image cursor-pointer overflow-hidden rounded-md bg-muted/10 border border-muted/10"
                onClick={() => setPreviewImage(selectedIcon.url)}
              >
                {(imageLoadingStates[selectedIcon.url] || localLoading) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10">
                    <Loader className="h-3 w-3" />
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedIcon.url}
                  alt="Icon preview"
                  className="w-full h-full object-contain"
                  onLoad={() => {
                    setImageLoadingStates((prev) => ({
                      ...prev,
                      [selectedIcon.url]: false,
                    }));
                  }}
                  onError={() => {
                    setImageLoadingStates((prev) => ({
                      ...prev,
                      [selectedIcon.url]: false,
                    }));
                    toast.error("Failed to load icon");
                  }}
                />
              </div>
              <p className="text-sm text-foreground truncate max-w-[120px]">
                {selectedIcon.file.name}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                onClick={handleIconRemove}
                disabled={localLoading}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                onClick={() => document.getElementById("iconInput")?.click()}
                disabled={localLoading}
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
              <input
                id="iconInput"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleIconSelect}
                disabled={localLoading}
              />
            </div>
          </div>
        )}
      </div>

      {/* Icon Preview Dialog */}
      {previewImage && (
        <ImagePreviewer
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          images={[
            {
              url: previewImage,
              alt: label,
            },
          ]}
        />
      )}
    </div>
  );
};
