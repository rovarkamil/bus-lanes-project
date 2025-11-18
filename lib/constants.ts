import { Permission } from "@prisma/client";

// Available permissions in the system
export const AVAILABLE_PERMISSIONS = Object.values(Permission);

// Re-export the Permission type from Prisma
export type { Permission };
