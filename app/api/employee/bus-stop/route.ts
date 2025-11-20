"use server";

import { Permission } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { createEmployeeModelRoutes } from "@/utils/createModelRoutes";
import {
  busStopSchema,
  createBusStopSchema,
  updateBusStopSchema,
  busStopFieldConfigs,
  CreateBusStopData,
  UpdateBusStopData,
} from "@/types/models/bus-stop";
import {
  createBusStopWithBusinessLogic,
  updateBusStopWithBusinessLogic,
  deleteBusStopWithBusinessLogic,
} from "@/lib/helpers/bus-stop-helpers";
import { UploadedFileInput } from "@/lib/helpers/file-utils";

const deleteSchema = busStopSchema.pick({ id: true });

type CreatePayload = CreateBusStopData & {
  images?: UploadedFileInput[];
};

type UpdatePayload = UpdateBusStopData & {
  images?: UploadedFileInput[];
};

export const { GET, POST, PUT, DELETE } = createEmployeeModelRoutes({
  modelName: "busStop",
  schema: busStopSchema,
  createSchema: createBusStopSchema,
  updateSchema: updateBusStopSchema,
  deleteSchema,
  permissions: {
    view: Permission.VIEW_BUS_STOPS,
    create: Permission.CREATE_BUS_STOP,
    update: Permission.UPDATE_BUS_STOP,
    delete: Permission.DELETE_BUS_STOP,
  },
  fieldConfigs: busStopFieldConfigs,
  relations: {
    name: true,
    description: true,
    icon: true,
    zone: {
      include: {
        name: true,
      },
    },
    images: true,
    lanes: {
      include: {
        name: true,
      },
    },
    routes: {
      include: {
        name: true,
      },
    },
    schedules: true,
  },
  defaultSort: { field: "createdAt", order: "desc" },
  customHandlers: {
    create: async (_req, context) => {
      const data = context.body! as CreatePayload;
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      return prisma.$transaction(async (tx) => {
        const result = await createBusStopWithBusinessLogic({
          data,
          tx,
          uploadedById: session.user.id,
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
        const result = await updateBusStopWithBusinessLogic({
          data,
          tx,
          uploadedById: session.user.id,
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
        const result = await deleteBusStopWithBusinessLogic({
          id: data.id,
          tx,
        });
        return NextResponse.json({ success: true, data: result });
      });
    },
  },
});


