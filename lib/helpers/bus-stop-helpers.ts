"use server";

import { Prisma } from "@prisma/client";
import { CreateBusStopData, UpdateBusStopData } from "@/types/models/bus-stop";
import {
  handleLanguageCreation,
  handleLanguageUpdate,
} from "@/utils/language-handler";
import {
  buildFileConnections,
  buildFileUpdateOperations,
  UploadedFileInput,
} from "@/lib/helpers/file-utils";
import { normalizeLanguageFields } from "@/lib/helpers/language-utils";

type PrismaTransaction = Prisma.TransactionClient;

type BusStopCreateData = CreateBusStopData & {
  images?: UploadedFileInput[];
};

type BusStopUpdateData = UpdateBusStopData & {
  images?: UploadedFileInput[];
};

export async function createBusStopWithBusinessLogic({
  data,
  tx,
  uploadedById,
}: {
  data: BusStopCreateData;
  tx: PrismaTransaction;
  uploadedById?: string | null;
}) {
  const languagePayload = normalizeLanguageFields(data, [
    "nameFields",
    "descriptionFields",
  ] as const);
  const { nameId, descriptionId } = await handleLanguageCreation(
    languagePayload,
    tx
  );

  const imageConnections = await buildFileConnections({
    files: data.images,
    tx,
    uploadedById,
  });

  const stop = await tx.busStop.create({
    data: {
      latitude: data.latitude,
      longitude: data.longitude,
      hasShelter: data.hasShelter ?? false,
      hasBench: data.hasBench ?? false,
      hasLighting: data.hasLighting ?? false,
      isAccessible: data.isAccessible ?? false,
      hasRealTimeInfo: data.hasRealTimeInfo ?? false,
      order: data.order,
      name: { connect: { id: nameId } },
      description: descriptionId
        ? { connect: { id: descriptionId } }
        : undefined,
      icon: data.iconId ? { connect: { id: data.iconId } } : undefined,
      zone: data.zoneId ? { connect: { id: data.zoneId } } : undefined,
      images: imageConnections ? { connect: imageConnections } : undefined,
      lanes: data.laneIds?.length
        ? {
            connect: data.laneIds.map((laneId) => ({ id: laneId })),
          }
        : undefined,
      routes: data.routeIds?.length
        ? {
            connect: data.routeIds.map((routeId) => ({ id: routeId })),
          }
        : undefined,
    },
    include: {
      name: true,
      description: true,
      icon: true,
      zone: true,
      images: true,
      lanes: { select: { id: true, nameId: true } },
      routes: { select: { id: true, nameId: true } },
      schedules: true,
    },
  });

  return stop;
}

export async function updateBusStopWithBusinessLogic({
  data,
  tx,
  uploadedById,
}: {
  data: BusStopUpdateData;
  tx: PrismaTransaction;
  uploadedById?: string | null;
}) {
  const {
    id,
    nameFields,
    descriptionFields,
    images,
    laneIds,
    routeIds,
    iconId,
    zoneId,
    isActive, // Remove isActive as it's not a valid BusStop field
    ...rest
  } = data;

  if (!id) {
    throw new Error("Bus stop ID is required for update");
  }

  const existing = await tx.busStop.findUnique({
    where: { id },
    select: {
      id: true,
      deletedAt: true,
      nameId: true,
      descriptionId: true,
    },
  });

  if (!existing || existing.deletedAt) {
    throw new Error("Bus stop not found or has been deleted");
  }

  if (nameFields || descriptionFields) {
    const languageUpdatePayload = normalizeLanguageFields(
      {
        id,
        model: "busStop",
        ...(existing.nameId ? { nameId: existing.nameId } : {}),
        ...(existing.descriptionId
          ? { descriptionId: existing.descriptionId }
          : {}),
        ...(nameFields ? { nameFields } : {}),
        ...(descriptionFields ? { descriptionFields } : {}),
      },
      ["nameFields", "descriptionFields"] as const
    );

    await handleLanguageUpdate(languageUpdatePayload, tx);
  }

  const imagesUpdate = await buildFileUpdateOperations({
    files: images,
    tx,
    uploadedById,
  });

  // Only include valid BusStop fields in updateData
  // Filter out any invalid fields like 'isActive' which doesn't exist on BusStop
  const updateData: Prisma.BusStopUpdateInput = {};
  
  if (rest.latitude !== undefined) updateData.latitude = rest.latitude;
  if (rest.longitude !== undefined) updateData.longitude = rest.longitude;
  if (rest.hasShelter !== undefined) updateData.hasShelter = rest.hasShelter;
  if (rest.hasBench !== undefined) updateData.hasBench = rest.hasBench;
  if (rest.hasLighting !== undefined) updateData.hasLighting = rest.hasLighting;
  if (rest.isAccessible !== undefined) updateData.isAccessible = rest.isAccessible;
  if (rest.hasRealTimeInfo !== undefined) updateData.hasRealTimeInfo = rest.hasRealTimeInfo;
  if (rest.order !== undefined) updateData.order = rest.order;

  if (iconId !== undefined) {
    updateData.icon =
      iconId === null || iconId === ""
        ? { disconnect: true }
        : { connect: { id: iconId } };
  }

  if (zoneId !== undefined) {
    updateData.zone =
      zoneId === null || zoneId === ""
        ? { disconnect: true }
        : { connect: { id: zoneId } };
  }

  if (imagesUpdate) {
    updateData.images = imagesUpdate;
  }

  if (laneIds) {
    updateData.lanes = {
      set: [],
      ...(laneIds.length
        ? { connect: laneIds.map((laneId) => ({ id: laneId })) }
        : {}),
    };
  }

  if (routeIds) {
    updateData.routes = {
      set: [],
      ...(routeIds.length
        ? { connect: routeIds.map((routeId) => ({ id: routeId })) }
        : {}),
    };
  }

  const stop = await tx.busStop.update({
    where: { id },
    data: updateData,
    include: {
      name: true,
      description: true,
      icon: true,
      zone: true,
      images: true,
      lanes: { select: { id: true, nameId: true } },
      routes: { select: { id: true, nameId: true } },
      schedules: true,
    },
  });

  return stop;
}

export async function deleteBusStopWithBusinessLogic({
  id,
  tx,
}: {
  id: string;
  tx: PrismaTransaction;
}) {
  if (!id) {
    throw new Error("Bus stop ID is required for deletion");
  }

  const existing = await tx.busStop.findUnique({
    where: { id },
    select: { id: true, deletedAt: true, schedules: { select: { id: true } } },
  });

  if (!existing || existing.deletedAt) {
    throw new Error("Bus stop not found or already deleted");
  }

  if (existing.schedules.length > 0) {
    throw new Error("Cannot delete bus stop with active schedules");
  }

  return tx.busStop.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
