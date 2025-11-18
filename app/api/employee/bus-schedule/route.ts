"use server";

import { Permission } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { createEmployeeModelRoutes } from "@/utils/createModelRoutes";
import {
  busScheduleSchema,
  createBusScheduleSchema,
  updateBusScheduleSchema,
  busScheduleFieldConfigs,
  CreateBusScheduleData,
  UpdateBusScheduleData,
} from "@/types/models/bus-schedule";
import {
  createBusScheduleWithBusinessLogic,
  updateBusScheduleWithBusinessLogic,
  deleteBusScheduleWithBusinessLogic,
} from "@/lib/helpers/bus-schedule-helpers";

const deleteSchema = busScheduleSchema.pick({ id: true });

type CreatePayload = CreateBusScheduleData;
type UpdatePayload = UpdateBusScheduleData;

export const { GET, POST, PUT, DELETE } = createEmployeeModelRoutes({
  modelName: "busSchedule",
  schema: busScheduleSchema,
  createSchema: createBusScheduleSchema,
  updateSchema: updateBusScheduleSchema,
  deleteSchema,
  permissions: {
    view: Permission.VIEW_BUS_SCHEDULES,
    create: Permission.CREATE_BUS_SCHEDULE,
    update: Permission.UPDATE_BUS_SCHEDULE,
    delete: Permission.DELETE_BUS_SCHEDULE,
  },
  fieldConfigs: busScheduleFieldConfigs,
  relations: {
    route: true,
    stop: true,
  },
  defaultSort: { field: "departureTime", order: "asc" },
  customHandlers: {
    create: async (_req, context) => {
      const data = context.body! as CreatePayload;
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      return prisma.$transaction(async (tx) => {
        const result = await createBusScheduleWithBusinessLogic({
          data,
          tx,
        });
        return NextResponse.json({ success: true, data: result });
      });
    },
    update: async (_req, context) => {
      const data = context.body! as UpdatePayload;
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      return prisma.$transaction(async (tx) => {
        const result = await updateBusScheduleWithBusinessLogic({
          data,
          tx,
        });
        return NextResponse.json({ success: true, data: result });
      });
    },
    delete: async (_req, context) => {
      const data = context.body!;
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      return prisma.$transaction(async (tx) => {
        const result = await deleteBusScheduleWithBusinessLogic({
          id: data.id,
          tx,
        });
        return NextResponse.json({ success: true, data: result });
      });
    },
  },
});


