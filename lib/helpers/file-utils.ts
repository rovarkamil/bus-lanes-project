import { Prisma } from "@prisma/client";
import { handleFilesCreation } from "@/utils/file-handler";
import { v4 as uuidv4 } from "uuid";

export type UploadedFileInput = {
  id?: string;
  url: string;
  type?: string | null;
  name?: string | null;
  size?: number | null;
  isExisting?: boolean;
};

type PrismaTransaction = Prisma.TransactionClient;

function partitionFileInputs(files?: UploadedFileInput[]) {
  const existingIds: string[] = [];
  const newFiles: UploadedFileInput[] = [];

  (files ?? []).forEach((file) => {
    if (!file) return;
    if (file.isExisting && file.id) {
      existingIds.push(file.id);
      return;
    }

    if (file.url) {
      newFiles.push(file);
    }
  });

  return { existingIds, newFiles };
}

async function createFiles(
  files: UploadedFileInput[],
  tx: PrismaTransaction,
  uploadedById?: string | null
): Promise<string[]> {
  if (!files.length) return [];

  const created = await handleFilesCreation(
    files.map((file) => ({
      id: file.id ?? uuidv4(),
      url: file.url,
      type: file.type ?? null,
      name: file.name ?? null,
      size: file.size ?? null,
      uploadedById: uploadedById ?? null,
    })),
    tx
  );

  return created.map((file) => file.id);
}

export async function buildFileConnections({
  files,
  tx,
  uploadedById,
}: {
  files?: UploadedFileInput[];
  tx: PrismaTransaction;
  uploadedById?: string | null;
}) {
  if (!files || files.length === 0) {
    return undefined;
  }

  const { existingIds, newFiles } = partitionFileInputs(files);
  const createdIds = await createFiles(newFiles, tx, uploadedById);
  const ids = [...existingIds, ...createdIds];

  if (!ids.length) {
    return undefined;
  }

  return ids.map((id) => ({ id }));
}

export async function buildFileUpdateOperations({
  files,
  tx,
  uploadedById,
}: {
  files?: UploadedFileInput[];
  tx: PrismaTransaction;
  uploadedById?: string | null;
}) {
  if (!files) {
    return undefined;
  }

  const { existingIds, newFiles } = partitionFileInputs(files);
  const createdIds = await createFiles(newFiles, tx, uploadedById);
  const ids = [...existingIds, ...createdIds];

  return {
    set: [],
    ...(ids.length ? { connect: ids.map((id) => ({ id })) } : {}),
  };
}

export async function resolveSingleFileId({
  file,
  tx,
  uploadedById,
}: {
  file?: UploadedFileInput | null;
  tx: PrismaTransaction;
  uploadedById?: string | null;
}): Promise<string | undefined> {
  if (!file) {
    return undefined;
  }

  if (file.isExisting && file.id) {
    return file.id;
  }

  if (!file.url) {
    return undefined;
  }

  const created = await handleFilesCreation(
    [
      {
        id: file.id ?? uuidv4(),
        url: file.url,
        type: file.type ?? null,
        name: file.name ?? null,
        size: file.size ?? null,
        uploadedById: uploadedById ?? null,
      },
    ],
    tx
  );

  return created[0]?.id;
}


