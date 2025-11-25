"use server";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { createPublicModelRoutes } from "@/utils/createModelRoutes";
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

export const { GET, POST, PUT, DELETE } = createPublicModelRoutes({
  modelName: "busSchedule",
  schema: busScheduleSchema,
  createSchema: createBusScheduleSchema,
  updateSchema: updateBusScheduleSchema,
  deleteSchema,
  fieldConfigs: busScheduleFieldConfigs,
  relations: {
    route: {
      include: {
        name: true,
      },
    },
    stop: {
      include: {
        name: true,
      },
    },
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
