"use server";

import { Prisma, RouteDirection, Currency } from "@prisma/client";
import {
  CreateBusRouteData,
  UpdateBusRouteData,
} from "@/types/models/bus-route";
import {
  handleLanguageCreation,
  handleLanguageUpdate,
} from "@/utils/language-handler";
import { normalizeLanguageFields } from "@/lib/helpers/language-utils";

type PrismaTransaction = Prisma.TransactionClient;

export async function createBusRouteWithBusinessLogic({
  data,
  tx,
}: {
  data: CreateBusRouteData;
  tx: PrismaTransaction;
}) {
  const languagePayload = normalizeLanguageFields(data, [
    "nameFields",
    "descriptionFields",
  ] as const);
  const { nameId, descriptionId } = await handleLanguageCreation(
    languagePayload,
    tx
  );

  const route = await tx.busRoute.create({
    data: {
      service: data.serviceId ? { connect: { id: data.serviceId } } : undefined,
      routeNumber: data.routeNumber,
      direction: data.direction,
      fare: data.fare,
      currency: data.currency,
      frequency: data.frequency,
      duration: data.duration,
      isActive: data.isActive ?? true,
      name: { connect: { id: nameId } },
      description: descriptionId
        ? { connect: { id: descriptionId } }
        : undefined,
      lanes: data.laneIds?.length
        ? { connect: data.laneIds.map((laneId) => ({ id: laneId })) }
        : undefined,
      stops: data.stopIds?.length
        ? { connect: data.stopIds.map((stopId) => ({ id: stopId })) }
        : undefined,
    },
    include: {
      name: true,
      description: true,
      service: true,
      lanes: { select: { id: true, nameId: true } },
      stops: { select: { id: true, nameId: true } },
      schedules: true,
    },
  });

  return route;
}

export async function updateBusRouteWithBusinessLogic({
  data,
  tx,
}: {
  data: UpdateBusRouteData;
  tx: PrismaTransaction;
}) {
  const {
    id,
    nameFields,
    descriptionFields,
    laneIds,
    stopIds,
    serviceId,
    ...rest
  } = data;

  if (!id) {
    throw new Error("Bus route ID is required for update");
  }

  const existing = await tx.busRoute.findUnique({
    where: { id },
    select: {
      id: true,
      deletedAt: true,
      nameId: true,
      descriptionId: true,
    },
  });

  if (!existing || existing.deletedAt) {
    throw new Error("Bus route not found or has been deleted");
  }

  if (nameFields || descriptionFields) {
    const languageUpdatePayload = normalizeLanguageFields(
      {
        id,
        model: "busRoute",
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

  const updateData: Prisma.BusRouteUpdateInput = {
    ...rest,
  };

  if (serviceId !== undefined) {
    updateData.service =
      serviceId === null || serviceId === ""
        ? { disconnect: true }
        : { connect: { id: serviceId } };
  }

  if (laneIds) {
    updateData.lanes = {
      set: [],
      ...(laneIds.length
        ? { connect: laneIds.map((laneId) => ({ id: laneId })) }
        : {}),
    };
  }

  if (stopIds) {
    updateData.stops = {
      set: [],
      ...(stopIds.length
        ? { connect: stopIds.map((stopId) => ({ id: stopId })) }
        : {}),
    };
  }

  const route = await tx.busRoute.update({
    where: { id },
    data: updateData,
    include: {
      name: true,
      description: true,
      service: true,
      lanes: { select: { id: true, nameId: true } },
      stops: { select: { id: true, nameId: true } },
      schedules: true,
    },
  });

  return route;
}

export async function deleteBusRouteWithBusinessLogic({
  id,
  tx,
}: {
  id: string;
  tx: PrismaTransaction;
}) {
  if (!id) {
    throw new Error("Bus route ID is required for deletion");
  }

  const existing = await tx.busRoute.findUnique({
    where: { id },
    select: { id: true, deletedAt: true, schedules: { select: { id: true } } },
  });

  if (!existing || existing.deletedAt) {
    throw new Error("Bus route not found or already deleted");
  }

  if (existing.schedules.length > 0) {
    throw new Error("Cannot delete bus route with active schedules");
  }

  return tx.busRoute.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

/**
 * Create multiple bus routes efficiently using createMany
 * Optimized for bulk operations from map editor
 */
export async function createBusRoutesBulkWithBusinessLogic({
  routes,
  tx,
}: {
  routes: Array<{
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
    serviceId?: string | null;
    routeNumber?: string;
    direction?: string;
    fare?: number;
    currency?: string;
    frequency?: number;
    duration?: number;
    laneIds?: string[];
    stopIds?: string[];
    isActive?: boolean;
  }>;
  tx: PrismaTransaction;
}) {
  // Step 1: Create all language records in parallel
  const languagePromises = routes.map(async (route) => {
    const nameLang = await tx.language.create({
      data: {
        en: route.nameFields.en,
        ar: route.nameFields.ar ?? null,
        ckb: route.nameFields.ckb ?? null,
      },
    });

    let descriptionId: string | null = null;
    if (route.descriptionFields) {
      const descLang = await tx.language.create({
        data: {
          en: route.descriptionFields.en ?? "",
          ar: route.descriptionFields.ar ?? null,
          ckb: route.descriptionFields.ckb ?? null,
        },
      });
      descriptionId = descLang.id;
    }

    return { nameId: nameLang.id, descriptionId };
  });

  const languageRecords = await Promise.all(languagePromises);

  // Step 2: Create all routes using createMany (optimized)
  const routesToCreate = routes.map((route, index) => ({
    nameId: languageRecords[index].nameId,
    descriptionId: languageRecords[index].descriptionId,
    serviceId: route.serviceId ?? null,
    routeNumber: route.routeNumber ?? null,
    direction:
      (route.direction as RouteDirection) ?? RouteDirection.BIDIRECTIONAL,
    fare: route.fare ?? null,
    currency: (route.currency as Currency) ?? Currency.IQD,
    frequency: route.frequency ?? null,
    duration: route.duration ?? null,
    isActive: route.isActive ?? true,
  }));

  await tx.busRoute.createMany({
    data: routesToCreate,
  });

  // Step 3: Fetch created routes (createMany doesn't return records)
  const createdRoutes = await tx.busRoute.findMany({
    where: {
      nameId: { in: languageRecords.map((r) => r.nameId) },
    },
    include: {
      name: true,
      description: true,
      service: { include: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: routes.length,
  });

  // Step 4: Handle relationships in parallel
  const relationshipPromises = createdRoutes.map(async (route, index) => {
    const routeData = routes[index];

    // Connect lanes if provided
    if (routeData.laneIds && routeData.laneIds.length > 0) {
      await tx.busRoute.update({
        where: { id: route.id },
        data: {
          lanes: {
            connect: routeData.laneIds.map((laneId) => ({ id: laneId })),
          },
        },
      });
    }

    // Connect stops if provided
    if (routeData.stopIds && routeData.stopIds.length > 0) {
      await tx.busRoute.update({
        where: { id: route.id },
        data: {
          stops: {
            connect: routeData.stopIds.map((stopId) => ({ id: stopId })),
          },
        },
      });
    }
  });

  await Promise.all(relationshipPromises);

  // Step 5: Fetch final routes with all relations
  const finalRoutes = await tx.busRoute.findMany({
    where: {
      id: { in: createdRoutes.map((r) => r.id) },
    },
    include: {
      name: true,
      description: true,
      service: { include: { name: true } },
      lanes: { select: { id: true } },
      stops: { select: { id: true } },
    },
  });

  return finalRoutes;
}

/**
 * Update multiple bus routes efficiently using updateMany where possible
 * Optimized for bulk operations from map editor
 */
export async function updateBusRoutesBulkWithBusinessLogic({
  routes,
  tx,
}: {
  routes: Array<{
    id: string;
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
    routeNumber?: string;
    direction?: string;
    fare?: number;
    currency?: string;
    frequency?: number;
    duration?: number;
    laneIds?: string[];
    stopIds?: string[];
    isActive?: boolean;
  }>;
  tx: PrismaTransaction;
}) {
  const routeIds = routes.map((r) => r.id);

  // Step 1: Fetch existing routes with relations
  const existingRoutes = await tx.busRoute.findMany({
    where: { id: { in: routeIds } },
    include: {
      name: true,
      description: true,
      lanes: { select: { id: true } },
      stops: { select: { id: true } },
    },
  });

  // Step 2: Update language records in parallel
  const languageUpdates = existingRoutes.map(async (existingRoute) => {
    const routeData = routes.find((r) => r.id === existingRoute.id);
    if (!routeData) return;

    if (routeData.nameFields && existingRoute.nameId) {
      await tx.language.update({
        where: { id: existingRoute.nameId },
        data: {
          en: routeData.nameFields.en,
          ar: routeData.nameFields.ar ?? null,
          ckb: routeData.nameFields.ckb ?? null,
        },
      });
    }

    if (routeData.descriptionFields) {
      if (existingRoute.descriptionId) {
        await tx.language.update({
          where: { id: existingRoute.descriptionId },
          data: {
            en: routeData.descriptionFields.en ?? "",
            ar: routeData.descriptionFields.ar ?? null,
            ckb: routeData.descriptionFields.ckb ?? null,
          },
        });
      } else if (routeData.descriptionFields.en) {
        const descLang = await tx.language.create({
          data: {
            en: routeData.descriptionFields.en,
            ar: routeData.descriptionFields.ar ?? null,
            ckb: routeData.descriptionFields.ckb ?? null,
          },
        });
        await tx.busRoute.update({
          where: { id: existingRoute.id },
          data: { descriptionId: descLang.id },
        });
      }
    }
  });

  await Promise.all(languageUpdates);

  // Step 3: Group routes by update values for bulk updateMany operations
  const updateGroups = new Map<
    string,
    { routeIds: string[]; data: Prisma.BusRouteUpdateInput }
  >();

  routes.forEach((routeData) => {
    // Create a key for grouping routes with same update values
    const updateKey = JSON.stringify({
      serviceId: routeData.serviceId,
      routeNumber: routeData.routeNumber,
      direction: routeData.direction,
      fare: routeData.fare,
      currency: routeData.currency,
      frequency: routeData.frequency,
      duration: routeData.duration,
      isActive: routeData.isActive,
    });

    if (!updateGroups.has(updateKey)) {
      updateGroups.set(updateKey, {
        routeIds: [],
        data: {
          ...(routeData.serviceId !== undefined && {
            serviceId: routeData.serviceId,
          }),
          ...(routeData.routeNumber !== undefined && {
            routeNumber: routeData.routeNumber,
          }),
          ...(routeData.direction !== undefined && {
            direction: routeData.direction as RouteDirection,
          }),
          ...(routeData.fare !== undefined && { fare: routeData.fare }),
          ...(routeData.currency !== undefined && {
            currency: routeData.currency as Currency,
          }),
          ...(routeData.frequency !== undefined && {
            frequency: routeData.frequency,
          }),
          ...(routeData.duration !== undefined && {
            duration: routeData.duration,
          }),
          ...(routeData.isActive !== undefined && {
            isActive: routeData.isActive,
          }),
        },
      });
    }

    updateGroups.get(updateKey)!.routeIds.push(routeData.id);
  });

  // Step 4: Execute bulk updates
  const bulkUpdates = Array.from(updateGroups.values()).map(async (group) => {
    if (group.routeIds.length > 1) {
      // Use updateMany for multiple routes with same values
      await tx.busRoute.updateMany({
        where: { id: { in: group.routeIds } },
        data: group.data as Prisma.BusRouteUpdateInput,
      });
    } else {
      // Single update
      await tx.busRoute.update({
        where: { id: group.routeIds[0] },
        data: group.data,
      });
    }
  });

  await Promise.all(bulkUpdates);

  // Step 5: Handle lane and stop connections (many-to-many)
  const relationshipUpdates = existingRoutes.map(async (existingRoute) => {
    const routeData = routes.find((r) => r.id === existingRoute.id);
    if (!routeData) return;

    // Handle lane connections
    if (routeData.laneIds !== undefined) {
      const currentLaneIds = existingRoute.lanes.map((l) => l.id);
      const newLaneIds = routeData.laneIds;

      const lanesToRemove = currentLaneIds.filter(
        (id) => !newLaneIds.includes(id)
      );
      const lanesToAdd = newLaneIds.filter(
        (id) => !currentLaneIds.includes(id)
      );

      if (lanesToRemove.length > 0 || lanesToAdd.length > 0) {
        await tx.busRoute.update({
          where: { id: existingRoute.id },
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

    // Handle stop connections
    if (routeData.stopIds !== undefined) {
      const currentStopIds = existingRoute.stops.map((s) => s.id);
      const newStopIds = routeData.stopIds;

      const stopsToRemove = currentStopIds.filter(
        (id) => !newStopIds.includes(id)
      );
      const stopsToAdd = newStopIds.filter(
        (id) => !currentStopIds.includes(id)
      );

      if (stopsToRemove.length > 0 || stopsToAdd.length > 0) {
        await tx.busRoute.update({
          where: { id: existingRoute.id },
          data: {
            stops: {
              ...(stopsToRemove.length > 0 && {
                disconnect: stopsToRemove.map((id) => ({ id })),
              }),
              ...(stopsToAdd.length > 0 && {
                connect: stopsToAdd.map((id) => ({ id })),
              }),
            },
          },
        });
      }
    }
  });

  await Promise.all(relationshipUpdates);

  // Step 6: Fetch updated routes with all relations
  const updatedRoutes = await tx.busRoute.findMany({
    where: { id: { in: routeIds } },
    include: {
      name: true,
      description: true,
      service: { include: { name: true } },
      lanes: { select: { id: true } },
      stops: { select: { id: true } },
    },
  });

  return updatedRoutes;
}
