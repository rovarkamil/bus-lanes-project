import { baseModelSchema } from "@/types/models/common";
import { Prisma, PrismaClient } from "@prisma/client";
import { ClientUploadedFileData } from "uploadthing/types";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';

export type FileData = {
  url: string;
  type?: string | null;
  name?: string | null;
  size?: number | null;
  uploadedById?: string | null;
  galleryId?: string | null;
};

type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export type FileWithRelations = Prisma.FileGetPayload<{
  include: {
    uploadedBy: true;
  };
}>;

export const createFileSchema = baseModelSchema.extend({
  url: z.string(),
  type: z.string().nullable(),
  name: z.string().nullable(),
  size: z.number().nullable(),
  uploadedById: z.string().nullable(),
});

export const updateFileSchema = createFileSchema.partial().extend({
  id: z.string(),
});

export type CreateFileData = z.infer<typeof createFileSchema>;

export type UpdateFileData = z.infer<typeof updateFileSchema>;

export type UploadedFile = {
  file: File;
  url: string;
};

type StartUploadFunction = (
  files: File[]
) => Promise<ClientUploadedFileData<null>[] | undefined>;

export async function handleFileUploadAndCreate(
  uploadedFile: UploadedFile,
  startUpload: StartUploadFunction,
  prisma: PrismaClient | PrismaTransactionClient
): Promise<FileWithRelations> {
  const uploadResponse = await startUpload([uploadedFile.file]);
  if (!uploadResponse || uploadResponse.length === 0) {
    throw new Error("Upload failed");
  }

  const fileData: CreateFileData = {
    id: uuidv4(),
    url: uploadResponse[0].url,
    type: uploadedFile.file.type,
    name: uploadedFile.file.name,
    size: uploadedFile.file.size,
    uploadedById: "",
  };

  return handleFileCreation(fileData, prisma);
}

async function handleFileCreation(
  data: CreateFileData,
  prisma: PrismaClient | PrismaTransactionClient
): Promise<FileWithRelations> {
  const file = await prisma.file.create({
    data,
    include: {
      uploadedBy: true,
    },
  });
  return file;
}

async function handleFileUpdate(
  data: UpdateFileData,
  prisma: PrismaClient | PrismaTransactionClient
): Promise<FileWithRelations> {
  const { id, ...updateData } = data;

  const file = await prisma.file.update({
    where: { id },
    data: updateData,
    include: {
      uploadedBy: true,
    },
  });

  return file;
}

async function handleFilesCreation(
  data: CreateFileData[],
  prisma: PrismaClient | PrismaTransactionClient
): Promise<FileWithRelations[]> {
  const files = await prisma.file.createManyAndReturn({
    data,
    include: {
      uploadedBy: true,
    },
  });

  return files;
}

async function handleFilesUpdates(
  data: UpdateFileData[],
  prisma: PrismaClient | PrismaTransactionClient
): Promise<FileWithRelations[]> {
  const ids = data.map((item) => item.id);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateDatas = data.map(({ id, ...rest }) => rest);

  const files = await prisma.file.updateManyAndReturn({
    where: { id: { in: ids } },
    data: updateDatas,
    include: {
      uploadedBy: true,
    },
  });

  return files;
}

export {
  handleFileCreation,
  handleFileUpdate,
  handleFilesCreation,
  handleFilesUpdates,
};
