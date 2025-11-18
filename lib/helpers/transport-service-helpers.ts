"use server";

import { Prisma } from "@prisma/client";
import {
  CreateTransportServiceData,
  UpdateTransportServiceData,
} from "@/types/models/transport-service";
import {
  handleLanguageCreation,
  handleLanguageUpdate,
} from "@/utils/language-handler";
import { normalizeLanguageFields } from "@/lib/helpers/language-utils";

type PrismaTransaction = Prisma.TransactionClient;

export async function createTransportServiceWithBusinessLogic({
  data,
  tx,
}: {
  data: CreateTransportServiceData;
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

  const service = await tx.transportService.create({
    data: {
      type: data.type,
      color: data.color,
      capacity: data.capacity,
      operatingFrom: data.operatingFrom,
      operatingTo: data.operatingTo,
      isActive: data.isActive ?? true,
      name: {
        connect: { id: nameId },
      },
      description: descriptionId
        ? {
            connect: { id: descriptionId },
          }
        : undefined,
      icon: data.iconId
        ? {
            connect: { id: data.iconId },
          }
        : undefined,
    },
    include: {
      name: true,
      description: true,
      icon: {
        include: {
          file: true,
        },
      },
      routes: {
        select: { id: true, routeNumber: true, isActive: true },
      },
      lanes: {
        select: { id: true, isActive: true },
      },
    },
  });

  return service;
}

export async function updateTransportServiceWithBusinessLogic({
  data,
  tx,
}: {
  data: UpdateTransportServiceData;
  tx: PrismaTransaction;
}) {
  const { id, nameFields, descriptionFields, iconId, ...rest } = data;

  if (!id) {
    throw new Error("Transport service ID is required for update");
  }

  const existing = await tx.transportService.findUnique({
    where: { id },
    select: { id: true, deletedAt: true, nameId: true, descriptionId: true },
  });

  if (!existing || existing.deletedAt) {
    throw new Error("Transport service not found or has been deleted");
  }

  if (nameFields || descriptionFields) {
    const languageUpdatePayload = normalizeLanguageFields(
      {
        id,
        model: "transportService",
        ...(existing.nameId ? { nameId: existing.nameId } : {}),
        ...(existing.descriptionId ? { descriptionId: existing.descriptionId } : {}),
        ...(nameFields ? { nameFields } : {}),
        ...(descriptionFields ? { descriptionFields } : {}),
      },
      ["nameFields", "descriptionFields"] as const
    );

    await handleLanguageUpdate(languageUpdatePayload, tx);
  }

  const updateData: Prisma.TransportServiceUpdateInput = {
    ...rest,
  };

  if (iconId !== undefined) {
    updateData.icon =
      iconId === null || iconId === ""
        ? { disconnect: true }
        : { connect: { id: iconId } };
  }

  const service = await tx.transportService.update({
    where: { id },
    data: updateData,
    include: {
      name: true,
      description: true,
      icon: {
        include: {
          file: true,
        },
      },
      routes: {
        select: { id: true, routeNumber: true, isActive: true },
      },
      lanes: {
        select: { id: true, isActive: true },
      },
    },
  });

  return service;
}

export async function deleteTransportServiceWithBusinessLogic({
  id,
  tx,
}: {
  id: string;
  tx: PrismaTransaction;
}) {
  if (!id) {
    throw new Error("Transport service ID is required for deletion");
  }

  const existing = await tx.transportService.findUnique({
    where: { id },
    select: { id: true, deletedAt: true },
  });

  if (!existing || existing.deletedAt) {
    throw new Error("Transport service not found or already deleted");
  }

  const [routeUsage, laneUsage] = await Promise.all([
    tx.busRoute.count({
      where: { serviceId: id, deletedAt: null },
    }),
    tx.busLane.count({
      where: { serviceId: id, deletedAt: null },
    }),
  ]);

  if (routeUsage > 0 || laneUsage > 0) {
    throw new Error(
      "Cannot delete transport service with active routes or lanes"
    );
  }

  return tx.transportService.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}


