/* eslint-disable @typescript-eslint/no-explicit-any */
import { authOptions } from "@/lib/authOptions";
import { ListOptions, PaginatedResponse } from "@/types/models/common";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Permission, Prisma, UserType, RequestMethod } from "@prisma/client";
import {
  createError,
  BaseError,
  UniqueConstraintError,
} from "@/lib/custom-error-handler";
import { getIpFromHeaders } from "@/lib/utils/get-ip";

export const dynamic = "force-dynamic";

type ApiResponse<T = any> = NextResponse<PaginatedResponse<T> | T>;

interface ApiContext<S extends z.ZodSchema | undefined = undefined> {
  paginationParams: ListOptions;
  body: S extends z.ZodSchema ? z.infer<S> : unknown;
  session?: {
    user: {
      id: string;
      userType: UserType;
      role: {
        permissions: Permission[];
      };
    };
  };
}

type ApiHandler<T = any, S extends z.ZodSchema | undefined = undefined> = (
  req: Request,
  context: ApiContext<S>
) => Promise<ApiResponse<T>>;

interface ApiOptions {
  requiredPermission?: Permission | null;
  requiredUserTypes?: UserType[];
  isPublic?: boolean;
}

interface AuditLogData {
  method: string;
  url: string;
  body?: unknown;
  type?: string;
  error?: string;
  entityType?: string;
  entityId?: string;
}

let lastCleanupDate: Date | null = null;

const cleanupOldAuditLogs = async () => {
  try {
    const now = new Date();
    // Only run cleanup once per day
    if (lastCleanupDate && now.getDate() === lastCleanupDate.getDate()) {
      return;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    lastCleanupDate = now;
  } catch (error) {
    console.error("Failed to cleanup old audit logs:", error);
  }
};

const createAuditLogAsync = async (data: {
  action: AuditLogData;
  path: string;
  method: string;
  status: number;
  userId?: string | null;
  ipAddress?: string;
}) => {
  try {
    // Run cleanup if needed
    await cleanupOldAuditLogs();

    const auditLogData: Prisma.AuditLogUncheckedCreateInput = {
      action:
        typeof data.action === "string"
          ? data.action
          : JSON.stringify({
              method: data.action.method,
              url: data.action.url,
              body: data.action.body,
              type: data.action.type,
              error: data.action.error,
            }),
      entityType: data.action.entityType || "API",
      entityId: data.action.entityId || data.path,
      path: data.path,
      method: data.method as RequestMethod,
      status: data.status,
      userId: data.userId ? data.userId : null,
      ipAddress: data.ipAddress || null,
    };

    await prisma.auditLog.create({ data: auditLogData });
  } catch (error) {
    console.error("Failed to create audit log:", {
      error,
      data: {
        action: data.action,
        path: data.path,
        method: data.method,
        status: data.status,
        userId: data.userId,
        ipAddress: data.ipAddress,
      },
    });
    // Don't throw the error to prevent API failures, but log it for debugging
  }
};

const getPaginationParams = (url: string): ListOptions => {
  const params = new URL(url).searchParams;
  const page = Math.max(1, parseInt(params.get("page") || "1", 10));
  const limitParam = params.get("limit");
  const limit =
    !limitParam || limitParam === "0"
      ? 10
      : Math.min(100, Math.max(1, parseInt(limitParam, 10)));

  // Remove pagination params from the searchParams object
  params.delete("page");
  params.delete("limit");

  return {
    page,
    limit,
    sortBy: params.get("sortBy") || undefined,
    sortOrder: (params.get("sortOrder") as "asc" | "desc") || undefined,
    search: params.get("search") || undefined,
    filter: params.get("filter")
      ? JSON.parse(params.get("filter") || "{}")
      : undefined,
    exact: params.get("exact") === "true",
  };
};

const formatResponse = <T>(
  data: T | PaginatedResponse<T>,
  status = 200
): NextResponse => {
  if (data === null || data === undefined) {
    return NextResponse.json(
      {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
      { status }
    );
  }

  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "items" in data &&
    "total" in data &&
    "page" in data &&
    "limit" in data &&
    "totalPages" in data
  ) {
    return NextResponse.json(data, { status });
  }

  if (Array.isArray(data)) {
    const response = {
      items: data,
      total: data.length,
      page: 1,
      limit: data.length,
      totalPages: 1,
    };
    return NextResponse.json(response, { status });
  }

  if (data && typeof data === "object" && "success" in data) {
    return NextResponse.json(data, { status });
  }

  const response = {
    items: [data],
    total: 1,
    page: 1,
    limit: 1,
    totalPages: 1,
  };
  return NextResponse.json(response, { status });
};

const createApiHandler = <
  T = any,
  S extends z.ZodSchema | undefined = undefined,
>(
  handler: ApiHandler<T, S>,
  options: ApiOptions,
  schema?: S
) => {
  return async (req: Request): Promise<NextResponse> => {
    const timings: Record<string, number> = {};
    let session: any = null;
    let body: unknown;

    try {
      const paginationParams = getPaginationParams(req.url);
      const ipAddress = getIpFromHeaders(req.headers);

      // Parse body for all non-GET requests
      if (req.method !== "GET") {
        const rawBody = await req.json();
        body = schema ? schema.parse(rawBody) : rawBody;
      }

      if (!options.isPublic) {
        const authStartTime = performance.now();
        session = await getServerSession(authOptions);

        if (!session || !session.user.id) {
          throw createError("Auth", "Errors", "Unauthorized", 401);
        }

        timings.authentication = performance.now() - authStartTime;

        if (
          options.requiredUserTypes &&
          options.requiredUserTypes.length > 0 &&
          !options.requiredUserTypes.includes(session.user.userType)
        ) {
          throw createError("Auth", "Errors", "InsufficientPermissions", 403);
        }

        if (
          session.user.userType === UserType.EMPLOYEE &&
          session.user.userType !== UserType.SUPER_ADMIN &&
          options.requiredPermission
        ) {
          const hasRequiredPermission = session.user.role?.permissions.includes(
            options.requiredPermission
          );

          if (!hasRequiredPermission) {
            throw createError("Auth", "Errors", "InsufficientPermissions", 403);
          }
        }
      }

      const context: ApiContext<S> = {
        paginationParams,
        body: body as S extends z.ZodSchema ? z.infer<S> : unknown,
        session: session
          ? {
              user: {
                id: session.user.id,
                userType: session.user.userType,
                role: {
                  permissions: session.user.role?.permissions || [],
                },
              },
            }
          : undefined,
      };

      const handlerStartTime = performance.now();
      const result = await handler(req, context);
      timings.handler = performance.now() - handlerStartTime;

      if (result instanceof NextResponse) {
        await createAuditLogAsync({
          userId: session?.user?.id ? session.user.id : null,
          action: {
            method: req.method,
            url: req.url,
            body:
              req.method === "GET"
                ? Object.fromEntries(new URL(req.url).searchParams)
                : body,
            type: "API_CALL",
          },
          path: new URL(req.url).pathname,
          method: req.method,
          status: result.status,
          ipAddress,
        });
        return result;
      }

      const formattedResponse = formatResponse(result);

      await createAuditLogAsync({
        userId: session?.user?.id ? session.user.id : null,
        action: {
          method: req.method,
          url: req.url,
          body:
            req.method === "GET"
              ? Object.fromEntries(new URL(req.url).searchParams)
              : body,
          type: "API_CALL",
        },
        path: new URL(req.url).pathname,
        method: req.method,
        status: formattedResponse.status,
        ipAddress,
      });

      return formattedResponse;
    } catch (error) {
      // Log the error for debugging
      console.error("API Error:", error);

      const ipAddress = getIpFromHeaders(req.headers);

      // Create audit log for the error
      await createAuditLogAsync({
        userId: session?.user?.id ? session.user.id : null,
        action: {
          method: req.method,
          url: req.url,
          body,
          type: "API_ERROR",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        path: new URL(req.url).pathname,
        method: req.method,
        status: error instanceof BaseError ? error.status : 500,
        ipAddress,
      });

      // Handle all errors
      if (error instanceof BaseError) {
        const response = {
          success: false,
          error: {
            message: error.message,
            status: error.status,
            type: error.type,
          },
        };
        return NextResponse.json(response, { status: error.status });
      }

      // Handle Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          const response = {
            success: false,
            error: {
              message: "System.Errors.RecordNotFound",
              status: 404,
              type: "not_found",
            },
          };
          return NextResponse.json(response, { status: 404 });
        }

        if (error.code === "P2002") {
          // Handle unique constraint errors
          const target = error.meta?.target as string[];
          if (target && target.length > 0) {
            const field = target[0];
            const uniqueError = new UniqueConstraintError("Fields", field);
            const response = {
              success: false,
              error: {
                message: uniqueError.message,
                status: uniqueError.status,
                type: uniqueError.type,
                field: field,
              },
            };
            return NextResponse.json(response, { status: uniqueError.status });
          }
        }

        const response = {
          success: false,
          error: {
            message: "System.Errors.DatabaseError",
            status: 500,
            type: "database_error",
          },
        };
        return NextResponse.json(response, { status: 500 });
      }

      // Handle unexpected errors
      const response = {
        success: false,
        error: {
          message: "System.Errors.UnexpectedError",
          status: 500,
          type: "unexpected_error",
        },
      };
      return NextResponse.json(response, { status: 500 });
    }
  };
};

// Helper functions for different user types
export const employeeApi = <
  T = any,
  S extends z.ZodSchema | undefined = undefined,
>(
  handler: ApiHandler<T, S>,
  requiredPermission: Permission | null = null,
  schema?: S
) =>
  createApiHandler<T, S>(
    handler,
    {
      requiredPermission,
      requiredUserTypes: [UserType.EMPLOYEE, UserType.SUPER_ADMIN],
      isPublic: false,
    },
    schema
  );

export const publicApi = <
  T = any,
  S extends z.ZodSchema | undefined = undefined,
>(
  handler: ApiHandler<T, S>,
  schema?: S
) =>
  createApiHandler<T, S>(
    handler,
    {
      isPublic: true,
    },
    schema
  );

export const authenticatedApi = <
  T = any,
  S extends z.ZodSchema | undefined = undefined,
>(
  handler: ApiHandler<T, S>,
  schema?: S
) =>
  createApiHandler<T, S>(
    handler,
    {
      isPublic: false,
    },
    schema
  );

export const createPaginatedResponse = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});
