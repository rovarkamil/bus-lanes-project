import { Permission, Prisma } from "@prisma/client";
import {
  Image as ImageIcon,
  Info,
  Edit,
  Trash2,
  Move,
  Crosshair,
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
  positiveIntSchema,
  uuidSchema,
} from "./shared-schemas";

// Response Types
export type MapIconResponse = ResponseWithRelations<MapIconWithRelations>;
export type MapIconsResponse =
  PaginatedResponseWithRelations<MapIconWithRelations>;

// Prisma Types
export type MapIconWithRelations = Prisma.MapIconGetPayload<{
  include: {
    name: true;
    description: true;
    file: true;
    transportServices: true;
    busStops: true;
  };
}>;

// Schema Definitions
const baseAnchorSchema = positiveIntSchema.max(512);

const baseMapIconSchema = z.object({
  nameFields: languageFieldsSchema,
  descriptionFields: descriptionFieldsSchema.optional(),
  file: z.any(),
  iconSize: positiveIntSchema.min(16).max(128).default(32),
  iconAnchorX: baseAnchorSchema.default(16),
  iconAnchorY: baseAnchorSchema.default(32),
  popupAnchorX: z.number().min(-512).max(512).default(0),
  popupAnchorY: z.number().min(-512).max(512).default(-32),
  isActive: z.boolean().default(true),
});

export const mapIconSchema = baseModelSchema.extend(baseMapIconSchema.shape);
export const createMapIconSchema = baseMapIconSchema;
export const updateMapIconSchema = baseMapIconSchema.partial().extend({
  id: uuidSchema,
});
export const deleteMapIconSchema = z.object({
  id: uuidSchema,
});

// Schema Types
export type CreateMapIconData = z.infer<typeof createMapIconSchema>;
export type UpdateMapIconData = z.infer<typeof updateMapIconSchema>;
export type DeleteMapIconData = z.infer<typeof deleteMapIconSchema>;

// Filter Types
export interface MapIconFilterParams extends FilterParams {
  isActive?: boolean;
  iconSize?: number;
}

export interface MapIconTableSearchParams
  extends MapIconFilterParams,
    SearchParams {}

// Field Configurations
export const mapIconFieldConfigs: Record<string, FieldConfig> = {
  isActive: { type: "boolean" },
  iconSize: {
    type: "number",
    filters: { range: true },
  },
};

// Form Props
export type MapIconFormProps<T extends CreateMapIconData | UpdateMapIconData> =
  BaseFormProps<T>;

export const MAP_ICON_FORM_PATHS = {
  nameFields: "nameFields",
  descriptionFields: "descriptionFields",
  file: "file",
  iconSize: "iconSize",
  iconAnchorX: "iconAnchorX",
  iconAnchorY: "iconAnchorY",
  popupAnchorX: "popupAnchorX",
  popupAnchorY: "popupAnchorY",
  isActive: "isActive",
} as const;

export type MapIconFormPath = keyof typeof MAP_ICON_FORM_PATHS;

// Dialog Props
export interface MapIconDialogProps extends BaseDialogProps {
  icon?: MapIconWithRelations | null;
}

export type ViewMapIconDialogProps = BaseDialogProps & {
  data: MapIconWithRelations;
};
export type CreateMapIconDialogProps = BaseDialogProps;
export type UpdateMapIconDialogProps = BaseDialogProps & {
  data: MapIconWithRelations;
};

// Action Buttons
export type MapIconActionButton = BaseActionButton<MapIconWithRelations>;
export type MapIconActionHandlers = BaseActionHandlers<MapIconWithRelations>;

export const MAP_ICON_ACTION_BUTTONS: MapIconActionButton[] = [
  {
    icon: Info,
    tooltip: "ViewMapIcon",
    ...BASE_BUTTON_STYLES.view,
    onClick: (icon, handlers) => {
      handlers.setSelectedItem?.(icon);
      handlers.setIsViewDialogOpen?.(true);
    },
    requiresPermission: false,
  },
  {
    icon: Edit,
    tooltip: "UpdateMapIcon",
    ...BASE_BUTTON_STYLES.edit,
    onClick: (icon, handlers) => handlers.handleOpenUpdateDialog?.(icon),
    requiresPermission: Permission.UPDATE_MAP_ICON,
  },
  {
    icon: Trash2,
    tooltip: "DeleteMapIcon",
    ...BASE_BUTTON_STYLES.delete,
    onClick: (icon, handlers) => handlers.handleDelete?.(icon.id),
    requiresPermission: Permission.DELETE_MAP_ICON,
  },
];

// Form Fields
export const MAP_ICON_FORM_FIELDS: FormFieldDefinition[] = [
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
    key: "file",
    label: "File",
    icon: ImageIcon,
    type: "file",
  },
  {
    key: "iconSize",
    label: "IconSize",
    icon: Move,
    type: "number",
  },
  {
    key: "iconAnchorX",
    label: "IconAnchorX",
    icon: Crosshair,
    type: "number",
  },
  {
    key: "iconAnchorY",
    label: "IconAnchorY",
    icon: Crosshair,
    type: "number",
  },
  {
    key: "popupAnchorX",
    label: "PopupAnchorX",
    icon: Crosshair,
    type: "number",
  },
  {
    key: "popupAnchorY",
    label: "PopupAnchorY",
    icon: Crosshair,
    type: "number",
  },
  {
    key: "isActive",
    label: "IsActive",
    icon: ToggleLeft,
    type: "boolean",
  },
];

export const MAP_ICON_FORM_SECTIONS: FormSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: MAP_ICON_FORM_FIELDS.filter((field) =>
      ["nameFields", "descriptionFields", "file"].includes(field.key)
    ),
  },
  {
    title: "AnchorConfiguration",
    fields: MAP_ICON_FORM_FIELDS.filter((field) =>
      [
        "iconSize",
        "iconAnchorX",
        "iconAnchorY",
        "popupAnchorX",
        "popupAnchorY",
        "isActive",
      ].includes(field.key)
    ),
  },
];

export const MAP_ICON_FILTER_FIELDS: FilterFieldDefinition[] = [
  {
    key: "isActive",
    label: "IsActive",
    icon: ToggleLeft,
    filterType: "boolean",
  },
  {
    key: "iconSize",
    label: "IconSize",
    icon: Move,
    filterType: "number",
  },
];

export const MAP_ICON_FILTER_SECTIONS: FilterSectionDefinition[] = [
  {
    title: "BasicFilters",
    fields: MAP_ICON_FILTER_FIELDS,
  },
];

export const MAP_ICON_VIEW_FIELDS: ViewFieldDefinition[] = [
  {
    key: "name",
    label: "Name",
    icon: FileText,
    type: "language",
    viewType: "text",
  },
  {
    key: "description",
    label: "Description",
    icon: FileText,
    type: "language",
    viewType: "text",
  },
  {
    key: "file",
    label: "File",
    icon: ImageIcon,
    type: "file",
    viewType: "image",
  },
  {
    key: "iconSize",
    label: "IconSize",
    icon: Move,
    type: "number",
    viewType: "number",
  },
  {
    key: "isActive",
    label: "IsActive",
    icon: ToggleLeft,
    type: "boolean",
    viewType: "boolean",
  },
];

export const MAP_ICON_VIEW_SECTIONS: ViewSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: MAP_ICON_VIEW_FIELDS,
  },
];

export const getMapIconTranslations = (
  t: (key: string) => string,
  tValidation: (key: string) => string,
  tFields: (key: string) => string
): TranslationFunctions => ({
  MapIcons: t,
  Validation: tValidation,
  Fields: tFields,
});
