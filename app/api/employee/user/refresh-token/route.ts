import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createEmployeeModelRoutes } from "@/utils/createModelRoutes";
import { Permission } from "@prisma/client";
import { z } from "zod";
import { Context, ApiResponse } from "@/types/models/common";

const refreshTokenSchema = z.object({
  id: z.string().uuid(),
});

type RefreshTokenResponse = {
  id: string;
  token: string | null;
};

export const { POST } = createEmployeeModelRoutes({
  modelName: "user",
  schema: refreshTokenSchema,
  createSchema: refreshTokenSchema,
  updateSchema: refreshTokenSchema,
  deleteSchema: refreshTokenSchema,
  permissions: {
    view: Permission.UPDATE_USER,
    create: Permission.UPDATE_USER,
  },
  customHandlers: {
    create: async (
      req: Request,
      context: Context<{ id: string }>
    ): Promise<NextResponse<ApiResponse<RefreshTokenResponse>>> => {
      try {
        const { id } = context.body!;

        const user = await prisma.user.findUnique({
          where: { id },
        });

        if (!user) {
          return NextResponse.json({
            success: false,
            message: "User not found",
            data: undefined,
          });
        }

        const updatedUser = await prisma.user.update({
          where: { id },
          data: {
            token: uuidv4(),
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            id: updatedUser.id,
            token: updatedUser.token,
          },
          message: "Token refreshed successfully",
        });
      } catch (error) {
        console.error("Error refreshing token:", error);
        return NextResponse.json({
          success: false,
          message: "Internal server error",
          data: undefined,
        });
      }
    },
  },
});
