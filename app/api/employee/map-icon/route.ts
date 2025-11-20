"use server";

import { Permission } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { createEmployeeModelRoutes } from "@/utils/createModelRoutes";
import {
  mapIconSchema,
  createMapIconSchema,
  updateMapIconSchema,
  mapIconFieldConfigs,
  CreateMapIconData,
  UpdateMapIconData,
} from "@/types/models/map-icon";
import {
  createMapIconWithBusinessLogic,
  updateMapIconWithBusinessLogic,
  deleteMapIconWithBusinessLogic,
} from "@/lib/helpers/map-icon-helpers";
import { UploadedFileInput } from "@/lib/helpers/file-utils";

const deleteSchema = mapIconSchema.pick({ id: true });

type CreatePayload = CreateMapIconData & { file?: UploadedFileInput };
type UpdatePayload = UpdateMapIconData & { file?: UploadedFileInput };

export const { GET, POST, PUT, DELETE } = createEmployeeModelRoutes({
  modelName: "mapIcon",
  schema: mapIconSchema,
  createSchema: createMapIconSchema,
  updateSchema: updateMapIconSchema,
  deleteSchema,
  permissions: {
    view: Permission.VIEW_MAP_ICONS,
    create: Permission.CREATE_MAP_ICON,
    update: Permission.UPDATE_MAP_ICON,
    delete: Permission.DELETE_MAP_ICON,
  },
  fieldConfigs: mapIconFieldConfigs,
  relations: {
    name: true,
    description: true,
    file: true,
    transportServices: true,
    busStops: true,
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
        const result = await createMapIconWithBusinessLogic({
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
        const result = await updateMapIconWithBusinessLogic({
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
        const result = await deleteMapIconWithBusinessLogic({
          id: data.id,
          tx,
        });
        return NextResponse.json({ success: true, data: result });
      });
    },
  },
});
