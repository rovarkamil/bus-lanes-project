"use server";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { createPublicModelRoutes } from "@/utils/createModelRoutes";
import {
  transportServiceSchema,
  createTransportServiceSchema,
  updateTransportServiceSchema,
  transportServiceFieldConfigs,
  CreateTransportServiceData,
  UpdateTransportServiceData,
} from "@/types/models/transport-service";
import {
  createTransportServiceWithBusinessLogic,
  updateTransportServiceWithBusinessLogic,
  deleteTransportServiceWithBusinessLogic,
} from "@/lib/helpers/transport-service-helpers";

const deleteSchema = transportServiceSchema.pick({ id: true });

type CreatePayload = CreateTransportServiceData;
type UpdatePayload = UpdateTransportServiceData;

export const { GET, POST, PUT, DELETE } = createPublicModelRoutes({
  modelName: "transportService",
  schema: transportServiceSchema,
  createSchema: createTransportServiceSchema,
  updateSchema: updateTransportServiceSchema,
  deleteSchema,
  fieldConfigs: transportServiceFieldConfigs,
  relations: {
    name: true,
    description: true,
    icon: { include: { file: true, name: true } },
    routes: true,
    lanes: true,
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
        const result = await createTransportServiceWithBusinessLogic({
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
        const result = await updateTransportServiceWithBusinessLogic({
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
        const result = await deleteTransportServiceWithBusinessLogic({
          id: data.id,
          tx,
        });
        return NextResponse.json({ success: true, data: result });
      });
    },
  },
});
