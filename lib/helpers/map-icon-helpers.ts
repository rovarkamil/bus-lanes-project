"use server";

import { Prisma } from "@prisma/client";
import {
  CreateMapIconData,
  UpdateMapIconData,
} from "@/types/models/map-icon";
import {
  handleLanguageCreation,
  handleLanguageUpdate,
} from "@/utils/language-handler";
import { resolveSingleFileId, UploadedFileInput } from "@/lib/helpers/file-utils";
import { normalizeLanguageFields } from "@/lib/helpers/language-utils";

type PrismaTransaction = Prisma.TransactionClient;

type MapIconCreateData = CreateMapIconData & {
  file?: UploadedFileInput;
};

type MapIconUpdateData = UpdateMapIconData & {
  file?: UploadedFileInput;
};

export async function createMapIconWithBusinessLogic({
  data,
  tx,
  uploadedById,
}: {
  data: MapIconCreateData;
  tx: PrismaTransaction;
  uploadedById?: string | null;
}) {
  const languagePayload = normalizeLanguageFields(
    data,
    ["nameFields", "descriptionFields"] as const
  );
  const { nameId, descriptionId } = await handleLanguageCreation(
    languagePayload,
    tx
  );

  const fileId = await resolveSingleFileId({
    file: data.file,
    tx,
    uploadedById,
  });

  if (!fileId) {
    throw new Error("Map icon file is required");
  }

  const icon = await tx.mapIcon.create({
    data: {
      iconSize: data.iconSize,
      iconAnchorX: data.iconAnchorX,
      iconAnchorY: data.iconAnchorY,
      popupAnchorX: data.popupAnchorX,
      popupAnchorY: data.popupAnchorY,
      isActive: data.isActive ?? true,
      name: { connect: { id: nameId } },
      description: descriptionId
        ? { connect: { id: descriptionId } }
        : undefined,
      file: { connect: { id: fileId } },
    },
    include: {
      name: true,
      description: true,
      file: true,
      transportServices: { select: { id: true, nameId: true } },
      busStops: { select: { id: true, nameId: true } },
    },
  });

  return icon;
}

export async function updateMapIconWithBusinessLogic({
  data,
  tx,
  uploadedById,
}: {
  data: MapIconUpdateData;
  tx: PrismaTransaction;
  uploadedById?: string | null;
}) {
  const { id, nameFields, descriptionFields, file, ...rest } = data;

  if (!id) {
    throw new Error("Map icon ID is required for update");
  }

  const existing = await tx.mapIcon.findUnique({
    where: { id },
    select: {
      id: true,
      deletedAt: true,
      nameId: true,
      descriptionId: true,
      fileId: true,
    },
  });

  if (!existing || existing.deletedAt) {
    throw new Error("Map icon not found or has been deleted");
  }

  if (nameFields || descriptionFields) {
    const languageUpdatePayload = normalizeLanguageFields(
      {
        id,
        model: "mapIcon",
        ...(existing.nameId ? { nameId: existing.nameId } : {}),
        ...(existing.descriptionId ? { descriptionId: existing.descriptionId } : {}),
        ...(nameFields ? { nameFields } : {}),
        ...(descriptionFields ? { descriptionFields } : {}),
      },
      ["nameFields", "descriptionFields"] as const
    );

    await handleLanguageUpdate(languageUpdatePayload, tx);
  }

  let nextFileId: string | undefined;
  if (file) {
    nextFileId = await resolveSingleFileId({
      file,
      tx,
      uploadedById,
    });
    if (!nextFileId) {
      throw new Error("Invalid file payload for map icon");
    }
  }

  const updateData: Prisma.MapIconUpdateInput = {
    ...rest,
  };

  if (nextFileId) {
    updateData.file = { connect: { id: nextFileId } };
  }

  const icon = await tx.mapIcon.update({
    where: { id },
    data: updateData,
    include: {
      name: true,
      description: true,
      file: true,
      transportServices: { select: { id: true, nameId: true } },
      busStops: { select: { id: true, nameId: true } },
    },
  });

  return icon;
}

export async function deleteMapIconWithBusinessLogic({
  id,
  tx,
}: {
  id: string;
  tx: PrismaTransaction;
}) {
  if (!id) {
    throw new Error("Map icon ID is required for deletion");
  }

  const existing = await tx.mapIcon.findUnique({
    where: { id },
    select: { id: true, deletedAt: true },
  });

  if (!existing || existing.deletedAt) {
    throw new Error("Map icon not found or already deleted");
  }

  const [serviceUsage, stopUsage] = await Promise.all([
    tx.transportService.count({
      where: { iconId: id, deletedAt: null },
    }),
    tx.busStop.count({
      where: { iconId: id, deletedAt: null },
    }),
  ]);

  if (serviceUsage > 0 || stopUsage > 0) {
    throw new Error("Cannot delete map icon that is currently in use");
  }

  return tx.mapIcon.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}


