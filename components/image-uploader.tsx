"use client";

import { Button } from "@/components/ui/button";
import { Image, ImagePlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/loader";
import { ImagePreviewer } from "@/components/show-image-previewer";
import { compressImage } from "@/utils/compres-image";
import { useTranslation } from "@/i18n/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ImageUploaderProps {
  onImageSelect: (file: File, uploadedUrl?: string) => void;
  onImageRemove: () => void;
  selectedImage?: { file: File; url: string } | null;
  maxSize?: number; // in bytes
  label?: string;
  className?: string;
  requiredWidth?: number;
  requiredHeight?: number;
  shouldUploadImmediately?: boolean;
  multiple?: boolean; // Add support for multiple file selection
  id?: string; // Add id prop for unique identification
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelect,
  onImageRemove,
  selectedImage,
  maxSize = 32 * 1024 * 1024, // 32MB default
  label = "Image",
  className,
  requiredWidth,
  requiredHeight,
  // shouldUploadImmediately = false, // Changed default to false
  multiple = false, // Default to single image mode
  id = "imageInput", // Default id if none provided
}) => {
  const { t } = useTranslation("Common");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageLoadingStates, setImageLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [localLoading, setLocalLoading] = useState(false);
  const inputId = `${id}-input`; // Create unique input ID

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // If multiple is false, only process the first file
    const filesToProcess = multiple ? Array.from(files) : [files[0]];

    for (const file of filesToProcess) {
      setLocalLoading(true);
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      img.onload = async () => {
        // Check file size
        if (file.size > maxSize) {
          toast.error(
            t("ImageSizeMustBeLessThan", {
              size: maxSize / (1024 * 1024),
            })
          );
          setLocalLoading(false);
          return;
        }

        // Check dimensions if required
        if (requiredWidth && requiredHeight) {
          if (img.width !== requiredWidth || img.height !== requiredHeight) {
            toast.error(
              t("ImageDimensionsMustBeExactly", {
                width: requiredWidth,
                height: requiredHeight,
              })
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
          onImageSelect(compressedFile);
          setLocalLoading(false);
        } catch (error) {
          console.error("Error processing image:", error);
          toast.error(t("FailedToProcessImage"));
          setLocalLoading(false);
        }
      };
    }
  };

  const handleImageRemove = () => {
    if (selectedImage?.url) {
      URL.revokeObjectURL(selectedImage.url);
    }
    onImageRemove();
    setImageLoadingStates({});
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      input.value = "";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <label
        htmlFor={inputId}
        className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300"
      >
        <Image className="h-4 w-4 text-primary" aria-label={label} />
        {label}
      </label>
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all duration-300",
          "bg-muted/30 dark:bg-muted/10",
          "hover:bg-muted/50 dark:hover:bg-muted/20",
          "group",
          selectedImage ? "p-4" : "p-8",
          "flex items-center justify-center"
        )}
      >
        <input
          id={inputId}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleImageSelect}
          disabled={localLoading}
          multiple={multiple} // Add multiple attribute
        />

        {!selectedImage ? (
          <div
            className="flex flex-col items-center gap-4 text-center cursor-pointer w-full h-full"
            onClick={() => document.getElementById(inputId)?.click()}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
              <div className="relative p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/10 shadow-lg shadow-primary/5 group-hover:shadow-primary/10 transition-all duration-300">
                {localLoading ? (
                  <Loader className="h-8 w-8" />
                ) : (
                  <ImagePlus className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                )}
              </div>
            </div>
            <div>
              <p className="font-medium text-muted-foreground group-hover:text-primary transition-colors duration-300">
                {t("ClickToUploadOrDragAndDrop")}
                {multiple && ` (${t("MultipleFilesAllowed")})`}
              </p>
              <p className="text-sm text-muted-foreground/80">
                {t("MaxSize", {
                  size: maxSize / (1024 * 1024),
                })}
                {requiredWidth && requiredHeight && (
                  <>
                    ,{" "}
                    {t("ImageDimensionsMustBeExactly", {
                      width: requiredWidth,
                      height: requiredHeight,
                    })}
                  </>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative w-full">
            <div className="flex items-center gap-6">
              <div
                className="relative w-32 h-32 group/image cursor-pointer"
                onClick={() => setPreviewImage(selectedImage.url)}
              >
                {(imageLoadingStates[selectedImage.url] || localLoading) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-xl">
                    <Loader className="h-8 w-8" />
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage.url}
                  alt="Image preview"
                  className="w-full h-full object-cover rounded-xl transition-all duration-300 group-hover/image:scale-[1.02] group-hover/image:shadow-lg"
                  onLoad={() => {
                    setImageLoadingStates((prev) => ({
                      ...prev,
                      [selectedImage.url]: false,
                    }));
                  }}
                  onError={() => {
                    setImageLoadingStates((prev) => ({
                      ...prev,
                      [selectedImage.url]: false,
                    }));
                    toast.error(t("FailedToLoadImage"));
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 rounded-xl" />
                <p className="absolute bottom-2 left-2 right-2 text-xs text-white text-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-300">
                  {t("ClickToPreview")}
                </p>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t("SelectedImage")}
                </p>
                <p className="text-xs text-muted-foreground/80">
                  {selectedImage.file.name.slice(0, 12)}
                  {selectedImage.file.name.length > 12 && "..."}
                </p>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="hover:bg-destructive/90 transition-colors duration-300"
                          onClick={handleImageRemove}
                          disabled={localLoading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("Delete")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="hover:bg-primary/10 transition-colors duration-300"
                          onClick={() =>
                            document.getElementById(inputId)?.click()
                          }
                          disabled={localLoading}
                        >
                          <ImagePlus className="h-4 w-4 " />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("Change")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Dialog */}
      {previewImage && (
        <ImagePreviewer
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          images={[
            {
              url: previewImage,
              alt: "Image preview",
            },
          ]}
        />
      )}
    </div>
  );
};
