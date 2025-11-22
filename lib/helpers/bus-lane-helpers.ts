"use server";

import { Prisma } from "@prisma/client";
import {
  CreateBusLaneData,
  LaneDraftStopInput,
  UpdateBusLaneData,
} from "@/types/models/bus-lane";
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
import { createBusStopWithBusinessLogic } from "@/lib/helpers/bus-stop-helpers";
import { CoordinateTuple } from "@/types/map";

type PrismaTransaction = Prisma.TransactionClient;

type BusLaneCreateData = CreateBusLaneData & {
  images?: UploadedFileInput[];
};

type BusLaneUpdateData = UpdateBusLaneData & {
  images?: UploadedFileInput[];
};

type MinimalLaneStop = { id: string; nameId?: string | null };

async function createDraftStopsForLane({
  draftStops,
  laneId,
  tx,
  uploadedById,
}: {
  draftStops?: LaneDraftStopInput[];
  laneId: string;
  tx: PrismaTransaction;
  uploadedById?: string | null;
}): Promise<MinimalLaneStop[]> {
  if (!draftStops?.length) {
    return [];
  }

  const createdStops = await Promise.all(
    draftStops.map((stop, index) =>
      createBusStopWithBusinessLogic({
        data: {
          nameFields: {
            en: stop.name ?? `Lane stop ${index + 1}`,
            ar: null,
            ckb: null,
          },
          descriptionFields: undefined,
          latitude: stop.latitude,
          longitude: stop.longitude,
          laneIds: [laneId],
          routeIds: [],
          isActive: true,
          hasShelter: false,
          hasBench: false,
          hasLighting: false,
          isAccessible: false,
          hasRealTimeInfo: false,
        },
        tx,
        uploadedById,
      })
    )
  );

  return createdStops.map((stop) => ({
    id: stop.id,
    nameId: (stop as { nameId?: string | null }).nameId ?? null,
  }));
}

export async function createBusLaneWithBusinessLogic({
  data,
  tx,
  uploadedById,
}: {
  data: BusLaneCreateData;
  tx: PrismaTransaction;
  uploadedById?: string | null;
}) {
  const { draftStops, stopIds, routeIds, ...laneData } = data;

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

  const lane = await tx.busLane.create({
    data: {
      path: laneData.path as Prisma.InputJsonValue,
      color: laneData.color,
      weight: laneData.weight,
      opacity: laneData.opacity,
      isActive: laneData.isActive ?? true,
      name: { connect: { id: nameId } },
      description: descriptionId
        ? { connect: { id: descriptionId } }
        : undefined,
      service: laneData.serviceId
        ? { connect: { id: laneData.serviceId } }
        : undefined,
      images: imageConnections ? { connect: imageConnections } : undefined,
      stops: stopIds?.length
        ? { connect: stopIds.map((stopId) => ({ id: stopId })) }
        : undefined,
      routes: routeIds?.length
        ? { connect: routeIds.map((routeId) => ({ id: routeId })) }
        : undefined,
    },
    include: {
      name: true,
      description: true,
      service: true,
      images: true,
      stops: { select: { id: true, nameId: true } },
      routes: { select: { id: true, nameId: true } },
    },
  });

  const createdStops = await createDraftStopsForLane({
    draftStops,
    laneId: lane.id,
    tx,
    uploadedById,
  });

  if (createdStops.length) {
    return {
      ...lane,
      stops: [...lane.stops, ...createdStops],
    };
  }

  return lane;
}

export async function updateBusLaneWithBusinessLogic({
  data,
  tx,
  uploadedById,
}: {
  data: BusLaneUpdateData;
  tx: PrismaTransaction;
  uploadedById?: string | null;
}) {
  const {
    id,
    nameFields,
    descriptionFields,
    images,
    stopIds,
    routeIds,
    serviceId,
    draftStops,
    ...rest
  } = data;

  if (!id) {
    throw new Error("Bus lane ID is required for update");
  }

  const existing = await tx.busLane.findUnique({
    where: { id },
    select: {
      id: true,
      deletedAt: true,
      nameId: true,
      descriptionId: true,
    },
  });

  if (!existing || existing.deletedAt) {
    throw new Error("Bus lane not found or has been deleted");
  }

  if (nameFields || descriptionFields) {
    const languageUpdatePayload = normalizeLanguageFields(
      {
        id,
        model: "busLane",
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

  const updateData: Prisma.BusLaneUpdateInput = {
    ...rest,
  };

  if (serviceId !== undefined) {
    updateData.service =
      serviceId === null || serviceId === ""
        ? { disconnect: true }
        : { connect: { id: serviceId } };
  }

  if (imagesUpdate) {
    updateData.images = imagesUpdate;
  }

  if (stopIds) {
    updateData.stops = {
      set: [],
      ...(stopIds.length
        ? { connect: stopIds.map((stopId) => ({ id: stopId })) }
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

  const lane = await tx.busLane.update({
    where: { id },
    data: updateData,
    include: {
      name: true,
      description: true,
      service: true,
      images: true,
      stops: { select: { id: true, nameId: true } },
      routes: { select: { id: true, nameId: true } },
    },
  });

  const createdStops = await createDraftStopsForLane({
    draftStops,
    laneId: id,
    tx,
    uploadedById,
  });

  if (createdStops.length) {
    return {
      ...lane,
      stops: [...lane.stops, ...createdStops],
    };
  }

  return lane;
}

export async function deleteBusLaneWithBusinessLogic({
  id,
  tx,
}: {
  id: string;
  tx: PrismaTransaction;
}) {
  if (!id) {
    throw new Error("Bus lane ID is required for deletion");
  }

  const existing = await tx.busLane.findUnique({
    where: { id },
    select: { id: true, deletedAt: true },
  });

  if (!existing || existing.deletedAt) {
    throw new Error("Bus lane not found or already deleted");
  }

  return tx.busLane.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

/**
 * Create multiple bus lanes efficiently using createMany
 * Optimized for bulk operations from map editor
 */
export async function createBusLanesBulkWithBusinessLogic({
  lanes,
  tx,
}: {
  lanes: Array<{
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
    color?: string;
    weight?: number;
    opacity?: number;
    serviceId?: string | null;
    path: CoordinateTuple[];
    draftStops?: Array<{
      latitude: number;
      longitude: number;
      name?: string;
    }>;
    routeIds?: string[];
    isActive?: boolean;
  }>;
  tx: PrismaTransaction;
  uploadedById?: string | null;
}) {
  // Step 1: Create all language records in parallel
  const languagePromises = lanes.map(async (lane) => {
    const nameLang = await tx.language.create({
      data: {
        en: lane.nameFields.en,
        ar: lane.nameFields.ar ?? null,
        ckb: lane.nameFields.ckb ?? null,
      },
    });

    let descriptionId: string | null = null;
    if (lane.descriptionFields) {
      const descLang = await tx.language.create({
        data: {
          en: lane.descriptionFields.en ?? "",
          ar: lane.descriptionFields.ar ?? null,
          ckb: lane.descriptionFields.ckb ?? null,
        },
      });
      descriptionId = descLang.id;
    }

    return { nameId: nameLang.id, descriptionId };
  });

  const languageRecords = await Promise.all(languagePromises);

  // Step 2: Create all lanes using createMany (optimized)
  const lanesToCreate = lanes.map((lane, index) => ({
    nameId: languageRecords[index].nameId,
    descriptionId: languageRecords[index].descriptionId,
    color: lane.color ?? "#0066CC",
    weight: lane.weight ?? 5,
    opacity: lane.opacity ?? 0.8,
    serviceId: lane.serviceId ?? null,
    path: lane.path as Prisma.InputJsonValue,
    isActive: lane.isActive ?? true,
  }));

  await tx.busLane.createMany({
    data: lanesToCreate,
  });

  // Step 3: Fetch created lanes (createMany doesn't return records)
  const createdLanes = await tx.busLane.findMany({
    where: {
      nameId: { in: languageRecords.map((r) => r.nameId) },
    },
    include: {
      name: true,
      description: true,
      service: { include: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: lanes.length,
  });

  // Step 4: Handle relationships in parallel
  const relationshipPromises = createdLanes.map(async (lane, index) => {
    const laneData = lanes[index];

    // Connect routes if provided
    if (laneData.routeIds && laneData.routeIds.length > 0) {
      await tx.busLane.update({
        where: { id: lane.id },
        data: {
          routes: {
            connect: laneData.routeIds.map((routeId) => ({ id: routeId })),
          },
        },
      });
    }

    // Handle draft stops
    if (laneData.draftStops && laneData.draftStops.length > 0) {
      // Create stop language records
      const stopNameLangs = await Promise.all(
        laneData.draftStops.map((stop) =>
          tx.language.create({
            data: {
              en: stop.name ?? `Stop ${Date.now()}-${Math.random()}`,
              ar: null,
              ckb: null,
            },
          })
        )
      );

      // Create stops using createMany
      const stopsToCreate = laneData.draftStops.map((stop, idx) => ({
        latitude: stop.latitude,
        longitude: stop.longitude,
        nameId: stopNameLangs[idx].id,
        descriptionId: null,
        hasShelter: false,
        hasBench: false,
        hasLighting: false,
        isAccessible: false,
        hasRealTimeInfo: false,
      }));

      await tx.busStop.createMany({
        data: stopsToCreate,
      });

      // Fetch created stops
      const createdStops = await tx.busStop.findMany({
        where: {
          nameId: { in: stopNameLangs.map((lang) => lang.id) },
        },
        orderBy: { createdAt: "desc" },
        take: laneData.draftStops.length,
      });

      // Connect stops to lane
      await tx.busLane.update({
        where: { id: lane.id },
        data: {
          stops: {
            connect: createdStops.map((stop) => ({ id: stop.id })),
          },
        },
      });
    }
  });

  await Promise.all(relationshipPromises);

  // Step 5: Fetch final lanes with all relations
  const finalLanes = await tx.busLane.findMany({
    where: {
      id: { in: createdLanes.map((l) => l.id) },
    },
    include: {
      name: true,
      description: true,
      service: { include: { name: true } },
      routes: { select: { id: true } },
      stops: { select: { id: true } },
    },
  });

  return finalLanes;
}

/**
 * Update multiple bus lanes efficiently using updateMany where possible
 * Optimized for bulk operations from map editor
 */
export async function updateBusLanesBulkWithBusinessLogic({
  lanes,
  tx,
}: {
  lanes: Array<{
    id: string;
    path?: CoordinateTuple[];
    color?: string;
    weight?: number;
    opacity?: number;
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
    serviceId?: string | null;
    routeIds?: string[];
    isActive?: boolean;
  }>;
  tx: PrismaTransaction;
  uploadedById?: string | null;
}) {
  const laneIds = lanes.map((l) => l.id);

  // Step 1: Fetch existing lanes with relations
  const existingLanes = await tx.busLane.findMany({
    where: { id: { in: laneIds } },
    include: {
      name: true,
      description: true,
      routes: { select: { id: true } },
    },
  });

  // Step 2: Update language records in parallel
  const languageUpdates = existingLanes.map(async (existingLane) => {
    const laneData = lanes.find((l) => l.id === existingLane.id);
    if (!laneData) return;

    if (laneData.nameFields && existingLane.nameId) {
      await tx.language.update({
        where: { id: existingLane.nameId },
        data: {
          en: laneData.nameFields.en,
          ar: laneData.nameFields.ar ?? null,
          ckb: laneData.nameFields.ckb ?? null,
        },
      });
    }

    if (laneData.descriptionFields) {
      if (existingLane.descriptionId) {
        await tx.language.update({
          where: { id: existingLane.descriptionId },
          data: {
            en: laneData.descriptionFields.en ?? "",
            ar: laneData.descriptionFields.ar ?? null,
            ckb: laneData.descriptionFields.ckb ?? null,
          },
        });
      } else if (laneData.descriptionFields.en) {
        const descLang = await tx.language.create({
          data: {
            en: laneData.descriptionFields.en,
            ar: laneData.descriptionFields.ar ?? null,
            ckb: laneData.descriptionFields.ckb ?? null,
          },
        });
        await tx.busLane.update({
          where: { id: existingLane.id },
          data: { descriptionId: descLang.id },
        });
      }
    }
  });

  await Promise.all(languageUpdates);

  // Step 3: Group lanes by update values for bulk updateMany operations
  const updateGroups = new Map<
    string,
    { laneIds: string[]; data: Prisma.BusLaneUpdateInput }
  >();

  lanes.forEach((laneData) => {
    // Create a key for grouping lanes with same update values
    const updateKey = JSON.stringify({
      color: laneData.color,
      weight: laneData.weight,
      opacity: laneData.opacity,
      serviceId: laneData.serviceId,
      isActive: laneData.isActive,
    });

    if (!updateGroups.has(updateKey)) {
      updateGroups.set(updateKey, {
        laneIds: [],
        data: {
          ...(laneData.color !== undefined && { color: laneData.color }),
          ...(laneData.weight !== undefined && { weight: laneData.weight }),
          ...(laneData.opacity !== undefined && { opacity: laneData.opacity }),
          ...(laneData.serviceId !== undefined && {
            serviceId: laneData.serviceId,
          }),
          ...(laneData.isActive !== undefined && {
            isActive: laneData.isActive,
          }),
        },
      });
    }

    updateGroups.get(updateKey)!.laneIds.push(laneData.id);
  });

  // Step 4: Execute bulk updates
  const bulkUpdates = Array.from(updateGroups.values()).map(async (group) => {
    if (group.laneIds.length > 1) {
      // Use updateMany for multiple lanes with same values
      await tx.busLane.updateMany({
        where: { id: { in: group.laneIds } },
        data: group.data as Prisma.BusLaneUpdateInput,
      });
    } else {
      // Single update
      await tx.busLane.update({
        where: { id: group.laneIds[0] },
        data: group.data,
      });
    }
  });

  await Promise.all(bulkUpdates);

  // Step 5: Update paths individually (since they're unique JSON per lane)
  const pathUpdates = lanes
    .filter((l) => l.path)
    .map((laneData) =>
      tx.busLane.update({
        where: { id: laneData.id },
        data: {
          path: laneData.path as Prisma.InputJsonValue,
        },
      })
    );

  await Promise.all(pathUpdates);

  // Step 6: Handle route connections (many-to-many)
  const routeUpdates = existingLanes.map(async (existingLane) => {
    const laneData = lanes.find((l) => l.id === existingLane.id);
    if (!laneData || laneData.routeIds === undefined) return;

    const currentRouteIds = existingLane.routes.map((r) => r.id);
    const newRouteIds = laneData.routeIds;

    const routesToRemove = currentRouteIds.filter(
      (id) => !newRouteIds.includes(id)
    );
    const routesToAdd = newRouteIds.filter(
      (id) => !currentRouteIds.includes(id)
    );

    if (routesToRemove.length > 0 || routesToAdd.length > 0) {
      await tx.busLane.update({
        where: { id: existingLane.id },
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
  });

  await Promise.all(routeUpdates);

  // Step 7: Fetch updated lanes with all relations
  const updatedLanes = await tx.busLane.findMany({
    where: { id: { in: laneIds } },
    include: {
      name: true,
      description: true,
      service: { include: { name: true } },
      routes: { select: { id: true } },
    },
  });

  return updatedLanes;
}
