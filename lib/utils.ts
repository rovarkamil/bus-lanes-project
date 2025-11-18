import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Session } from "next-auth";
import { Permission } from "@prisma/client";
import { UserType } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hasPermission(
  session: Session | null,
  permission: Permission | Permission[]
): boolean {
  if (!session?.user) return false;

  // Super Admin has all permissions
  if (session.user.userType === UserType.SUPER_ADMIN) return true;

  const userPermissions = session.user.role?.permissions || [];

  // Handle array of permissions (any of them)
  if (Array.isArray(permission)) {
    return permission.some((p) => userPermissions.includes(p));
  }

  // Handle single permission
  return userPermissions.includes(permission);
}

export function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Format based on length
  if (cleaned.length === 11) {
    // Format as: 0750 123 4567
    return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3");
  } else if (cleaned.length === 10) {
    // Format as: 750 123 4567
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
  }

  // Return original if not matching expected formats
  return phone;
}