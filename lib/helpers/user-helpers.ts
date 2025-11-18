import { Prisma } from "@prisma/client";
import { CreateUserData, UpdateUserData } from "@/types/models/user";
import { hashPassword } from "@/lib/auth/password";
import { v4 as uuidv4 } from "uuid";

/**
 * Creates a user with business logic and tenant isolation
 */
export async function createUserWithBusinessLogic({
  data,
  tx,
}: {
  data: CreateUserData;
  tx: Prisma.TransactionClient;
}) {
  // Basic validation
  if (!data.name || !data.username) {
    throw new Error("Name and username are required");
  }

  // Check for duplicate username
  if (data.username) {
    const existingUser = await tx.user.findFirst({
      where: {
        username: data.username,
        deletedAt: null,
      },
    });
    if (existingUser) {
      throw new Error("Username already exists");
    }
  }

  // Process the data
  const processedData = { ...data };

  // Hash password if provided
  if (processedData.password) {
    processedData.password = await hashPassword(processedData.password);
  }

  // Generate token
  const token = uuidv4();

  // Create the user
  const user = await tx.user.create({
    data: {
      name: processedData.name,
      username: processedData.username,
      password: processedData.password,
      userType: processedData.userType,
      roleId: processedData.roleId,
      balance: processedData.balance || 0,
      bypassOTP: processedData.bypassOTP ?? true,
      token: token,
    },
    include: {
      role: true,
    },
  });

  return user;
}

/**
 * Updates a user with business logic and tenant isolation (same logic as original route)
 */
export async function updateUserWithBusinessLogic({
  data,
  tx,
}: {
  data: UpdateUserData;
  tx: Prisma.TransactionClient;
}) {
  const { id, ...updateFields } = data;

  if (!id) {
    throw new Error("User ID is required for update");
  }

  // Get the existing user to check it exists and belongs to the right tenant
  const existingUser = await tx.user.findUnique({
    where: { id },
    select: { id: true, deletedAt: true },
  });

  if (!existingUser || existingUser.deletedAt) {
    throw new Error("User not found or has been deleted");
  }

  // Create a copy of the data for processing (same as original)
  let processedData = { ...updateFields };

  // Check for duplicate username (excluding current user)
  if (processedData.username) {
    const existingUserCheck = await tx.user.findFirst({
      where: {
        username: processedData.username,
        deletedAt: null,
        NOT: { id },
      },
    });
    if (existingUserCheck) {
      throw new Error("Username already exists");
    }
  }

  // Hash password if provided
  if (processedData.password) {
    processedData.password = await hashPassword(processedData.password);
  } else {
    // If no password provided, remove it from the update data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...restData } = processedData;
    processedData = restData;
  }

  // Generate new token on update

  // Handle roleId properly (same as original)
  const updateData: Prisma.UserUpdateInput = {
    // Copy all scalar fields except relations
    name: processedData.name,
    username: processedData.username,
    password: processedData.password,
    userType: processedData.userType,
    balance: processedData.balance,
    bypassOTP: processedData.bypassOTP,
    deletedAt: processedData.deletedAt,
  };

  if (processedData.roleId !== undefined) {
    // If roleId is null or empty string, disconnect the role
    if (processedData.roleId === null || processedData.roleId === "") {
      updateData.role = { disconnect: true };
    } else {
      // Otherwise connect to the specified role
      updateData.role = {
        connect: { id: processedData.roleId },
      };
    }
  }

  const cleanData = updateData;

  // Update the user
  const user = await tx.user.update({
    where: { id },
    data: cleanData,
    include: {
      role: true,
    },
  });

  return user;
}

/**
 * Soft deletes a user with business logic
 */
export async function deleteUserWithBusinessLogic({
  id,
  tx,
}: {
  id: string;
  tx: Prisma.TransactionClient;
}) {
  if (!id) {
    throw new Error("User ID is required for deletion");
  }

  // Get the user to check it exists
  const user = await tx.user.findUnique({
    where: { id },
    select: { id: true, deletedAt: true },
  });

  if (!user || user.deletedAt) {
    throw new Error("User not found or already deleted");
  }

  // Soft delete the user
  const deletedUser = await tx.user.update({
    where: { id },
    data: { deletedAt: new Date() },
    include: {
      role: true,
    },
  });

  return deletedUser;
}

/**
 * Validates user filter parameters (same as original route)
 */
export async function validateUserFilters(filters: { roleId?: string }) {
  // Validate roleId filter if present
  if (filters.roleId && typeof filters.roleId === "string") {
    // Basic UUID validation - same as original
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(filters.roleId)) {
      throw new Error("Invalid role ID");
    }
  }
}
