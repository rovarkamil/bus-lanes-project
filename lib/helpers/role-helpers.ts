import { Prisma, Permission } from "@prisma/client";
import { CreateRoleData, UpdateRoleData } from "@/types/models/role";

/**
 * Creates a role with business logic and tenant isolation
 */
export async function createRoleWithBusinessLogic({
  data,
  permissions,
  tx,
}: {
  data: CreateRoleData & {
  };
  permissions?: Permission[];
  tx: Prisma.TransactionClient;
}) {
  // Basic validation
  if (!data.name) {
    throw new Error("Name is required");
  }

  // Check if role name already exists
  const existingRole = await tx.role.findFirst({
    where: {
      name: data.name,
      deletedAt: null,
    },
  });

  if (existingRole) {
    throw new Error("Role with this name already exists");
  }

  // Validate permissions array
  if (permissions && Array.isArray(permissions)) {
    // Check for duplicate permissions
    const uniquePermissions = Array.from(new Set(permissions));
    if (uniquePermissions.length !== permissions.length) {
      throw new Error("Duplicate permissions are not allowed");
    }
  }

  // Create the role
  const role = await tx.role.create({
    data: {
      name: data.name,
      kurdishName: data.kurdishName,
      arabicName: data.arabicName,
      permissions: permissions || [],
    },
    include: {
      users: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          username: true,
          createdAt: true,
          deletedAt: true,
        },
      },
    },
  });

  return role;
}

/**
 * Updates a role with business logic and tenant isolation
 */
export async function updateRoleWithBusinessLogic({
  data,
  permissions,
  tx,
}: {
  data: UpdateRoleData;
  permissions?: Permission[];
  tx: Prisma.TransactionClient;
}) {
  const { id, ...updateData } = data;

  if (!id) {
    throw new Error("Role ID is required for update");
  }

  // Get existing role for validation
  const existingRole = await tx.role.findUnique({
    where: { id },
    include: {
      users: { where: { deletedAt: null } },
    },
  });

  if (!existingRole || existingRole.deletedAt) {
    throw new Error("Role not found or has been deleted");
  }

  // If name is being updated, check for duplicates
  if (updateData.name && updateData.name !== existingRole.name) {
    const nameExists = await tx.role.findFirst({
      where: {
        name: updateData.name,
        id: { not: id },
        deletedAt: null,
      },
    });

    if (nameExists) {
      throw new Error("Role with this name already exists");
    }
  }

  // Validate permissions array if being updated
  if (permissions && Array.isArray(permissions)) {
    // Check for duplicate permissions
    const uniquePermissions = Array.from(new Set(permissions));
    if (uniquePermissions.length !== permissions.length) {
      throw new Error("Duplicate permissions are not allowed");
    }
  }

  // Check if role is a system role that shouldn't be modified
  if (existingRole.name === "SUPER_ADMIN" || existingRole.name === "ADMIN") {
    throw new Error("System roles cannot be modified");
  }

  // Extract only the fields that can be updated directly
  const { name, kurdishName, arabicName } = updateData;

  // Update the role
  const role = await tx.role.update({
    where: { id },
    data: {
      name,
      kurdishName,
      arabicName,
      permissions:
        permissions !== undefined ? permissions : existingRole.permissions,
    },
    include: {
      users: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          username: true,
          createdAt: true,
          deletedAt: true,
        },
      },
    },
  });

  return role;
}

/**
 * Soft deletes a role with business logic
 */
export async function deleteRoleWithBusinessLogic({
  id,
  tx,
}: {
  id: string;
  tx: Prisma.TransactionClient;
}) {
  if (!id) {
    throw new Error("Role ID is required for deletion");
  }

  // Get the role to check it exists and validate business rules
  const role = await tx.role.findUnique({
    where: { id },
    include: {
      users: { where: { deletedAt: null } },
    },
  });

  if (!role || role.deletedAt) {
    throw new Error("Role not found or already deleted");
  }

  // Check if role is a system role that shouldn't be deleted
  if (role.name === "SUPER_ADMIN" || role.name === "ADMIN") {
    throw new Error("System roles cannot be deleted");
  }

  // Check if role has active users
  if (role.users.length > 0) {
    throw new Error(
      "Cannot delete role with active users. Please reassign users to another role first."
    );
  }

  // Soft delete the role
  const deletedRole = await tx.role.update({
    where: { id },
    data: { deletedAt: new Date() },
    include: {
      users: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          username: true,
          createdAt: true,
          deletedAt: true,
        },
      },
    },
  });

  return deletedRole;
}

/**
 * Gets role statistics for a tenant
 */
export async function getRoleStatistics({
  tx,
}: {
  tx: Prisma.TransactionClient;
}) {
  const [roleCount, usersWithRoles] = await Promise.all([
    tx.role.count({
      where: {
        deletedAt: null,
      },
    }),
    tx.role.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            users: {
              where: { deletedAt: null },
            },
          },
        },
      },
    }),
  ]);

  const totalUsers = usersWithRoles.reduce(
    (sum, role) => sum + role._count.users,
    0
  );

  return {
    roleCount,
    totalUsersWithRoles: totalUsers,
    rolesWithUserCounts: usersWithRoles.map((role) => ({
      id: role.id,
      name: role.name,
      userCount: role._count.users,
      permissions: role.permissions,
    })),
  };
}

/**
 * Validates role permissions
 */
export async function validateRolePermissions({
  permissions,
}: {
  permissions: Permission[];
}) {
  if (!Array.isArray(permissions)) {
    throw new Error("Permissions must be an array");
  }

  // Check for duplicate permissions
  const uniquePermissions = Array.from(new Set(permissions));
  if (uniquePermissions.length !== permissions.length) {
    throw new Error("Duplicate permissions are not allowed");
  }

  return true;
}
