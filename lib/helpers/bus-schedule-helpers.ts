"use server";

import { Prisma } from "@prisma/client";
import {
  CreateBusScheduleData,
  UpdateBusScheduleData,
} from "@/types/models/bus-schedule";

type PrismaTransaction = Prisma.TransactionClient;

export async function createBusScheduleWithBusinessLogic({
  data,
  tx,
}: {
  data: CreateBusScheduleData;
  tx: PrismaTransaction;
}) {
  await validateScheduleReferences({
    routeId: data.routeId,
    stopId: data.stopId,
    tx,
  });

  const schedule = await tx.busSchedule.create({
    data: {
      route: { connect: { id: data.routeId } },
      stop: { connect: { id: data.stopId } },
      departureTime: data.departureTime,
      dayOfWeek: data.dayOfWeek,
      specificDate: data.specificDate,
      notes: data.notes,
      isActive: data.isActive ?? true,
    },
    include: {
      route: true,
      stop: true,
    },
  });

  return schedule;
}

export async function updateBusScheduleWithBusinessLogic({
  data,
  tx,
}: {
  data: UpdateBusScheduleData;
  tx: PrismaTransaction;
}) {
  const { id, routeId, stopId, ...rest } = data;

  if (!id) {
    throw new Error("Bus schedule ID is required for update");
  }

  const existing = await tx.busSchedule.findUnique({
    where: { id },
    select: { id: true, deletedAt: true },
  });

  if (!existing || existing.deletedAt) {
    throw new Error("Bus schedule not found or has been deleted");
  }

  if (routeId || stopId) {
    await validateScheduleReferences({
      routeId: routeId ?? undefined,
      stopId: stopId ?? undefined,
      tx,
    });
  }

  const updateData: Prisma.BusScheduleUpdateInput = {
    ...rest,
  };

  if (routeId) {
    updateData.route = { connect: { id: routeId } };
  }

  if (stopId) {
    updateData.stop = { connect: { id: stopId } };
  }

  const schedule = await tx.busSchedule.update({
    where: { id },
    data: updateData,
    include: {
      route: true,
      stop: true,
    },
  });

  return schedule;
}

export async function deleteBusScheduleWithBusinessLogic({
  id,
  tx,
}: {
  id: string;
  tx: PrismaTransaction;
}) {
  if (!id) {
    throw new Error("Bus schedule ID is required for deletion");
  }

  const existing = await tx.busSchedule.findUnique({
    where: { id },
    select: { id: true, deletedAt: true },
  });

  if (!existing || existing.deletedAt) {
    throw new Error("Bus schedule not found or already deleted");
  }

  return tx.busSchedule.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

async function validateScheduleReferences({
  routeId,
  stopId,
  tx,
}: {
  routeId?: string;
  stopId?: string;
  tx: PrismaTransaction;
}) {
  if (routeId) {
    const route = await tx.busRoute.findUnique({
      where: { id: routeId },
      select: { id: true, deletedAt: true, isActive: true },
    });
    if (!route || route.deletedAt || !route.isActive) {
      throw new Error("Invalid bus route for schedule");
    }
  }

  if (stopId) {
    const stop = await tx.busStop.findUnique({
      where: { id: stopId },
      select: { id: true, deletedAt: true },
    });
    if (!stop || stop.deletedAt) {
      throw new Error("Invalid bus stop for schedule");
    }
  }
}
