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

interface MultipleImageUploaderProps {
  onImagesSelect: (files: File[], urls?: string[]) => void;
  onImageRemove: (index: number) => void;
  selectedImages: Array<{ file: File; url: string }>;
  maxSize?: number; // in bytes
  label?: string;
  className?: string;
  requiredWidth?: number;
  requiredHeight?: number;
  shouldUploadImmediately?: boolean;
  maxImages?: number;
}

export const MultipleImageUploader: React.FC<MultipleImageUploaderProps> = ({
  onImagesSelect,
  onImageRemove,
  selectedImages = [],
  maxSize = 5 * 1024 * 1024, // 5MB default
  label = "Images",
  className,
  requiredWidth,
  requiredHeight,
  // shouldUploadImmediately = false,
  maxImages = 10,
}) => {
  const { t } = useTranslation("Common");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageLoadingStates, setImageLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [localLoading, setLocalLoading] = useState(false);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesToProcess = Array.from(files);
    const remainingSlots = maxImages - selectedImages.length;

    if (filesToProcess.length > remainingSlots) {
      toast.error(
        t("YouCanOnlyUpload", {
          count: remainingSlots,
          plural: remainingSlots === 1 ? "" : "s",
        })
      );
      return;
    }

    setLocalLoading(true);
    const newImages: Array<{ file: File; url: string }> = [];

    // Create a Set of existing file names to prevent duplicates
    const existingFileNames = new Set(
      selectedImages.map((img) => img.file.name)
    );

    for (const file of filesToProcess) {
      // Skip files with duplicate names
      if (existingFileNames.has(file.name)) {
        toast.warning(
          t("SkippingDuplicateImage", {
            name: file.name,
          })
        );
        continue;
      }

      const img = new window.Image();
      img.src = URL.createObjectURL(file);

      await new Promise((resolve) => {
        img.onload = async () => {
          // Check file size
          if (file.size > maxSize) {
            toast.error(
              t("ImageSizeMustBeLessThan", {
                size: maxSize / (1024 * 1024),
              })
            );
            resolve(null);
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
              resolve(null);
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

            newImages.push({ file: compressedFile, url });

            setImageLoadingStates((prev) => ({
              ...prev,
              [url]: false,
            }));

            resolve(null);
          } catch (error) {
            console.error("Error processing image:", error);
            toast.error(t("FailedToProcessImage"));
            resolve(null);
          }
        };
      });
    }

    if (newImages.length > 0) {
      // Pass the complete image data including url and other properties
      onImagesSelect(
        newImages.map((img) => img.file),
        newImages.map((img) => img.url)
      );
    }

    setLocalLoading(false);
    // Clear the input to allow selecting the same files again if needed
    e.target.value = "";
  };

  const handleImageRemove = (index: number) => {
    // Only revoke URL if it's a local object URL (not a remote URL)
    if (
      selectedImages[index]?.url &&
      selectedImages[index].url.startsWith("blob:")
    ) {
      URL.revokeObjectURL(selectedImages[index].url);
    }
    onImageRemove(index);
    setImageLoadingStates((prev) => {
      const newStates = { ...prev };
      delete newStates[selectedImages[index].url];
      return newStates;
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
      <label
        htmlFor="multipleImageInput"
        className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300"
      >
        <Image className="h-4 w-4 text-primary" aria-label={label} />
        {label} ({selectedImages.length}/{maxImages})
      </label>
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all duration-300",
          "bg-muted/30 dark:bg-muted/10",
          "hover:bg-muted/50 dark:hover:bg-muted/20",
          "group",
          selectedImages.length > 0 ? "p-4" : "p-8"
        )}
      >
        <input
          id="multipleImageInput"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleImageSelect}
          disabled={localLoading || selectedImages.length >= maxImages}
          multiple
        />

        {selectedImages.length === 0 ? (
          <div
            className="flex flex-col items-center gap-4 text-center cursor-pointer w-full h-full"
            onClick={() =>
              document.getElementById("multipleImageInput")?.click()
            }
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {selectedImages.map((image, index) => (
                <div
                  key={`${image.url}-${index}`}
                  className="relative group/image"
                >
                  <div
                    className="relative w-full aspect-square cursor-pointer"
                    onClick={() => setPreviewImage(image.url)}
                  >
                    {(imageLoadingStates[image.url] || localLoading) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-xl">
                        <Loader className="h-8 w-8" />
                      </div>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover rounded-xl transition-all duration-300 group-hover/image:scale-[1.02] group-hover/image:shadow-lg"
                      onLoad={() => {
                        setImageLoadingStates((prev) => ({
                          ...prev,
                          [image.url]: false,
                        }));
                      }}
                      onError={(e) => {
                        console.error("Failed to load image:", image.url);
                        setImageLoadingStates((prev) => ({
                          ...prev,
                          [image.url]: false,
                        }));
                        // Add fallback image or styling for error state
                        (e.target as HTMLImageElement).src =
                          "/images/image-error.png";
                        (e.target as HTMLImageElement).classList.add(
                          "error-image"
                        );
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 rounded-xl" />
                    <p className="absolute bottom-2 left-2 right-2 text-xs text-white text-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-300">
                      {t("ClickToPreview")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300"
                    onClick={() => handleImageRemove(index)}
                    disabled={localLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {selectedImages.length < maxImages && (
                <div
                  className="relative w-full aspect-square cursor-pointer border-2 border-dashed rounded-xl flex items-center justify-center bg-muted/30 dark:bg-muted/10 hover:bg-muted/50 dark:hover:bg-muted/20 transition-all duration-300"
                  onClick={() =>
                    document.getElementById("multipleImageInput")?.click()
                  }
                >
                  <ImagePlus className="h-8 w-8 text-primary" />
                </div>
              )}
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
              alt: label,
            },
          ]}
        />
      )}
    </div>
  );
};
