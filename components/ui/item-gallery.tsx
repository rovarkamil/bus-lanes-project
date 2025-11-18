"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ItemGalleryProps {
  thumbnailUrl: string | null;
  imageUrls: string[];
  name: string;
}

export function ItemGallery({
  thumbnailUrl,
  imageUrls,
  name,
}: ItemGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(
    thumbnailUrl || (imageUrls.length > 0 ? imageUrls[0] : null)
  );

  // Combine thumbnail and image URLs for the gallery
  const allImages = thumbnailUrl ? [thumbnailUrl, ...imageUrls] : imageUrls;

  // Remove duplicates if thumbnailUrl is also in imageUrls
  const uniqueImages = Array.from(new Set(allImages));

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square rounded-lg overflow-hidden border border-border">
        {selectedImage ? (
          <Image
            src={selectedImage}
            alt={name}
            fill
            className="object-cover transition-all duration-300"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#2A2A2A]">
            <Image
              src="/images/no-image.jpg"
              alt="No image"
              fill
              className="opacity-50"
            />
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {uniqueImages.length > 1 && (
        <div className="grid grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {uniqueImages.map((url, index) => (
            <button
              key={`${url}-${index}`}
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                selectedImage === url
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/60"
              )}
              onClick={() => setSelectedImage(url)}
            >
              <Image
                src={url}
                alt={`${name} image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 25vw, 12vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
