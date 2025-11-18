import { Permission, Prisma } from "@prisma/client";
import {
  Info,
  Edit,
  Trash2,
  ShieldIcon,
  CalendarIcon,
  Clock,
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
  ENUM_FILTER_CONFIG,
  BaseDialogProps,
  FormFieldDefinition,
  FormSectionDefinition,
  FilterFieldDefinition,
  FilterSectionDefinition,
  ViewFieldDefinition,
  ViewSectionDefinition,
  BaseFormProps,
  TranslationFunctions,
} from "./common";

// Response Types
export type RoleResponse = ResponseWithRelations<RoleWithRelations>;
export type RolesResponse = PaginatedResponseWithRelations<RoleWithRelations>;

// Prisma Types
export type RoleWithRelations = Prisma.RoleGetPayload<{
  include: {
    users: true;
  };
}>;

// Extended Types
export type RoleWithPermissions = RoleWithRelations & {
  permissions: Permission[];
};

// Schema Definitions
const baseRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Name|Validation.Errors.TooShort")
    .max(100, "Name|Validation.Errors.TooLong"),
  kurdishName: z
    .string()
    .min(2, "KurdishName|Validation.Errors.TooShort")
    .max(100, "KurdishName|Validation.Errors.TooLong")
    .nullable()
    .optional(),
  arabicName: z
    .string()
    .min(2, "ArabicName|Validation.Errors.TooShort")
    .max(100, "ArabicName|Validation.Errors.TooLong")
    .nullable()
    .optional(),
  permissions: z
    .array(z.nativeEnum(Permission))
    .min(1, "Permissions|Validation.Errors.Required"),
});

export const roleSchema = baseModelSchema.extend(baseRoleSchema.shape);
export const createRoleSchema = baseRoleSchema;
export const updateRoleSchema = roleSchema.partial().extend({
  id: z.string().uuid("Id|Validation.Errors.InvalidUuid"),
});
export const deleteRoleSchema = z.object({
  id: z.string().uuid("Id|Validation.Errors.InvalidUuid"),
});

// Schema Types
export type CreateRoleData = z.infer<typeof createRoleSchema>;
export type UpdateRoleData = z.infer<typeof updateRoleSchema>;
export type DeleteRoleData = z.infer<typeof deleteRoleSchema>;

// Filter Types
export interface RoleFilterParams extends FilterParams {
  name?: string;
  kurdishName?: string;
  arabicName?: string;
  permissions?: Permission[];
}

export interface RoleTableSearchParams extends RoleFilterParams, SearchParams {}

// Field Configurations
export const roleFieldConfigs: Record<string, FieldConfig> = {
  name: {
    type: "string",
    maxLength: 100,
    searchable: true,
    operator: "contains",
    mode: "insensitive",
    filters: {
      customOperators: ["contains", "equals"],
      operator: "contains",
      mode: "insensitive",
    },
  },
  kurdishName: {
    type: "string",
    maxLength: 100,
    searchable: true,
    operator: "contains",
    mode: "insensitive",
    filters: {
      customOperators: ["contains", "equals"],
      operator: "contains",
      mode: "insensitive",
    },
  },
  arabicName: {
    type: "string",
    maxLength: 100,
    searchable: true,
    operator: "contains",
    mode: "insensitive",
    filters: {
      customOperators: ["contains", "equals"],
      operator: "contains",
      mode: "insensitive",
    },
  },
  permissions: {
    ...ENUM_FILTER_CONFIG,
    type: "enum",
    options: Object.values(Permission),
  },
};

// Form Props
export type RoleFormProps<T extends CreateRoleData | UpdateRoleData> =
  BaseFormProps<T>;

// Form field paths
export const ROLE_FORM_PATHS = {
  name: "name",
  kurdishName: "kurdishName",
  arabicName: "arabicName",
  permissions: "permissions",
} as const;

export type RoleFormPath = keyof typeof ROLE_FORM_PATHS;

// Dialog Props
export interface RoleDialogProps extends BaseDialogProps {
  role?: RoleWithRelations | null;
}

export type ViewRoleDialogProps = BaseDialogProps & { data: RoleWithRelations };
export type CreateRoleDialogProps = BaseDialogProps;
export type UpdateRoleDialogProps = BaseDialogProps & {
  data: RoleWithRelations;
};

// Action Types
export type RoleActionButton = BaseActionButton<RoleWithRelations>;
export type RoleActionHandlers = BaseActionHandlers<RoleWithRelations>;

export const ROLE_ACTION_BUTTONS: RoleActionButton[] = [
  {
    icon: Info,
    tooltip: "ViewDetails",
    ...BASE_BUTTON_STYLES.view,
    onClick: (role, handlers) => {
      handlers.setSelectedItem?.(role);
      handlers.setIsViewDialogOpen?.(true);
    },
    requiresPermission: false,
  },
  {
    icon: Edit,
    tooltip: "UpdateRole",
    ...BASE_BUTTON_STYLES.edit,
    onClick: (role, handlers) => handlers.handleOpenUpdateDialog?.(role),
    requiresPermission: "UPDATE_ROLE",
  },
  {
    icon: Trash2,
    tooltip: "Delete",
    ...BASE_BUTTON_STYLES.delete,
    onClick: (role, handlers) => handlers.handleDelete?.(role.id),
    requiresPermission: "DELETE_ROLE",
  },
];

// Form Field Definitions
export const ROLE_FORM_FIELDS: FormFieldDefinition[] = [
  {
    key: "name",
    label: "Name",
    icon: ShieldIcon,
    placeholder: "NamePlaceholder",
  },
  {
    key: "kurdishName",
    label: "KurdishName",
    icon: ShieldIcon,
    placeholder: "KurdishNamePlaceholder",
  },
  {
    key: "arabicName",
    label: "ArabicName",
    icon: ShieldIcon,
    placeholder: "ArabicNamePlaceholder",
  },
  {
    key: "permissions",
    label: "Permissions",
    icon: ShieldIcon,
    type: "text",
    placeholder: "PermissionsPlaceholder",
  },
];

// Form Sections
export const ROLE_FORM_SECTIONS: FormSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: ROLE_FORM_FIELDS.filter((field) =>
      ["name", "kurdishName", "arabicName"].includes(field.key)
    ),
  },
  {
    title: "Permissions",
    fields: ROLE_FORM_FIELDS.filter((field) =>
      ["permissions"].includes(field.key)
    ),
  },
];

// Filter Field Definitions
export const ROLE_FILTER_FIELDS: FilterFieldDefinition[] = [
  {
    key: "name",
    label: "Name",
    icon: ShieldIcon,
    filterType: "text",
    placeholder: "NamePlaceholder",
  },
  {
    key: "kurdishName",
    label: "KurdishName",
    icon: ShieldIcon,
    filterType: "text",
    placeholder: "KurdishNamePlaceholder",
  },
  {
    key: "arabicName",
    label: "ArabicName",
    icon: ShieldIcon,
    filterType: "text",
    placeholder: "ArabicNamePlaceholder",
  },
  {
    key: "permissions",
    label: "Permissions",
    icon: ShieldIcon,
    filterType: "multiselect",
    placeholder: "PermissionsPlaceholder",
    options: Object.values(Permission).map((permission) => ({
      label: `Permissions.${permission}`,
      value: permission,
    })),
  },
  {
    key: "createdAt",
    label: "CreatedAt",
    icon: CalendarIcon,
    filterType: "date",
    placeholder: "PickADate",
  },
  {
    key: "updatedAt",
    label: "UpdatedAt",
    icon: CalendarIcon,
    filterType: "date",
    placeholder: "PickADate",
  },
  {
    key: "deletedAt",
    label: "DeletedAt",
    icon: CalendarIcon,
    filterType: "date",
    placeholder: "PickADate",
  },
];

// Filter Sections
export const ROLE_FILTER_SECTIONS: FilterSectionDefinition[] = [
  {
    title: "BasicFilters",
    fields: ROLE_FILTER_FIELDS.filter((field) =>
      ["name", "kurdishName", "arabicName", "permissions"].includes(field.key)
    ),
  },
  {
    title: "DateFilters",
    fields: ROLE_FILTER_FIELDS.filter((field) =>
      ["createdAt", "updatedAt", "deletedAt"].includes(field.key)
    ),
  },
];

// View Field Definitions
export const ROLE_VIEW_FIELDS: ViewFieldDefinition[] = [
  {
    key: "name",
    label: "Name",
    icon: ShieldIcon,
    viewType: "text",
  },
  {
    key: "kurdishName",
    label: "KurdishName",
    icon: ShieldIcon,
    viewType: "text",
  },
  {
    key: "arabicName",
    label: "ArabicName",
    icon: ShieldIcon,
    viewType: "text",
  },
  {
    key: "permissions",
    label: "Permissions",
    icon: ShieldIcon,
    viewType: "list",
  },
  {
    key: "createdAt",
    label: "CreatedAt",
    icon: Clock,
    viewType: "date",
  },
  {
    key: "updatedAt",
    label: "UpdatedAt",
    icon: Clock,
    viewType: "date",
  },
];

// View Sections
export const ROLE_VIEW_SECTIONS: ViewSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: ROLE_VIEW_FIELDS.filter((field) =>
      ["name", "kurdishName", "arabicName"].includes(field.key)
    ),
  },

  {
    title: "ActivityInformation",
    fields: ROLE_VIEW_FIELDS.filter((field) =>
      ["createdAt", "updatedAt"].includes(field.key)
    ),
  },
];

// Add this utility function at the end of the file
export const getRoleTranslations = (
  t: (key: string) => string,
  tValidation: (key: string) => string,
  tFields: (key: string) => string
): TranslationFunctions => ({
  Roles: t,
  Validation: tValidation,
  Fields: tFields,
});
