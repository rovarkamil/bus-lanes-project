import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface UploadedFile {
  url: string;
  path: string;
  name: string;
  size: number;
  type: string;
}

/**
 * Ensures a bucket exists, creates it if it doesn't
 */
const ensureBucketExists = async (bucket: string) => {
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === bucket);

  if (!bucketExists) {
    // Create bucket with public access
    const { error: bucketError } = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    });
    if (bucketError) throw bucketError;

    // Update bucket to be public
    const { error: updateError } = await supabase.storage.updateBucket(bucket, {
      public: true,
    });
    if (updateError) throw updateError;
  }
};

/**
 * Uploads a single image to Supabase Storage
 * @param file File to upload
 * @param bucket Bucket name (default: 'images')
 * @param folder Folder path inside bucket (default: '')
 * @returns Promise<UploadedFile>
 */
export const uploadSingleImage = async (
  file: File,
  bucket: string = "images",
  folder: string = ""
): Promise<UploadedFile> => {
  try {
    // Ensure bucket exists
    await ensureBucketExists(bucket);

    // Generate a unique file name
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
      name: fileName,
      size: file.size,
      type: file.type,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

/**
 * Uploads multiple images to Supabase Storage
 * @param files Array of files to upload
 * @param bucket Bucket name (default: 'images')
 * @param folder Folder path inside bucket (default: '')
 * @returns Promise<UploadedFile[]>
 */
export const uploadMultipleImages = async (
  files: File[],
  bucket: string = "images",
  folder: string = ""
): Promise<UploadedFile[]> => {
  try {
    // Ensure bucket exists
    await ensureBucketExists(bucket);

    const uploadPromises = files.map((file) =>
      uploadSingleImage(file, bucket, folder)
    );
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
};

/**
 * Deletes a file from Supabase Storage
 * @param path File path in storage
 * @param bucket Bucket name (default: 'images')
 */
export const deleteFile = async (
  path: string,
  bucket: string = "images"
): Promise<void> => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};
