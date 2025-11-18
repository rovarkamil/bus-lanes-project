"use server";

import { Prisma } from "@prisma/client";
import { CreateZoneData, UpdateZoneData } from "@/types/models/zone";
import {
  handleLanguageCreation,
  handleLanguageUpdate,
} from "@/utils/language-handler";
import { normalizeLanguageFields } from "@/lib/helpers/language-utils";

type PrismaTransaction = Prisma.TransactionClient;

export async function createZoneWithBusinessLogic({
  data,
  tx,
}: {
  data: CreateZoneData;
  tx: PrismaTransaction;
}) {
  const languagePayload = normalizeLanguageFields(
    data,
    ["nameFields", "descriptionFields"] as const
  );
  const { nameId, descriptionId } = await handleLanguageCreation(
    languagePayload,
    tx
  );

  const zone = await tx.zone.create({
    data: {
      color: data.color,
      isActive: data.isActive ?? true,
      name: { connect: { id: nameId } },
      description: descriptionId
        ? { connect: { id: descriptionId } }
        : undefined,
    },
    include: {
      name: true,
      description: true,
      stops: { select: { id: true, nameId: true } },
    },
  });

  return zone;
}

export async function updateZoneWithBusinessLogic({
  data,
  tx,
}: {
  data: UpdateZoneData;
  tx: PrismaTransaction;
}) {
  const { id, nameFields, descriptionFields, ...rest } = data;

  if (!id) {
    throw new Error("Zone ID is required for update");
  }

  const existing = await tx.zone.findUnique({
    where: { id },
    select: {
      id: true,
      deletedAt: true,
      nameId: true,
      descriptionId: true,
    },
  });

  if (!existing || existing.deletedAt) {
    throw new Error("Zone not found or has been deleted");
  }

  if (nameFields || descriptionFields) {
    const languageUpdatePayload = normalizeLanguageFields(
      {
        id,
        model: "zone",
        ...(existing.nameId ? { nameId: existing.nameId } : {}),
        ...(existing.descriptionId ? { descriptionId: existing.descriptionId } : {}),
        ...(nameFields ? { nameFields } : {}),
        ...(descriptionFields ? { descriptionFields } : {}),
      },
      ["nameFields", "descriptionFields"] as const
    );

    await handleLanguageUpdate(languageUpdatePayload, tx);
  }

  const zone = await tx.zone.update({
    where: { id },
    data: rest,
    include: {
      name: true,
      description: true,
      stops: { select: { id: true, nameId: true } },
    },
  });

  return zone;
}

export async function deleteZoneWithBusinessLogic({
  id,
  tx,
}: {
  id: string;
  tx: PrismaTransaction;
}) {
  if (!id) {
    throw new Error("Zone ID is required for deletion");
  }

  const existing = await tx.zone.findUnique({
    where: { id },
    select: {
      id: true,
      deletedAt: true,
      _count: {
        select: { stops: true },
      },
    },
  });

  if (!existing || existing.deletedAt) {
    throw new Error("Zone not found or already deleted");
  }

  if (existing._count.stops > 0) {
    throw new Error("Cannot delete zone with assigned bus stops");
  }

  return tx.zone.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}


