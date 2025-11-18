import { Prisma } from "@prisma/client";
import {
  Info,
  Activity,
  FileText,
  Globe,
  UserIcon,
  Clock,
  Hash,
  Server,
} from "lucide-react";
import { z } from "zod";
import {
  FieldConfig,
  ResponseWithRelations,
  PaginatedResponseWithRelations,
  FilterParams,
  SearchParams,
  BaseActionButton,
  BaseActionHandlers,
  BASE_BUTTON_STYLES,
  baseModelSchema,
  STRING_SEARCH_CONFIG,
  FormFieldDefinition,
  FormSectionDefinition,
  ViewFieldDefinition,
  ViewSectionDefinition,
  FilterFieldDefinition,
  FilterSectionDefinition,
  BaseFormProps,
  TranslationFunctions,
  BaseDialogProps,
} from "./common";

// Response Types
export type AuditLogResponse = ResponseWithRelations<AuditLogWithRelations>;
export type AuditLogsResponse =
  PaginatedResponseWithRelations<AuditLogWithRelations>;

// Prisma Types
export type AuditLogWithUser = Prisma.AuditLogGetPayload<{
  include: {
    user: true;
  };
}>;

export type AuditLogWithRelations = AuditLogWithUser;

// Schema Definitions
const baseAuditLogSchema = z.object({
  action: z.string().min(1, "Action|Validation.Errors.Required"),
  entityType: z.string().min(1, "EntityType|Validation.Errors.Required"),
  entityId: z.string().min(1, "EntityId|Validation.Errors.Required"),
  details: z.any().optional(),
  path: z.string().nullable().optional(),
  method: z.string().nullable().optional(),
  status: z.number().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  duration: z.number().nullable().optional(),
  requestId: z.string().nullable().optional(),
  correlationId: z.string().nullable().optional(),
  userId: z
    .string()
    .uuid("User|Validation.Errors.InvalidUuid")
    .nullable()
    .optional(),
});

export const auditLogSchema = baseModelSchema.extend(baseAuditLogSchema.shape);
export const createAuditLogSchema = baseAuditLogSchema;
export const updateAuditLogSchema = auditLogSchema.partial().extend({
  id: z.string().uuid("Id|Validation.Errors.InvalidUuid"),
});
export const deleteAuditLogSchema = z.object({
  id: z.string().uuid("Id|Validation.Errors.InvalidUuid"),
});

// Schema Types
export type CreateAuditLogData = z.infer<typeof createAuditLogSchema>;
export type UpdateAuditLogData = z.infer<typeof updateAuditLogSchema>;
export type DeleteAuditLogData = z.infer<typeof deleteAuditLogSchema>;

// Filter Types
export interface AuditLogFilterParams extends FilterParams {
  action?: string;
  entityType?: string;
  entityId?: string;
  path?: string;
  method?: string;
  status?: number;
  ipAddress?: string;
  userId?: string;
}

export interface AuditLogTableSearchParams
  extends AuditLogFilterParams,
    SearchParams {}

// Field Configurations
export const auditLogFieldConfigs: Record<string, FieldConfig> = {
  action: {
    ...STRING_SEARCH_CONFIG,
    type: "string",
  },
  entityType: {
    ...STRING_SEARCH_CONFIG,
    type: "string",
  },
  entityId: {
    ...STRING_SEARCH_CONFIG,
    type: "string",
  },
  path: {
    ...STRING_SEARCH_CONFIG,
    type: "string",
  },
  method: {
    type: "enum",
    searchable: false,
  },
  status: {
    type: "number",
    searchable: false,
  },
  ipAddress: {
    ...STRING_SEARCH_CONFIG,
    type: "string",
  },
  userId: {
    type: "relation",
    searchable: false,
  },
};

// Form Props
export type AuditLogFormProps<
  T extends CreateAuditLogData | UpdateAuditLogData,
> = BaseFormProps<T>;

// Form field paths
export const AUDIT_LOG_FORM_PATHS = {
  action: "action",
  entityType: "entityType",
  entityId: "entityId",
  details: "details",
  path: "path",
  method: "method",
  status: "status",
  ipAddress: "ipAddress",
  userAgent: "userAgent",
  duration: "duration",
  requestId: "requestId",
  correlationId: "correlationId",
  userId: "userId",
} as const;

export type AuditLogFormPath = keyof typeof AUDIT_LOG_FORM_PATHS;

// Common form field values
export const AUDIT_LOG_FORM_FIELD_VALUES = {
  userId: "userId",
} as const;

// Dialog Props
export interface AuditLogDialogProps extends BaseDialogProps {
  auditLog?: AuditLogWithRelations | null;
}

export type ViewAuditLogDialogProps = BaseDialogProps & {
  data: AuditLogWithRelations;
};
export type CreateAuditLogDialogProps = BaseDialogProps;
export type UpdateAuditLogDialogProps = BaseDialogProps & {
  data: AuditLogWithRelations;
};

// Action Types
export type AuditLogActionButton = BaseActionButton<AuditLogWithRelations>;
export type AuditLogActionHandlers = BaseActionHandlers<AuditLogWithRelations>;

export const AUDIT_LOG_ACTION_BUTTONS: AuditLogActionButton[] = [
  {
    icon: Info,
    tooltip: "ViewDetails",
    ...BASE_BUTTON_STYLES.view,
    onClick: (auditLog, handlers) => {
      handlers.setSelectedItem?.(auditLog);
      handlers.setIsViewDialogOpen?.(true);
    },
    requiresPermission: "VIEW_AUDIT_LOGS",
  },
];

// Form Field Definitions
export const AUDIT_LOG_FORM_FIELDS: FormFieldDefinition[] = [
  {
    key: "action",
    label: "Action",
    icon: Activity,
    placeholder: "ActionPlaceholder",
  },
  {
    key: "entityType",
    label: "EntityType",
    icon: FileText,
    placeholder: "EntityTypePlaceholder",
  },
  {
    key: "entityId",
    label: "EntityId",
    icon: Hash,
    placeholder: "EntityIdPlaceholder",
  },
  {
    key: "details",
    label: "Details",
    icon: FileText,
    placeholder: "DetailsPlaceholder",
  },
];

// Form Sections
export const AUDIT_LOG_FORM_SECTIONS: FormSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: AUDIT_LOG_FORM_FIELDS.filter((field) =>
      ["action", "entityType", "entityId", "details"].includes(field.key)
    ),
  },
];

// Filter Field Definitions
export const AUDIT_LOG_FILTER_FIELDS: FilterFieldDefinition[] = [
  {
    key: "action",
    label: "Action",
    icon: Activity,
    filterType: "text",
    placeholder: "ActionPlaceholder",
  },
  {
    key: "entityType",
    label: "EntityType",
    icon: FileText,
    filterType: "text",
    placeholder: "EntityTypePlaceholder",
  },
  {
    key: "entityId",
    label: "EntityId",
    icon: Hash,
    filterType: "text",
    placeholder: "EntityIdPlaceholder",
  },
  {
    key: "path",
    label: "Path",
    icon: Globe,
    filterType: "text",
    placeholder: "PathPlaceholder",
  },
  {
    key: "method",
    label: "Method",
    icon: Server,
    filterType: "select",
    placeholder: "MethodPlaceholder",
    options: ["GET", "POST", "PUT", "DELETE", "PATCH"].map((method) => ({
      label: method,
      value: method,
    })),
  },
  {
    key: "userId",
    label: "User",
    icon: UserIcon,
    filterType: "text",
    placeholder: "UserPlaceholder",
  },
  {
    key: "createdAt",
    label: "CreatedAt",
    icon: Clock,
    filterType: "date",
    placeholder: "PickADate",
  },
];

// Filter Sections
export const AUDIT_LOG_FILTER_SECTIONS: FilterSectionDefinition[] = [
  {
    title: "BasicFilters",
    fields: AUDIT_LOG_FILTER_FIELDS.filter((field) =>
      ["action", "entityType", "entityId", "userId"].includes(field.key)
    ),
  },
  {
    title: "RequestFilters",
    fields: AUDIT_LOG_FILTER_FIELDS.filter((field) =>
      ["path", "method"].includes(field.key)
    ),
  },
  {
    title: "DateFilters",
    fields: AUDIT_LOG_FILTER_FIELDS.filter((field) =>
      ["createdAt"].includes(field.key)
    ),
  },
];

// View Field Definitions
export const AUDIT_LOG_VIEW_FIELDS: ViewFieldDefinition[] = [
  {
    key: "action",
    label: "Action",
    icon: Activity,
    viewType: "text",
  },
  {
    key: "entityType",
    label: "EntityType",
    icon: FileText,
    viewType: "text",
  },
  {
    key: "entityId",
    label: "EntityId",
    icon: Hash,
    viewType: "copyable",
  },
  {
    key: "details",
    label: "Details",
    icon: FileText,
    viewType: "text",
  },
  {
    key: "path",
    label: "Path",
    icon: Globe,
    viewType: "text",
  },
  {
    key: "method",
    label: "Method",
    icon: Server,
    viewType: "text",
  },
  {
    key: "user",
    label: "User",
    icon: UserIcon,
    viewType: "text",
    formatValue: (value: unknown) => {
      const user = value as { name: string } | null;
      return user?.name ?? "NoUser";
    },
  },
  {
    key: "createdAt",
    label: "CreatedAt",
    icon: Clock,
    viewType: "date",
  },
];

// View Sections
export const AUDIT_LOG_VIEW_SECTIONS: ViewSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: AUDIT_LOG_VIEW_FIELDS.filter((field) =>
      ["action", "entityType", "entityId", "details"].includes(field.key)
    ),
  },
  {
    title: "RequestInformation",
    fields: AUDIT_LOG_VIEW_FIELDS.filter((field) =>
      ["path", "method", "user"].includes(field.key)
    ),
  },
  {
    title: "ActivityInformation",
    fields: AUDIT_LOG_VIEW_FIELDS.filter((field) =>
      ["createdAt"].includes(field.key)
    ),
  },
];

export const getAuditLogTranslations = (
  t: (key: string) => string,
  tValidation: (key: string) => string,
  tFields: (key: string) => string
): TranslationFunctions => ({
  AuditLogs: t,
  Validation: tValidation,
  Fields: tFields,
});
