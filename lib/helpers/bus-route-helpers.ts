"use server";

import { Prisma } from "@prisma/client";
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
  const languagePayload = normalizeLanguageFields(
    data,
    ["nameFields", "descriptionFields"] as const
  );
  const { nameId, descriptionId } = await handleLanguageCreation(
    languagePayload,
    tx
  );

  const route = await tx.busRoute.create({
    data: {
      service: data.serviceId
        ? { connect: { id: data.serviceId } }
        : undefined,
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
        ...(existing.descriptionId ? { descriptionId: existing.descriptionId } : {}),
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


