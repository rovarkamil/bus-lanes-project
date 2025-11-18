import imageCompression from "browser-image-compression";

export interface CompressionOptions {
  maxSizeMB?: number;
  useWebWorker?: boolean;
  quality?: number;
}

export const compressImage = async (
  file: File,
  options?: CompressionOptions
): Promise<File> => {
  const defaultOptions: CompressionOptions = {
    maxSizeMB: 2, // Default max file size is 1MB
    useWebWorker: true, // Use web worker for better performance
    quality: 1, // Default quality is 0.8 (80%)
  };

  const compressionOptions = {
    ...defaultOptions,
    ...options,
  };

  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    return compressedFile;
  } catch (error) {
    console.error("Error compressing image:", error);
    throw error;
  }
};

/**
 * Utility function to check if a file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith("image/");
};
