"use server";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { createPublicModelRoutes } from "@/utils/createModelRoutes";
import {
  busLaneSchema,
  createBusLaneSchema,
  updateBusLaneSchema,
  busLaneFieldConfigs,
  CreateBusLaneData,
  UpdateBusLaneData,
} from "@/types/models/bus-lane";
import {
  createBusLaneWithBusinessLogic,
  updateBusLaneWithBusinessLogic,
  deleteBusLaneWithBusinessLogic,
} from "@/lib/helpers/bus-lane-helpers";
import { UploadedFileInput } from "@/lib/helpers/file-utils";

const deleteSchema = busLaneSchema.pick({ id: true });

type CreatePayload = CreateBusLaneData & {
  images?: UploadedFileInput[];
};

type UpdatePayload = UpdateBusLaneData & {
  images?: UploadedFileInput[];
};

export const { GET, POST, PUT, DELETE } = createPublicModelRoutes({
  modelName: "busLane",
  schema: busLaneSchema,
  createSchema: createBusLaneSchema,
  updateSchema: updateBusLaneSchema,
  deleteSchema,
  fieldConfigs: busLaneFieldConfigs,
  relations: {
    name: true,
    description: true,
    service: {
      include: {
        name: true,
        icon: {
          include: {
            file: true,
          },
        },
      },
    },
    images: true,
    stops: {
      include: {
        name: true,
      },
    },
    routes: {
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
        const result = await createBusLaneWithBusinessLogic({
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
        const result = await updateBusLaneWithBusinessLogic({
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
        const result = await deleteBusLaneWithBusinessLogic({
          id: data.id,
          tx,
        });
        return NextResponse.json({ success: true, data: result });
      });
    },
  },
});
