/* eslint-disable @typescript-eslint/no-unused-vars */
import { Permission } from "@prisma/client";
import { createEmployeeModelRoutes } from "@/utils/createModelRoutes";
import {
  userSchema,
  createUserSchema,
  updateUserSchema,
  userFieldConfigs,
  CreateUserData,
  UpdateUserData,
} from "@/types/models/user";
import {
  createUserWithBusinessLogic,
  updateUserWithBusinessLogic,
  deleteUserWithBusinessLogic,
} from "@/lib/helpers/user-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const { GET, POST, PUT, DELETE } = createEmployeeModelRoutes({
  modelName: "user",
  schema: userSchema,
  createSchema: createUserSchema,
  updateSchema: updateUserSchema,
  deleteSchema: userSchema.pick({ id: true }),
  permissions: {
    view: Permission.VIEW_USERS,
    create: Permission.CREATE_USER,
    update: Permission.UPDATE_USER,
    delete: Permission.DELETE_USER,
  },
  fieldConfigs: userFieldConfigs,
  relations: {
    role: true, // Simplified relation to avoid potential circular references
    // orders: true,
  },
  defaultSort: { field: "createdAt", order: "desc" },
  uniqueFields: ["username", "email", "phone"],
  excludeFields: ["password"],
  customHandlers: {
    create: async (req, context) => {
      const data = context.body! as CreateUserData;
      const session = await getServerSession(authOptions);

      // Validation
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      return await prisma.$transaction(
        async (tx) => {
          const result = await createUserWithBusinessLogic({
            data: { ...data },
            tx,
          });
          return NextResponse.json({ success: true, data: result });
        },
        { timeout: 30000 }
      );
    },
    update: async (req, context) => {
      const data = context.body! as UpdateUserData;
      const session = await getServerSession(authOptions);

      // Validation
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      return await prisma.$transaction(
        async (tx) => {
          const result = await updateUserWithBusinessLogic({
            data,
            tx,
          });
          return NextResponse.json({ success: true, data: result });
        },
        { timeout: 30000 }
      );
    },
    delete: async (req, context) => {
      const data = context.body!;
      const session = await getServerSession(authOptions);

      // Validation
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      return await prisma.$transaction(
        async (tx) => {
          const result = await deleteUserWithBusinessLogic({
            id: data.id,
            tx,
          });
          return NextResponse.json({ success: true, data: result });
        },
        { timeout: 30000 }
      );
    },
  },
});
