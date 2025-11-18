import { Permission } from "@prisma/client";
import { createEmployeeModelRoutes } from "@/utils/createModelRoutes";

import {
  roleSchema,
  createRoleSchema,
  updateRoleSchema,
  deleteRoleSchema,
  roleFieldConfigs,
  CreateRoleData,
  UpdateRoleData,
} from "@/types/models/role";
import {
  createRoleWithBusinessLogic,
  updateRoleWithBusinessLogic,
  deleteRoleWithBusinessLogic,
} from "@/lib/helpers/role-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const { GET, POST, PUT, DELETE } = createEmployeeModelRoutes({
  modelName: "role",
  schema: roleSchema,
  createSchema: createRoleSchema,
  updateSchema: updateRoleSchema,
  deleteSchema: deleteRoleSchema,
  permissions: {
    view: Permission.VIEW_ROLES,
    create: Permission.CREATE_ROLE,
    update: Permission.UPDATE_ROLE,
    delete: Permission.DELETE_ROLE,
  },
  fieldConfigs: roleFieldConfigs,
  relations: {
    users: {
      select: {
        id: true,
        name: true,
        username: true,
        createdAt: true,
        deletedAt: true,
      },
    },
  },
  defaultSort: { field: "name", order: "asc" },
  uniqueFields: ["name"],
  excludeFields: [],
  customHandlers: {
    create: async (req, context) => {
      const requestData = context.body! as CreateRoleData & {
        permissions?: Permission[];
      };

      return await prisma.$transaction(
        async (tx) => {
          const role = await createRoleWithBusinessLogic({
            data: { ...requestData },
            permissions: requestData.permissions,
            tx,
          });

          return NextResponse.json({ success: true, data: role });
        },
        {
          timeout: 30000, // 30 seconds
        }
      );
    },
    update: async (req, context) => {
      const requestData = context.body! as UpdateRoleData & {
        permissions?: Permission[];
      };

      return await prisma.$transaction(
        async (tx) => {
          // Extract permissions from request data
          const { permissions, ...roleData } = requestData;

          const updatedRole = await updateRoleWithBusinessLogic({
            data: roleData,
            permissions,
            tx,
          });

          return NextResponse.json({ success: true, data: updatedRole });
        },
        {
          timeout: 30000, // 30 seconds
        }
      );
    },
    delete: async (req, context) => {
      const data = context.body!;
      return await prisma.$transaction(
        async (tx) => {
          const deletedRole = await deleteRoleWithBusinessLogic({
            id: data.id,
            tx,
          });

          return NextResponse.json({ success: true, data: deletedRole });
        },
        {
          timeout: 30000, // 30 seconds
        }
      );
    },
  },
});
