import { SettingType, Prisma } from "@prisma/client";
import {
  Info,
  Edit,
  Trash2,
  CalendarIcon,
  Clock,
  Key,
  Type,
  FileText,
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
export type SettingResponse = ResponseWithRelations<SettingWithRelations>;
export type SettingsResponse =
  PaginatedResponseWithRelations<SettingWithRelations>;

// Base Setting Type without relations
export interface BaseSetting {
  id: string;
  key: string;
  value: string;
  type: SettingType;
  isLocked: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Prisma Types
export type SettingWithRelations = Prisma.SettingGetPayload<{
  select: {
    id: true;
    key: true;
    value: true;
    type: true;
    isLocked: true;
    deletedAt: true;
    createdAt: true;
    updatedAt: true;
  };
}>;

// Schema Definitions
const baseSettingSchema = z.object({
  key: z
    .string()
    .min(2, "Key|Validation.Errors.TooShort")
    .max(100, "Key|Validation.Errors.TooLong"),
  value: z.string(),
  type: z.nativeEnum(SettingType),
  isLocked: z.boolean(),
});

export const settingSchema = baseModelSchema.extend({
  ...baseSettingSchema.shape,
});

export const createSettingSchema = z.object({
  key: z
    .string()
    .min(2, "Key|Validation.Errors.TooShort")
    .max(100, "Key|Validation.Errors.TooLong"),
  value: z.string(),
  type: z.nativeEnum(SettingType),
});

export const updateSettingSchema = settingSchema.partial().extend({
  id: z.string().uuid("Id|Validation.Errors.InvalidUuid"),
});

export const deleteSettingSchema = z.object({
  id: z.string().uuid("Id|Settings.Errors.InvalidUuid"),
});

// Schema Types
export type CreateSettingData = z.infer<typeof createSettingSchema>;
export type UpdateSettingData = z.infer<typeof updateSettingSchema>;
export type DeleteSettingData = z.infer<typeof deleteSettingSchema>;

// Filter Types
export interface SettingFilterParams extends FilterParams {
  key?: string;
  type?: SettingType | SettingType[];
}

export interface SettingTableSearchParams
  extends SettingFilterParams,
    SearchParams {}

// Field Configurations
export const settingFieldConfigs: Record<string, FieldConfig> = {
  key: {
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
  type: {
    ...ENUM_FILTER_CONFIG,
    type: "enum",
    options: Object.values(SettingType),
  },
};

// Form Props
export type SettingFormProps<T extends CreateSettingData | UpdateSettingData> =
  BaseFormProps<T>;

// Form Field Types
export type SettingFormFields = keyof CreateSettingData;

// Form field paths
export const SETTING_FORM_PATHS = {
  key: "key",
  value: "value",
  type: "type",
} as const;

export type SettingFormPath = keyof typeof SETTING_FORM_PATHS;

// Dialog Props
export interface SettingDialogProps extends BaseDialogProps {
  setting?: SettingWithRelations | null;
}

export type ViewSettingDialogProps = BaseDialogProps & {
  data: SettingWithRelations;
};
export type CreateSettingDialogProps = BaseDialogProps & {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};
export type UpdateSettingDialogProps = BaseDialogProps & {
  data: SettingWithRelations;
};

// Action Types
export type SettingActionButton = BaseActionButton<SettingWithRelations>;
export type SettingActionHandlers = BaseActionHandlers<SettingWithRelations>;

export const SETTING_ACTION_BUTTONS: SettingActionButton[] = [
  {
    icon: Info,
    tooltip: "ViewDetails",
    ...BASE_BUTTON_STYLES.view,
    onClick: (setting, handlers) => {
      handlers.setSelectedItem?.(setting);
      handlers.setIsViewDialogOpen?.(true);
    },
    requiresPermission: false,
  },
  {
    icon: Edit,
    tooltip: "UpdateSetting",
    ...BASE_BUTTON_STYLES.edit,
    onClick: (setting, handlers) => handlers.handleOpenUpdateDialog?.(setting),
    requiresPermission: "UPDATE_SETTINGS",
  },
  {
    icon: Trash2,
    tooltip: "Delete",
    ...BASE_BUTTON_STYLES.delete,
    onClick: (setting, handlers) => handlers.handleDelete?.(setting.id),
    requiresPermission: "UPDATE_SETTINGS",
  },
];

// Form Field Definitions
export const SETTING_FORM_FIELDS: FormFieldDefinition[] = [
  {
    key: "key",
    label: "Key",
    icon: Key,
    placeholder: "KeyPlaceholder",
  },
  {
    key: "value",
    label: "Value",
    icon: FileText,
    placeholder: "ValuePlaceholder",
  },
  {
    key: "type",
    label: "Type",
    icon: Type,
    placeholder: "TypePlaceholder",
  },
];

// Form Sections
export const SETTING_FORM_SECTIONS: FormSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: SETTING_FORM_FIELDS,
  },
];

// Filter Field Definitions
export const SETTING_FILTER_FIELDS: FilterFieldDefinition[] = [
  {
    key: "key",
    label: "Key",
    icon: Key,
    filterType: "text",
    placeholder: "KeyPlaceholder",
  },
  {
    key: "type",
    label: "Type",
    icon: Type,
    filterType: "select",
    placeholder: "TypePlaceholder",
    options: Object.values(SettingType).map((type) => ({
      label: `SettingTypes.${type}`,
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
export const SETTING_FILTER_SECTIONS: FilterSectionDefinition[] = [
  {
    title: "BasicFilters",
    fields: SETTING_FILTER_FIELDS.filter((field) =>
      ["search", "key", "type"].includes(field.key)
    ),
  },
  {
    title: "DateFilters",
    fields: SETTING_FILTER_FIELDS.filter((field) =>
      ["createdAt", "updatedAt", "deletedAt"].includes(field.key)
    ),
  },
];

// View Field Definitions
export const SETTING_VIEW_FIELDS: ViewFieldDefinition[] = [
  {
    key: "key",
    label: "Key",
    icon: Key,
    viewType: "text",
  },
  {
    key: "value",
    label: "Value",
    icon: FileText,
    viewType: "text",
  },
  {
    key: "type",
    label: "Type",
    icon: Type,
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
export const SETTING_VIEW_SECTIONS: ViewSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: SETTING_VIEW_FIELDS.filter((field) =>
      ["key", "value", "type"].includes(field.key)
    ),
  },
  {
    title: "ActivityInformation",
    fields: SETTING_VIEW_FIELDS.filter((field) =>
      ["createdAt", "updatedAt"].includes(field.key)
    ),
  },
];

// Translation utility function
export const getSettingTranslations = (
  t: (key: string) => string,
  tValidation: (key: string) => string,
  tFields: (key: string) => string
): TranslationFunctions => ({
  Settings: t,
  Validation: tValidation,
  Fields: tFields,
});
