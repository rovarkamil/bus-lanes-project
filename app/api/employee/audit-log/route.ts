import { Permission, RequestMethod } from "@prisma/client";
import { createEmployeeModelRoutes } from "@/utils/createModelRoutes";
import { createError } from "@/lib/custom-error-handler";
import {
  auditLogSchema,
  createAuditLogSchema,
  updateAuditLogSchema,
  deleteAuditLogSchema,
  auditLogFieldConfigs,
} from "@/types/models/audit-log";

export const { GET } = createEmployeeModelRoutes({
  modelName: "auditLog",
  schema: auditLogSchema,
  createSchema: createAuditLogSchema,
  updateSchema: updateAuditLogSchema,
  deleteSchema: deleteAuditLogSchema,
  permissions: {
    view: Permission.VIEW_AUDIT_LOGS,
  },
  fieldConfigs: auditLogFieldConfigs,
  relations: {
    user: {
      select: {
        id: true,
        name: true,
        username: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    },
  },
  defaultSort: { field: "createdAt", order: "desc" },
  uniqueFields: [],
  excludeFields: ["password", "deletedAt"],
  hooks: {
    beforeList: async ({ data }) => {
      // Validate filter parameters if any
      if (data.where?.entityType) {
        try {
          await auditLogSchema.shape.entityType.parseAsync(
            data.where.entityType
          );
        } catch {
          throw createError(
            "AuditLogs",
            "Validation",
            "InvalidEntityType",
            400
          );
        }
      }

      // Validate method filter if present
      if (data.where?.method) {
        const validMethods = Object.values(RequestMethod);
        if (!validMethods.includes(data.where.method)) {
          throw createError("AuditLogs", "Validation", "InvalidMethod", 400);
        }
      }

      // Validate status filter if present
      if (data.where?.status) {
        const status = Number(data.where.status);
        if (isNaN(status) || status < 100 || status > 599) {
          throw createError("AuditLogs", "Validation", "InvalidStatus", 400);
        }
      }
    },
  },
});
