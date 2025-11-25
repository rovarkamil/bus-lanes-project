"use server";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { createPublicModelRoutes } from "@/utils/createModelRoutes";
import {
  busRouteSchema,
  createBusRouteSchema,
  updateBusRouteSchema,
  busRouteFieldConfigs,
  CreateBusRouteData,
  UpdateBusRouteData,
} from "@/types/models/bus-route";
import {
  createBusRouteWithBusinessLogic,
  updateBusRouteWithBusinessLogic,
  deleteBusRouteWithBusinessLogic,
} from "@/lib/helpers/bus-route-helpers";

const deleteSchema = busRouteSchema.pick({ id: true });

type CreatePayload = CreateBusRouteData;
type UpdatePayload = UpdateBusRouteData;

export const { GET, POST, PUT, DELETE } = createPublicModelRoutes({
  modelName: "busRoute",
  schema: busRouteSchema,
  createSchema: createBusRouteSchema,
  updateSchema: updateBusRouteSchema,
  deleteSchema,
  fieldConfigs: busRouteFieldConfigs,
  relations: {
    name: true,
    description: true,
    service: true,
    lanes: {
      include: {
        name: true,
      },
    },
    stops: {
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
        const result = await createBusRouteWithBusinessLogic({
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
        const result = await updateBusRouteWithBusinessLogic({
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
        const result = await deleteBusRouteWithBusinessLogic({
          id: data.id,
          tx,
        });
        return NextResponse.json({ success: true, data: result });
      });
    },
  },
});
