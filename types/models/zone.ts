import { Permission, Prisma } from "@prisma/client";
import {
  Palette,
  Info,
  Edit,
  Trash2,
  ToggleLeft,
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
import {
  languageFieldsSchema,
  descriptionFieldsSchema,
  hexColorSchema,
  uuidSchema,
} from "./shared-schemas";

// Response Types
export type ZoneResponse = ResponseWithRelations<ZoneWithRelations>;
export type ZonesResponse = PaginatedResponseWithRelations<ZoneWithRelations>;

// Prisma Types
export type ZoneWithRelations = Prisma.ZoneGetPayload<{
  include: {
    name: true;
    description: true;
    stops: true;
  };
}>;

// Schema Definitions
const baseZoneSchema = z.object({
  nameFields: languageFieldsSchema,
  descriptionFields: descriptionFieldsSchema.optional(),
  color: hexColorSchema.default("#FF6B6B"),
  isActive: z.boolean().default(true),
});

export const zoneSchema = baseModelSchema.extend(baseZoneSchema.shape);
export const createZoneSchema = baseZoneSchema;
export const updateZoneSchema = baseZoneSchema.partial().extend({
  id: uuidSchema,
});
export const deleteZoneSchema = z.object({
  id: uuidSchema,
});

// Schema Types
export type CreateZoneData = z.infer<typeof createZoneSchema>;
export type UpdateZoneData = z.infer<typeof updateZoneSchema>;
export type DeleteZoneData = z.infer<typeof deleteZoneSchema>;

// Filter Types
export interface ZoneFilterParams extends FilterParams {
  isActive?: boolean;
  color?: string;
}

export interface ZoneTableSearchParams extends ZoneFilterParams, SearchParams {}

// Field Configurations
export const zoneFieldConfigs: Record<string, FieldConfig> = {
  color: { type: "string" },
  isActive: { type: "boolean" },
};

export type ZoneFormProps<T extends CreateZoneData | UpdateZoneData> =
  BaseFormProps<T>;

export const ZONE_FORM_PATHS = {
  nameFields: "nameFields",
  descriptionFields: "descriptionFields",
  color: "color",
  isActive: "isActive",
} as const;

export type ZoneFormPath = keyof typeof ZONE_FORM_PATHS;

// Dialog Props
export interface ZoneDialogProps extends BaseDialogProps {
  zone?: ZoneWithRelations | null;
}

export type ViewZoneDialogProps = BaseDialogProps & {
  data: ZoneWithRelations;
};
export type CreateZoneDialogProps = BaseDialogProps;
export type UpdateZoneDialogProps = BaseDialogProps & {
  data: ZoneWithRelations;
};

// Action Buttons
export type ZoneActionButton = BaseActionButton<ZoneWithRelations>;
export type ZoneActionHandlers = BaseActionHandlers<ZoneWithRelations>;

export const ZONE_ACTION_BUTTONS: ZoneActionButton[] = [
  {
    icon: Info,
    tooltip: "ViewZone",
    ...BASE_BUTTON_STYLES.view,
    onClick: (zone, handlers) => {
      handlers.setSelectedItem?.(zone);
      handlers.setIsViewDialogOpen?.(true);
    },
    requiresPermission: false,
  },
  {
    icon: Edit,
    tooltip: "UpdateZone",
    ...BASE_BUTTON_STYLES.edit,
    onClick: (zone, handlers) => handlers.handleOpenUpdateDialog?.(zone),
    requiresPermission: Permission.UPDATE_ZONE,
  },
  {
    icon: Trash2,
    tooltip: "DeleteZone",
    ...BASE_BUTTON_STYLES.delete,
    onClick: (zone, handlers) => handlers.handleDelete?.(zone.id),
    requiresPermission: Permission.DELETE_ZONE,
  },
];

export const ZONE_FORM_FIELDS: FormFieldDefinition[] = [
  {
    key: "nameFields",
    label: "Name",
    icon: FileText,
    type: "language",
  },
  {
    key: "descriptionFields",
    label: "Description",
    icon: FileText,
    type: "language",
    isOptional: true,
  },
  {
    key: "color",
    label: "Color",
    icon: Palette,
    type: "color",
  },
  {
    key: "isActive",
    label: "IsActive",
    icon: ToggleLeft,
    type: "boolean",
  },
];

export const ZONE_FORM_SECTIONS: FormSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: ZONE_FORM_FIELDS,
  },
];

export const ZONE_FILTER_FIELDS: FilterFieldDefinition[] = [
  {
    key: "isActive",
    label: "IsActive",
    icon: ToggleLeft,
    filterType: "boolean",
  },
];

export const ZONE_FILTER_SECTIONS: FilterSectionDefinition[] = [
  {
    title: "BasicFilters",
    fields: ZONE_FILTER_FIELDS,
  },
];

export const ZONE_VIEW_FIELDS: ViewFieldDefinition[] = [
  {
    key: "name",
    label: "Name",
    icon: FileText,
    viewType: "text",
  },
  {
    key: "description",
    label: "Description",
    icon: FileText,
    viewType: "text",
  },
  {
    key: "color",
    label: "Color",
    icon: Palette,
    viewType: "color",
  },
  {
    key: "isActive",
    label: "IsActive",
    icon: ToggleLeft,
    viewType: "boolean",
  },
];

export const ZONE_VIEW_SECTIONS: ViewSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: ZONE_VIEW_FIELDS,
  },
];

export const getZoneTranslations = (
  t: (key: string) => string,
  tValidation: (key: string) => string,
  tFields: (key: string) => string
): TranslationFunctions => ({
  Zones: t,
  Validation: tValidation,
  Fields: tFields,
});
