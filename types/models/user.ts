import { UserType, Prisma, Permission } from "@prisma/client";
import {
  Info,
  Edit,
  Trash2,
  User as UserIcon,
  Lock,
  AtSign,
  CalendarIcon,
  Clock,
  ShieldIcon,
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
} from "./common";
import { TranslationFunctions } from "./common";

// NextAuth Types
declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    username: string;
    userType: UserType;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    roleId: string | null;
    lastLoginDateAndTime: Date | null;
    lastLoginIp: string | null;
    ipAddresses: string[];
    balance: number;
    bypassOTP: boolean;
    token: string | null;
    role: {
      id: string;
      name: string;
      kurdishName: string | null;
      arabicName: string | null;
      permissions: Permission[];
    } | null;
  }

  interface Session {
    user: User;
  }
}

// Response Types
export type UserResponse = ResponseWithRelations<UserWithRelations>;
export type UsersResponse = PaginatedResponseWithRelations<UserWithRelations>;

// Base User Type without relations
export interface BaseUser {
  id: string;
  name: string;
  username: string;
  password: string;
  userType: UserType;
  lastLoginDateAndTime: Date | null;
  lastLoginIp: string | null;
  ipAddresses: string[];
  roleId: string | null;
  balance: number;
  bypassOTP: boolean;
  token: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Role Type
export interface Role {
  id: string;
  name: string;
  kurdishName: string | null;
  arabicName: string | null;
  permissions: Permission[];
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Prisma Types
export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    role: true;
    auditLogs: true;
    orders: true;
  };
}>;

// Add this type at the top of the file
export interface ValidationMessage {
  key: string;
  field: string;
}

// Schema Definitions
const baseUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name|Validation.Errors.TooShort")
    .max(100, "Name|Validation.Errors.TooLong"),
  username: z
    .string()
    .min(3, "Username|Validation.Errors.TooShort")
    .max(50, "Username|Validation.Errors.TooLong"),
  userType: z.nativeEnum(UserType),
  lastLoginDateAndTime: z
    .union([
      z.date(),
      z.string().transform((val) => (val ? new Date(val) : null)),
    ])
    .nullable(),
  lastLoginIp: z.string().nullable(),
  ipAddresses: z.array(z.string()).default([]),
  roleId: z.string().nullable().optional(),
  balance: z.number().default(0),
  bypassOTP: z.boolean().default(true),
});

export const userSchema = baseModelSchema.extend({
  ...baseUserSchema.shape,
  role: z
    .object({
      id: z.string(),
      name: z.string(),
      kurdishName: z.string().nullable(),
      arabicName: z.string().nullable(),
      permissions: z.array(z.nativeEnum(Permission)),
      deletedAt: z
        .union([
          z.date(),
          z.string().transform((val) => (val ? new Date(val) : null)),
        ])
        .nullable(),
      createdAt: z.union([
        z.date(),
        z.string().transform((val) => new Date(val)),
      ]),
      updatedAt: z.union([
        z.date(),
        z.string().transform((val) => new Date(val)),
      ]),
    })
    .nullable(),
  auditLogs: z.array(z.any()),
  orders: z.array(z.any()),
});

export const createUserSchema = z.object({
  name: z
    .string()
    .min(3, "Name|Validation.Errors.TooShort")
    .max(50, "Name|Validation.Errors.TooLong"),
  username: z
    .string()
    .min(3, "Username|Validation.Errors.TooShort")
    .max(50, "Username|Validation.Errors.TooLong"),
  password: z.string(),
  userType: z.nativeEnum(UserType),
  roleId: z.string().nullable(),
  balance: z.number().default(0),
  bypassOTP: z.boolean().default(true),
});

export const updateUserSchema = userSchema.partial().extend({
  id: z.string().uuid("Id|Validation.Errors.InvalidUuid"),
  password: z.string().optional().or(z.literal("")),
});

export const deleteUserSchema = z.object({
  id: z.string().uuid("Id|Users.Errors.InvalidUuid"),
});

// Schema Types
export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
export type DeleteUserData = z.infer<typeof deleteUserSchema>;

// Filter Types
export interface UserFilterParams extends FilterParams {
  name?: string;
  username?: string;
  userType?: UserType | UserType[];
  roleId?: string | null;
}

export interface UserTableSearchParams extends UserFilterParams, SearchParams {}

// Field Configurations
export const userFieldConfigs: Record<string, FieldConfig> = {
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
  username: {
    type: "string",
    maxLength: 50,
    searchable: true,
    operator: "contains",
    mode: "insensitive",
    filters: {
      customOperators: ["contains", "equals"],
      operator: "contains",
      mode: "insensitive",
    },
  },
  userType: {
    ...ENUM_FILTER_CONFIG,
    type: "enum",
    options: Object.values(UserType),
  },
  roleId: {
    type: "relation",
    searchable: true,
    filters: {
      operator: "equals",
    },
  },
};

// Form Props
export type UserFormProps<T extends CreateUserData | UpdateUserData> =
  BaseFormProps<T>;

// Form Field Types
export type UserFormFields = keyof CreateUserData;

// Form field paths
export const USER_FORM_PATHS = {
  roleId: "roleId",
  name: "name",
  username: "username",
  password: "password",
  userType: "userType",
  balance: "balance",
  bypassOTP: "bypassOTP",
} as const;

export type UserFormPath = keyof typeof USER_FORM_PATHS;

// Common form field values
export const USER_FORM_FIELD_VALUES = {
  roleId: "roleId",
} as const;

// Dialog Props
export interface UserDialogProps extends BaseDialogProps {
  user?: UserWithRelations | null;
}

export type ViewUserDialogProps = BaseDialogProps & { data: UserWithRelations };
export type CreateUserDialogProps = BaseDialogProps & {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};
export type UpdateUserDialogProps = BaseDialogProps & {
  data: UserWithRelations;
};

// Action Types
export type UserActionButton = BaseActionButton<UserWithRelations>;
export type UserActionHandlers = BaseActionHandlers<UserWithRelations>;

export const USER_ACTION_BUTTONS: UserActionButton[] = [
  {
    icon: Info,
    tooltip: "ViewDetails",
    ...BASE_BUTTON_STYLES.view,
    onClick: (user, handlers) => {
      handlers.setSelectedItem?.(user);
      handlers.setIsViewDialogOpen?.(true);
    },
    requiresPermission: false,
  },
  {
    icon: Edit,
    tooltip: "UpdateUser",
    ...BASE_BUTTON_STYLES.edit,
    onClick: (user, handlers) => handlers.handleOpenUpdateDialog?.(user),
    requiresPermission: "UPDATE_USER",
  },
  {
    icon: Trash2,
    tooltip: "Delete",
    ...BASE_BUTTON_STYLES.delete,
    onClick: (user, handlers) => handlers.handleDelete?.(user.id),
    requiresPermission: "DELETE_USER",
  },
];

// Form Field Definitions
export const USER_FORM_FIELDS: FormFieldDefinition[] = [
  {
    key: "name",
    label: "FullName",
    icon: AtSign,
    placeholder: "FullNamePlaceholder",
  },
  {
    key: "username",
    label: "Username",
    icon: UserIcon,
    placeholder: "UsernamePlaceholder",
  },
  {
    key: "password",
    label: "Password",
    icon: Lock,
    type: "password",
    placeholder: "PasswordPlaceholder",
  },
];

// Form Sections
export const USER_FORM_SECTIONS: FormSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: USER_FORM_FIELDS.filter((field) =>
      ["name", "username", "password"].includes(field.key)
    ),
  },
];

// Filter Field Definitions
export const USER_FILTER_FIELDS: FilterFieldDefinition[] = [
  {
    key: "name",
    label: "Name",
    icon: AtSign,
    filterType: "text",
    placeholder: "NamePlaceholder",
  },
  {
    key: "username",
    label: "Username",
    icon: UserIcon,
    filterType: "text",
    placeholder: "UsernamePlaceholder",
  },
  {
    key: "userType",
    label: "UserType",
    icon: ShieldIcon,
    filterType: "select",
    placeholder: "UserTypePlaceholder",
    options: Object.values(UserType).map((type) => ({
      label: `UserTypes.${type}`,
      value: type,
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
export const USER_FILTER_SECTIONS: FilterSectionDefinition[] = [
  {
    title: "BasicFilters",
    fields: USER_FILTER_FIELDS.filter((field) =>
      ["search", "name", "username", "userType"].includes(field.key)
    ),
  },
  {
    title: "DateFilters",
    fields: USER_FILTER_FIELDS.filter((field) =>
      ["createdAt", "updatedAt", "deletedAt"].includes(field.key)
    ),
  },
];

// View Field Definitions
export const USER_VIEW_FIELDS: ViewFieldDefinition[] = [
  {
    key: "name",
    label: "Name",
    icon: AtSign,
    viewType: "text",
  },
  {
    key: "username",
    label: "Username",
    icon: UserIcon,
    viewType: "copyable",
  },
  {
    key: "userType",
    label: "UserType",
    icon: ShieldIcon,
    viewType: "text",
  },
  {
    key: "role",
    label: "Role",
    icon: ShieldIcon,
    viewType: "text",
    formatValue: (value: unknown) => {
      const role = value as { name?: string } | null;
      return role?.name ?? "NoRole";
    },
  },
  {
    key: "permissions",
    label: "Permissions",
    icon: ShieldIcon,
    viewType: "list",
    formatValue: (value: unknown) => {
      const role = value as { permissions?: string[] } | null;
      return role?.permissions ?? [];
    },
  },
  {
    key: "lastLoginDateAndTime",
    label: "LastLogin",
    icon: Clock,
    viewType: "date",
  },
  {
    key: "lastLoginIp",
    label: "LastLoginIp",
    icon: Info,
    viewType: "text",
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
export const USER_VIEW_SECTIONS: ViewSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: USER_VIEW_FIELDS.filter((field) =>
      ["name", "username", "userType"].includes(field.key)
    ),
  },
  {
    title: "RoleInformation",
    fields: USER_VIEW_FIELDS.filter((field) =>
      ["role", "permissions"].includes(field.key)
    ),
  },
  {
    title: "ActivityInformation",
    fields: USER_VIEW_FIELDS.filter((field) =>
      [
        "lastLoginDateAndTime",
        "lastLoginIp",
        "createdAt",
        "updatedAt",
      ].includes(field.key)
    ),
  },
];

// Add this utility function at the end of the file
export const getUserTranslations = (
  t: (key: string) => string,
  tValidation: (key: string) => string,
  tFields: (key: string) => string
): TranslationFunctions => ({
  Users: t,
  Validation: tValidation,
  Fields: tFields,
});
