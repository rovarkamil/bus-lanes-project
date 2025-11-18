/* eslint-disable @typescript-eslint/no-explicit-any */
import { Permission, PrismaClient, UserType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  employeeApi,
  publicApi,
  authenticatedApi,
} from "@/lib/api/api-middleware";
import { prisma } from "@/lib/prisma";
import { Context, ApiResponse, FieldConfig } from "@/types/models/common";
import { createPrismaQuery } from "./prisma-helpers";
import { debugLog } from "./debug-config";

type BaseModel = {
  id: string | number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
};

type PrismaDelegate = {
  findMany: (args: {
    where?: Record<string, any>;
    include?: Record<string, any>;
    take?: number;
    skip?: number;
    orderBy?: Record<string, "asc" | "desc">;
  }) => Promise<any[]>;
  count: (args: { where?: Record<string, any> }) => Promise<number>;
  create: (args: {
    data: Record<string, any>;
    include?: Record<string, any>;
  }) => Promise<any>;
  update: (args: {
    where: { id: string | number };
    data: Record<string, any>;
    include?: Record<string, any>;
  }) => Promise<any>;
  findUnique: (args: {
    where: { id: string | number };
    include?: Record<string, any>;
    select?: Record<string, any>;
  }) => Promise<any>;
};

// Define hook types for different operations
type HookContext<T = any> = {
  data: T;
  prisma: PrismaClient;
  session?: Context["session"];
};

export type Hooks<T = any> = {
  beforeCreate?: (context: HookContext<T>) => Promise<T>;
  afterCreate?: (context: HookContext<T & BaseModel>) => Promise<void>;
  beforeUpdate?: (context: HookContext<T & BaseModel>) => Promise<T>;
  afterUpdate?: (context: HookContext<T & BaseModel>) => Promise<void>;
  beforeDelete?: (context: HookContext<BaseModel>) => Promise<void>;
  afterDelete?: (context: HookContext<BaseModel>) => Promise<void>;
  beforeList?: (context: HookContext<any>) => Promise<void>;
  afterList?: (context: HookContext<any[]>) => Promise<any[]>;
};

// Define middleware type
type Middleware = (
  req: Request,
  context: Context,
  next: () => Promise<NextResponse>
) => Promise<NextResponse>;

export interface AccessControl {
  userTypes: UserType[];
  permission?: Permission | null;
  public?: boolean;
}

export interface ModelRouteOptions<
  SchemaType extends z.ZodObject<z.ZodRawShape>,
  CreateSchema extends z.ZodObject<z.ZodRawShape>,
  UpdateSchema extends z.ZodObject<z.ZodRawShape>,
  DeleteSchema extends z.ZodObject<z.ZodRawShape>,
  Model extends BaseModel,
> {
  modelName: keyof PrismaClient;
  schema: SchemaType;
  createSchema: CreateSchema;
  updateSchema: UpdateSchema;
  deleteSchema: DeleteSchema;
  fieldConfigs?: Record<string, FieldConfig>;
  relations?: Record<string, unknown>;
  defaultSort?: { field: string; order: "asc" | "desc" };
  uniqueFields?: string[];
  hooks?: Hooks;
  middleware?: Middleware[];
  excludeFields?: string[];
  customHandlers?: {
    list?: (req: Request, context: Context) => Promise<NextResponse>;
    create?: (
      req: Request,
      context: Context<z.infer<CreateSchema>>
    ) => Promise<NextResponse<ApiResponse<Model>>>;
    update?: (
      req: Request,
      context: Context<z.infer<UpdateSchema>>
    ) => Promise<NextResponse<ApiResponse<Model>>>;
    delete?: (
      req: Request,
      context: Context<z.infer<DeleteSchema>>
    ) => Promise<NextResponse<ApiResponse<Model>>>;
  };
}

interface AccessControlModelRouteOptions<
  SchemaType extends z.ZodObject<z.ZodRawShape>,
  CreateSchema extends z.ZodObject<z.ZodRawShape>,
  UpdateSchema extends z.ZodObject<z.ZodRawShape>,
  DeleteSchema extends z.ZodObject<z.ZodRawShape>,
  Model extends BaseModel,
> extends ModelRouteOptions<
    SchemaType,
    CreateSchema,
    UpdateSchema,
    DeleteSchema,
    Model
  > {
  access: {
    view: AccessControl;
    create: AccessControl;
    update: AccessControl;
    delete: AccessControl;
  };
}

interface EmployeeModelRouteOptions<
  SchemaType extends z.ZodObject<z.ZodRawShape>,
  CreateSchema extends z.ZodObject<z.ZodRawShape>,
  UpdateSchema extends z.ZodObject<z.ZodRawShape>,
  DeleteSchema extends z.ZodObject<z.ZodRawShape>,
  Model extends BaseModel,
> extends Omit<
    ModelRouteOptions<
      SchemaType,
      CreateSchema,
      UpdateSchema,
      DeleteSchema,
      Model
    >,
    "access"
  > {
  permissions: {
    view: Permission | null;
    create?: Permission | null;
    update?: Permission | null;
    delete?: Permission | null;
  };
}

// Helper function to select the appropriate API middleware based on access control
function selectApiMiddleware(access: AccessControl) {
  if (access.public) {
    return publicApi;
  }

  const hasEmployee = access.userTypes.includes(UserType.EMPLOYEE);

  if (hasEmployee) {
    return (handler: any, schema?: any) =>
      employeeApi(handler, access.permission, schema);
  }

  return authenticatedApi;
}

export function createModelRoutes<
  SchemaType extends z.ZodObject<z.ZodRawShape>,
  CreateSchema extends z.ZodObject<z.ZodRawShape>,
  UpdateSchema extends z.ZodObject<z.ZodRawShape>,
  DeleteSchema extends z.ZodObject<z.ZodRawShape>,
  Model extends BaseModel,
>(
  options: AccessControlModelRouteOptions<
    SchemaType,
    CreateSchema,
    UpdateSchema,
    DeleteSchema,
    Model
  >
) {
  // Helper to validate existence
  const validateExistence = async (id: string | number): Promise<void> => {
    const delegate = prisma[options.modelName] as unknown as PrismaDelegate;
    const record = await delegate.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });

    if (!record || record.deletedAt !== null) {
      throw new Error(
        `${String(options.modelName)} not found or has been deleted`
      );
    }
  };

  // Helper to run middleware chain
  const runMiddleware = async (
    req: Request,
    context: Context,
    middlewares: Middleware[],
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> => {
    if (!middlewares?.length) return handler();

    let index = 0;
    const next = async (): Promise<NextResponse> => {
      if (index >= (middlewares?.length || 0)) {
        return handler();
      }
      const middleware = middlewares[index++];
      return middleware(req, context, next);
    };

    return next();
  };

  // Helper to exclude specified fields from response data
  const excludeFieldsFromResponse = (data: any): any => {
    if (!options.excludeFields?.length) return data;

    if (Array.isArray(data)) {
      return data.map((item) => excludeFieldsFromResponse(item));
    }

    if (data && typeof data === "object") {
      const filtered = { ...data };
      options.excludeFields.forEach((field) => {
        delete filtered[field];
      });
      return filtered;
    }

    return data;
  };

  // List/Search Route
  const list = async (req: Request, context: Context) => {
    if (options.customHandlers?.list) {
      return options.customHandlers.list(req, context);
    }

    const handler = async () => {
      const { searchParams } = new URL(req.url);
      const allParams = Object.fromEntries(searchParams.entries());
      debugLog(
        `[${String(options.modelName)}] List request params:`,
        allParams
      );

      const filterParams = allParams;

      const query = createPrismaQuery({
        filters: filterParams,
        fieldConfigs: options.fieldConfigs,
        listOptions: context.paginationParams,
        defaultSort: options.defaultSort,
        sessionContext: context.session
          ? { user: context.session.user }
          : undefined,
      });
      debugLog(`[${String(options.modelName)}] Generated Prisma query:`, query);

      const delegate = prisma[options.modelName] as unknown as PrismaDelegate;

      if (options.hooks?.beforeList) {
        await options.hooks.beforeList({
          data: query,
          prisma,
          session: context.session,
        });
      }

      const [initialItems, total] = await Promise.all([
        delegate.findMany({
          ...query,
          include: options.relations,
        }),
        delegate.count({ where: query.where }),
      ]);
      debugLog(
        `[${String(options.modelName)}] Found ${initialItems.length} items out of ${total} total`
      );

      let finalItems = initialItems;
      if (options.hooks?.afterList) {
        const processedItems = await options.hooks.afterList({
          data: initialItems,
          prisma,
          session: context.session,
        });

        finalItems = Array.isArray(processedItems)
          ? processedItems
          : [processedItems];
      }

      finalItems = excludeFieldsFromResponse(finalItems);
      debugLog(
        `[${String(options.modelName)}] Final response items:`,
        finalItems
      );

      return NextResponse.json({
        items: finalItems,
        total,
        page: context.paginationParams?.page ?? 1,
        limit: context.paginationParams?.limit ?? 10,
        totalPages: Math.ceil(total / (context.paginationParams?.limit ?? 10)),
      });
    };

    return runMiddleware(req, context, options.middleware || [], handler);
  };

  // Create Route
  const create = async (
    req: Request,
    context: Context<z.infer<CreateSchema>>
  ): Promise<NextResponse<ApiResponse<Model>>> => {
    if (options.customHandlers?.create) {
      return options.customHandlers.create(req, context);
    }

    const handler = async () => {
      let data = context.body!;
      debugLog(`[${String(options.modelName)}] Create request data:`, data);

      const delegate = prisma[options.modelName] as unknown as PrismaDelegate;

      if (options.hooks?.beforeCreate) {
        data = await options.hooks.beforeCreate({
          data,
          prisma,
          session: context.session,
        });
        debugLog(
          `[${String(options.modelName)}] Data after beforeCreate hook:`,
          data
        );
      }

      const created = await delegate.create({
        data,
        include: options.relations,
      });
      debugLog(`[${String(options.modelName)}] Created record:`, created);

      if (options.hooks?.afterCreate) {
        await options.hooks.afterCreate({
          data: created,
          prisma,
          session: context.session,
        });
      }

      const responseData = excludeFieldsFromResponse(created);
      debugLog(
        `[${String(options.modelName)}] Final response data:`,
        responseData
      );

      return NextResponse.json({
        success: true,
        data: responseData as Model,
        message: `success.created`,
      }) as NextResponse<ApiResponse<Model>>;
    };

    return runMiddleware(
      req,
      context,
      options.middleware || [],
      handler
    ) as Promise<NextResponse<ApiResponse<Model>>>;
  };

  // Update Route
  const update = async (
    req: Request,
    context: Context<z.infer<UpdateSchema>>
  ): Promise<NextResponse<ApiResponse<Model>>> => {
    if (options.customHandlers?.update) {
      return options.customHandlers.update(req, context);
    }

    const { id, ...data } = context.body!;
    debugLog(
      `[${String(options.modelName)}] Update request for id ${id}:`,
      data
    );

    const delegate = prisma[options.modelName] as unknown as PrismaDelegate;

    await validateExistence(id);

    let processedData = data;
    if (options.hooks?.beforeUpdate) {
      processedData = await options.hooks.beforeUpdate({
        data: { id, ...data },
        prisma,
        session: context.session,
      });
      debugLog(
        `[${String(options.modelName)}] Data after beforeUpdate hook:`,
        processedData
      );
    }

    const updated = await delegate.update({
      where: { id },
      data: processedData,
      include: options.relations,
    });
    debugLog(`[${String(options.modelName)}] Updated record:`, updated);

    if (options.hooks?.afterUpdate) {
      await options.hooks.afterUpdate({
        data: updated,
        prisma,
        session: context.session,
      });
    }

    const responseData = excludeFieldsFromResponse(updated);
    debugLog(
      `[${String(options.modelName)}] Final response data:`,
      responseData
    );

    return NextResponse.json({
      success: true,
      data: responseData as Model,
      message: `success.updated`,
    });
  };

  // Delete Route
  const delete_ = async (
    req: Request,
    context: Context<z.infer<DeleteSchema>>
  ): Promise<NextResponse<ApiResponse<Model>>> => {
    if (options.customHandlers?.delete) {
      return options.customHandlers.delete(req, context);
    }

    const { id } = context.body!;
    debugLog(`[${String(options.modelName)}] Delete request for id:`, id);

    const delegate = prisma[options.modelName] as unknown as PrismaDelegate;

    await validateExistence(id);

    if (options.hooks?.beforeDelete) {
      await options.hooks.beforeDelete({
        data: { id },
        prisma,
        session: context.session,
      });
    }

    const deleted = await delegate.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
      include: options.relations,
    });
    debugLog(`[${String(options.modelName)}] Soft-deleted record:`, deleted);

    if (options.hooks?.afterDelete) {
      await options.hooks.afterDelete({
        data: deleted,
        prisma,
        session: context.session,
      });
    }

    const responseData = excludeFieldsFromResponse(deleted);
    debugLog(
      `[${String(options.modelName)}] Final response data:`,
      responseData
    );

    return NextResponse.json({
      success: true,
      data: responseData as Model,
      message: `success.deleted`,
    });
  };

  const listMiddleware = selectApiMiddleware(options.access.view);
  const createMiddleware = selectApiMiddleware(options.access.create);
  const updateMiddleware = selectApiMiddleware(options.access.update);
  const deleteMiddleware = selectApiMiddleware(options.access.delete);

  return {
    GET: listMiddleware(list),
    POST: createMiddleware(create, options.createSchema),
    PUT: updateMiddleware(update, options.updateSchema),
    DELETE: deleteMiddleware(delete_, options.deleteSchema),
  };
}

// Internal function to create model routes with specific user types
function createModelRoutesWithUserTypes<
  SchemaType extends z.ZodObject<z.ZodRawShape>,
  CreateSchema extends z.ZodObject<z.ZodRawShape>,
  UpdateSchema extends z.ZodObject<z.ZodRawShape>,
  DeleteSchema extends z.ZodObject<z.ZodRawShape>,
  Model extends BaseModel,
>(
  options: ModelRouteOptions<
    SchemaType,
    CreateSchema,
    UpdateSchema,
    DeleteSchema,
    Model
  >,
  userTypes: UserType[],
  isPublic = false
) {
  const access: {
    view: AccessControl;
    create: AccessControl;
    update: AccessControl;
    delete: AccessControl;
  } = {
    view: { userTypes, public: isPublic },
    create: { userTypes, public: isPublic },
    update: { userTypes, public: isPublic },
    delete: { userTypes, public: isPublic },
  };

  return createModelRoutes({
    ...options,
    access,
  });
}

// Create employee routes with specific permissions
export function createEmployeeModelRoutes<
  SchemaType extends z.ZodObject<z.ZodRawShape>,
  CreateSchema extends z.ZodObject<z.ZodRawShape>,
  UpdateSchema extends z.ZodObject<z.ZodRawShape>,
  DeleteSchema extends z.ZodObject<z.ZodRawShape>,
  Model extends BaseModel,
>(
  options: EmployeeModelRouteOptions<
    SchemaType,
    CreateSchema,
    UpdateSchema,
    DeleteSchema,
    Model
  >
) {
  const userTypes = [UserType.EMPLOYEE, UserType.SUPER_ADMIN];

  const access: {
    view: AccessControl;
    create: AccessControl;
    update: AccessControl;
    delete: AccessControl;
  } = {
    view: {
      userTypes,
      permission: options.permissions.view ?? null,
      public: false,
    },
    create: {
      userTypes,
      permission: options.permissions.create ?? null,
      public: false,
    },
    update: {
      userTypes,
      permission: options.permissions.update ?? null,
      public: false,
    },
    delete: {
      userTypes,
      permission: options.permissions.delete ?? null,
      public: false,
    },
  };

  // Remove the permissions property and add access
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { permissions, ...restOptions } = options;

  const routes = createModelRoutes({
    ...restOptions,
    access,
  });

  // Only return the routes that have corresponding permissions
  const result: Partial<typeof routes> = {};
  if (options.permissions.view !== undefined) result.GET = routes.GET;
  if (options.permissions.create !== undefined) result.POST = routes.POST;
  if (options.permissions.update !== undefined) result.PUT = routes.PUT;
  if (options.permissions.delete !== undefined) result.DELETE = routes.DELETE;

  return result;
}

// Create public routes
export function createPublicModelRoutes<
  SchemaType extends z.ZodObject<z.ZodRawShape>,
  CreateSchema extends z.ZodObject<z.ZodRawShape>,
  UpdateSchema extends z.ZodObject<z.ZodRawShape>,
  DeleteSchema extends z.ZodObject<z.ZodRawShape>,
  Model extends BaseModel,
>(
  options: ModelRouteOptions<
    SchemaType,
    CreateSchema,
    UpdateSchema,
    DeleteSchema,
    Model
  >
) {
  return createModelRoutesWithUserTypes(options, [], true);
}

// Create custom routes without requiring a Prisma model
export function createCustomEmployeeRoute<
  SchemaType extends z.ZodObject<z.ZodRawShape>,
>(options: {
  schema: SchemaType;
  permission: Permission | null;
  handler: (req: Request, context: Context) => Promise<NextResponse>;
}) {
  const access: AccessControl = {
    userTypes: [UserType.EMPLOYEE, UserType.SUPER_ADMIN],
    permission: options.permission,
    public: false,
  };

  const middleware = selectApiMiddleware(access);
  return {
    GET: middleware(options.handler, options.schema),
  };
}
