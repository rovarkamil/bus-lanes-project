import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
    video: { maxFileSize: "32MB" },
    audio: { maxFileSize: "16MB" },
    pdf: { maxFileSize: "4GB" },
    text: { maxFileSize: "4MB" },
    blob: { maxFileSize: "4MB" },
  }).onUploadComplete(async () => {
    console.log("Upload complete");
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
