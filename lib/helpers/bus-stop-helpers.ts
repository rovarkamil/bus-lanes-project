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
  if (rest.isAccessible !== undefined)
    updateData.isAccessible = rest.isAccessible;
  if (rest.hasRealTimeInfo !== undefined)
    updateData.hasRealTimeInfo = rest.hasRealTimeInfo;
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

/**
 * Create multiple bus stops efficiently using createMany
 * Optimized for bulk operations from map editor
 */
export async function createBusStopsBulkWithBusinessLogic({
  stops,
  tx,
}: {
  stops: Array<{
    nameFields: {
      en: string;
      ar?: string | null;
      ckb?: string | null;
    };
    descriptionFields?: {
      en?: string | null;
      ar?: string | null;
      ckb?: string | null;
    };
    latitude: number;
    longitude: number;
    images?: unknown[];
    laneIds?: string[];
    routeIds?: string[];
    iconId?: string | null;
    zoneId?: string | null;
    hasShelter?: boolean;
    hasBench?: boolean;
    hasLighting?: boolean;
    isAccessible?: boolean;
    hasRealTimeInfo?: boolean;
    order?: number;
  }>;
  tx: PrismaTransaction;
  uploadedById?: string | null;
}) {
  // Step 1: Create all language records in parallel
  const languagePromises = stops.map(async (stop) => {
    const nameLang = await tx.language.create({
      data: {
        en: stop.nameFields.en,
        ar: stop.nameFields.ar ?? null,
        ckb: stop.nameFields.ckb ?? null,
      },
    });

    let descriptionId: string | null = null;
    if (stop.descriptionFields) {
      const descLang = await tx.language.create({
        data: {
          en: stop.descriptionFields.en ?? "",
          ar: stop.descriptionFields.ar ?? null,
          ckb: stop.descriptionFields.ckb ?? null,
        },
      });
      descriptionId = descLang.id;
    }

    return { nameId: nameLang.id, descriptionId };
  });

  const languageRecords = await Promise.all(languagePromises);

  // Step 2: Handle image connections (if needed)
  // Note: For bulk operations, images might need to be handled differently
  // For now, we'll create stops without images and handle them separately if needed

  // Step 3: Create all stops using createMany (optimized)
  const stopsToCreate = stops.map((stop, index) => ({
    nameId: languageRecords[index].nameId,
    descriptionId: languageRecords[index].descriptionId,
    latitude: stop.latitude,
    longitude: stop.longitude,
    iconId: stop.iconId ?? null,
    zoneId: stop.zoneId ?? null,
    hasShelter: stop.hasShelter ?? false,
    hasBench: stop.hasBench ?? false,
    hasLighting: stop.hasLighting ?? false,
    isAccessible: stop.isAccessible ?? false,
    hasRealTimeInfo: stop.hasRealTimeInfo ?? false,
    order: stop.order ?? null,
  }));

  await tx.busStop.createMany({
    data: stopsToCreate,
  });

  // Step 4: Fetch created stops (createMany doesn't return records)
  const createdStops = await tx.busStop.findMany({
    where: {
      nameId: { in: languageRecords.map((r) => r.nameId) },
    },
    include: {
      name: true,
      description: true,
      icon: true,
      zone: true,
    },
    orderBy: { createdAt: "desc" },
    take: stops.length,
  });

  // Step 5: Handle relationships in parallel
  const relationshipPromises = createdStops.map(async (stop, index) => {
    const stopData = stops[index];

    // Connect lanes if provided
    if (stopData.laneIds && stopData.laneIds.length > 0) {
      await tx.busStop.update({
        where: { id: stop.id },
        data: {
          lanes: {
            connect: stopData.laneIds.map((laneId) => ({ id: laneId })),
          },
        },
      });
    }

    // Connect routes if provided
    if (stopData.routeIds && stopData.routeIds.length > 0) {
      await tx.busStop.update({
        where: { id: stop.id },
        data: {
          routes: {
            connect: stopData.routeIds.map((routeId) => ({ id: routeId })),
          },
        },
      });
    }
  });

  await Promise.all(relationshipPromises);

  // Step 6: Fetch final stops with all relations
  const finalStops = await tx.busStop.findMany({
    where: {
      id: { in: createdStops.map((s) => s.id) },
    },
    include: {
      name: true,
      description: true,
      icon: true,
      zone: true,
      lanes: { select: { id: true } },
      routes: { select: { id: true } },
    },
  });

  return finalStops;
}

/**
 * Update multiple bus stops efficiently using updateMany where possible
 * Optimized for bulk operations from map editor
 */
export async function updateBusStopsBulkWithBusinessLogic({
  stops,
  tx,
}: {
  stops: Array<{
    id: string;
    latitude?: number;
    longitude?: number;
    nameFields?: {
      en: string;
      ar?: string | null;
      ckb?: string | null;
    };
    descriptionFields?: {
      en?: string | null;
      ar?: string | null;
      ckb?: string | null;
    };
    images?: unknown[];
    laneIds?: string[];
    routeIds?: string[];
    iconId?: string | null;
    zoneId?: string | null;
    hasShelter?: boolean;
    hasBench?: boolean;
    hasLighting?: boolean;
    isAccessible?: boolean;
    hasRealTimeInfo?: boolean;
    order?: number;
  }>;
  tx: PrismaTransaction;
  uploadedById?: string | null;
}) {
  const stopIds = stops.map((s) => s.id);

  // Step 1: Fetch existing stops with relations
  const existingStops = await tx.busStop.findMany({
    where: { id: { in: stopIds } },
    include: {
      name: true,
      description: true,
      lanes: { select: { id: true } },
      routes: { select: { id: true } },
    },
  });

  // Step 2: Update language records in parallel
  const languageUpdates = existingStops.map(async (existingStop) => {
    const stopData = stops.find((s) => s.id === existingStop.id);
    if (!stopData) return;

    if (stopData.nameFields && existingStop.nameId) {
      await tx.language.update({
        where: { id: existingStop.nameId },
        data: {
          en: stopData.nameFields.en,
          ar: stopData.nameFields.ar ?? null,
          ckb: stopData.nameFields.ckb ?? null,
        },
      });
    }

    if (stopData.descriptionFields) {
      if (existingStop.descriptionId) {
        await tx.language.update({
          where: { id: existingStop.descriptionId },
          data: {
            en: stopData.descriptionFields.en ?? "",
            ar: stopData.descriptionFields.ar ?? null,
            ckb: stopData.descriptionFields.ckb ?? null,
          },
        });
      } else if (stopData.descriptionFields.en) {
        const descLang = await tx.language.create({
          data: {
            en: stopData.descriptionFields.en,
            ar: stopData.descriptionFields.ar ?? null,
            ckb: stopData.descriptionFields.ckb ?? null,
          },
        });
        await tx.busStop.update({
          where: { id: existingStop.id },
          data: { descriptionId: descLang.id },
        });
      }
    }
  });

  await Promise.all(languageUpdates);

  // Step 3: Group stops by update values for bulk updateMany operations
  const updateGroups = new Map<
    string,
    { stopIds: string[]; data: Prisma.BusStopUpdateInput }
  >();

  stops.forEach((stopData) => {
    // Create a key for grouping stops with same update values
    const updateKey = JSON.stringify({
      iconId: stopData.iconId,
      zoneId: stopData.zoneId,
      hasShelter: stopData.hasShelter,
      hasBench: stopData.hasBench,
      hasLighting: stopData.hasLighting,
      isAccessible: stopData.isAccessible,
      hasRealTimeInfo: stopData.hasRealTimeInfo,
      order: stopData.order,
    });

    if (!updateGroups.has(updateKey)) {
      updateGroups.set(updateKey, {
        stopIds: [],
        data: {
          ...(stopData.iconId !== undefined && {
            icon:
              stopData.iconId === null
                ? { disconnect: true }
                : { connect: { id: stopData.iconId } },
          }),
          ...(stopData.zoneId !== undefined && {
            zone:
              stopData.zoneId === null
                ? { disconnect: true }
                : { connect: { id: stopData.zoneId } },
          }),
          ...(stopData.hasShelter !== undefined && {
            hasShelter: stopData.hasShelter,
          }),
          ...(stopData.hasBench !== undefined && {
            hasBench: stopData.hasBench,
          }),
          ...(stopData.hasLighting !== undefined && {
            hasLighting: stopData.hasLighting,
          }),
          ...(stopData.isAccessible !== undefined && {
            isAccessible: stopData.isAccessible,
          }),
          ...(stopData.hasRealTimeInfo !== undefined && {
            hasRealTimeInfo: stopData.hasRealTimeInfo,
          }),
          ...(stopData.order !== undefined && { order: stopData.order }),
        },
      });
    }

    updateGroups.get(updateKey)!.stopIds.push(stopData.id);
  });

  // Step 4: Execute bulk updates (note: updateMany doesn't support relations)
  // So we need to handle iconId and zoneId separately
  const bulkUpdates = Array.from(updateGroups.values()).map(async (group) => {
    // For each stop in the group, update individually if it has relations
    await Promise.all(
      group.stopIds.map((stopId) => {
        const stopData = stops.find((s) => s.id === stopId);
        if (!stopData) return Promise.resolve();

        const updateData: Prisma.BusStopUpdateInput = {
          ...(stopData.latitude !== undefined && {
            latitude: stopData.latitude,
          }),
          ...(stopData.longitude !== undefined && {
            longitude: stopData.longitude,
          }),
          ...group.data,
        };

        return tx.busStop.update({
          where: { id: stopId },
          data: updateData,
        });
      })
    );
  });

  await Promise.all(bulkUpdates);

  // Step 5: Handle lane and route connections (many-to-many)
  const relationshipUpdates = existingStops.map(async (existingStop) => {
    const stopData = stops.find((s) => s.id === existingStop.id);
    if (!stopData) return;

    // Handle lane connections
    if (stopData.laneIds !== undefined) {
      const currentLaneIds = existingStop.lanes.map((l) => l.id);
      const newLaneIds = stopData.laneIds;

      const lanesToRemove = currentLaneIds.filter(
        (id) => !newLaneIds.includes(id)
      );
      const lanesToAdd = newLaneIds.filter(
        (id) => !currentLaneIds.includes(id)
      );

      if (lanesToRemove.length > 0 || lanesToAdd.length > 0) {
        await tx.busStop.update({
          where: { id: existingStop.id },
          data: {
            lanes: {
              ...(lanesToRemove.length > 0 && {
                disconnect: lanesToRemove.map((id) => ({ id })),
              }),
              ...(lanesToAdd.length > 0 && {
                connect: lanesToAdd.map((id) => ({ id })),
              }),
            },
          },
        });
      }
    }

    // Handle route connections
    if (stopData.routeIds !== undefined) {
      const currentRouteIds = existingStop.routes.map((r) => r.id);
      const newRouteIds = stopData.routeIds;

      const routesToRemove = currentRouteIds.filter(
        (id) => !newRouteIds.includes(id)
      );
      const routesToAdd = newRouteIds.filter(
        (id) => !currentRouteIds.includes(id)
      );

      if (routesToRemove.length > 0 || routesToAdd.length > 0) {
        await tx.busStop.update({
          where: { id: existingStop.id },
          data: {
            routes: {
              ...(routesToRemove.length > 0 && {
                disconnect: routesToRemove.map((id) => ({ id })),
              }),
              ...(routesToAdd.length > 0 && {
                connect: routesToAdd.map((id) => ({ id })),
              }),
            },
          },
        });
      }
    }
  });

  await Promise.all(relationshipUpdates);

  // Step 6: Fetch updated stops with all relations
  const updatedStops = await tx.busStop.findMany({
    where: { id: { in: stopIds } },
    include: {
      name: true,
      description: true,
      icon: true,
      zone: true,
      lanes: { select: { id: true } },
      routes: { select: { id: true } },
    },
  });

  return updatedStops;
}
