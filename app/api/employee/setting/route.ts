import { Permission, Setting, UserType } from "@prisma/client";
import { createPublicModelRoutes } from "@/utils/createModelRoutes";
import {
  settingSchema,
  createSettingSchema,
  updateSettingSchema,
  settingFieldConfigs,
} from "@/types/models/setting";
import { createError } from "@/lib/custom-error-handler";

export const { GET, POST, PUT, DELETE } = createPublicModelRoutes({
  modelName: "setting",
  schema: settingSchema,
  createSchema: createSettingSchema,
  updateSchema: updateSettingSchema,
  deleteSchema: settingSchema.pick({ id: true }),
  fieldConfigs: settingFieldConfigs,
  defaultSort: { field: "key", order: "asc" },
  uniqueFields: ["key"],
  hooks: {
    beforeUpdate: async ({ prisma, data, session }) => {
      const setting: Setting | null = await prisma.setting.findUnique({
        where: { id: data.id },
      });

      if (setting?.isLocked) {
        throw createError("Settings", "Setting", "SettingIsLocked", 403);
      }

      // Check for USD_PRICE permission
      if (setting?.key === "USD_PRICE") {
        const hasPermission =
          session?.user.userType === UserType.SUPER_ADMIN ||
          session?.user.role?.permissions.includes(Permission.CHANGE_USD_PRICE);
        if (!hasPermission) {
          throw createError(
            "Settings",
            "Setting",
            "NoPermissionToChangeUsdPrice",
            403
          );
        }
      }

      return data;
    },
  },
});
