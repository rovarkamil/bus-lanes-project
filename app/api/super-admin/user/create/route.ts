/* eslint-disable @zohodesk/no-hardcoding/no-hardcoding */
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Permission, UserType } from "@prisma/client";
import { hashPassword, PasswordError } from "@/lib/auth/password";
import { createError, CustomErrorHandler } from "@/lib/custom-error-handler";

const formatErrorResponse = (error: CustomErrorHandler): NextResponse => {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: error.message,
        status: error.status,
      },
    },
    { status: error.status }
  );
};

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { superadminpassword } = data;

    if (superadminpassword !== process.env.SUPER_ADMIN_PASSWORD) {
      throw createError("Auth", "Errors", "Unauthorized", 401);
    }

    // Create transaction to ensure all entities are created or none
    const result = await prisma.$transaction(async (tx) => {
      try {
        // Hash password using our enhanced password hashing without validation
        const adminPassword = await hashPassword("admin");

        // Get all permissions
        const allPermissions = Object.values(Permission);

        // Create admin role with all permissions
        const adminRole = await tx.role.create({
          data: {
            name: "System Administrator",
            permissions: allPermissions,
          },
        });

        // Create super admin user
        const adminUser = await tx.user.create({
          data: {
            name: "System Administrator",
            username: "admin",
            password: adminPassword,
            userType: UserType.SUPER_ADMIN,
            roleId: adminRole.id,
          },
        });

        // Create initial settings
        const settings = await tx.setting.createMany({
          data: [
            {
              key: "CUSTOM_BARCODE_PREFIX",
              value: "2700",
              type: "STRING",
              isLocked: true,
            },
            {
              key: "DEVELOPER_MESSAGE",
              value: "© Developed by Rovar Dev",
              type: "STRING",
              isLocked: true,
            },
            {
              key: "COMPANY_ADDRESS",
              value: "Not Available",
              type: "STRING",
              isLocked: true,
            },
            {
              key: "COMPANY_NAME",
              value: "Rovar Dev",
              type: "STRING",
              isLocked: true,
            },
            {
              key: "COMPANY_PHONE",
              value: "0770 155 4024",
              type: "STRING",
              isLocked: true,
            },
            {
              key: "MIN_BARCODE_LENGTH",
              value: "12",
              type: "NUMBER",
              isLocked: true,
            },
            {
              key: "USD_PRICE",
              value: "1450",
              type: "STRING",
              isLocked: false,
            },
            {
              key: "THEME_PRIMARY_COLOR",
              value: "#00A878",
              type: "STRING",
              isLocked: true,
            },
          ],
        });

        return {
          admin: {
            id: adminUser.id,
            name: adminUser.name,
            username: adminUser.username,
            userType: adminUser.userType,
            roleId: adminUser.roleId,
          },
          role: adminRole,
          settings,
        };
      } catch (error) {
        // If it's a password-related error, throw it to be caught by the outer try-catch
        if (error instanceof PasswordError) {
          throw error;
        }
        throw createError("System", "Errors", "AdminSetupFailed", 500);
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating admin setup:", error);

    if (error instanceof PasswordError) {
      throw createError("Auth", "Validation", "InvalidPassword", 400);
    }

    if (error instanceof CustomErrorHandler) {
      return formatErrorResponse(error);
    }

    throw createError("System", "Errors", "UnexpectedError", 500);
  }
}

export const dynamic = "force-dynamic";

// Example request body:
// {
//   "superadminpassword": "your-super-admin-password"
// }
