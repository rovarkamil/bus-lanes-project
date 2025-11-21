"use server";

import { Permission } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { createEmployeeModelRoutes } from "@/utils/createModelRoutes";
import {
  zoneSchema,
  createZoneSchema,
  updateZoneSchema,
  zoneFieldConfigs,
  CreateZoneData,
  UpdateZoneData,
} from "@/types/models/zone";
import {
  createZoneWithBusinessLogic,
  updateZoneWithBusinessLogic,
  deleteZoneWithBusinessLogic,
} from "@/lib/helpers/zone-helpers";

const deleteSchema = zoneSchema.pick({ id: true });

type CreatePayload = CreateZoneData;
type UpdatePayload = UpdateZoneData;

export const { GET, POST, PUT, DELETE } = createEmployeeModelRoutes({
  modelName: "zone",
  schema: zoneSchema,
  createSchema: createZoneSchema,
  updateSchema: updateZoneSchema,
  deleteSchema,
  permissions: {
    view: Permission.VIEW_ZONES,
    create: Permission.CREATE_ZONE,
    update: Permission.UPDATE_ZONE,
    delete: Permission.DELETE_ZONE,
  },
  fieldConfigs: zoneFieldConfigs,
  relations: {
    name: true,
    description: true,
    stops: {
      include: {
        name: true,
      },
    },
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
        const result = await createZoneWithBusinessLogic({
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
        const result = await updateZoneWithBusinessLogic({
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
        const result = await deleteZoneWithBusinessLogic({
          id: data.id,
          tx,
        });
        return NextResponse.json({ success: true, data: result });
      });
    },
  },
});
