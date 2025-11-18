import { Permission, Prisma } from "@prisma/client";
import {
  MapPin,
  Map,
  Image as ImageIcon,
  Info,
  Edit,
  Trash2,
  Layers,
  Navigation,
  CheckSquare,
  Hash,
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
  uuidSchema,
  positiveIntSchema,
} from "./shared-schemas";

// Response Types
export type BusStopResponse = ResponseWithRelations<BusStopWithRelations>;
export type BusStopsResponse =
  PaginatedResponseWithRelations<BusStopWithRelations>;

// Prisma Types
export type BusStopWithRelations = Prisma.BusStopGetPayload<{
  include: {
    name: true;
    description: true;
    images: true;
    icon: {
      include: {
        file: true;
        name: true;
      };
    };
    zone: {
      include: {
        name: true;
      };
    };
    lanes: true;
    routes: true;
    schedules: true;
  };
}>;

// Schema Definitions
const coordinateSchema = z
  .number()
  .refine(
    (value) => value >= -180 && value <= 180,
    "Coordinate|Validation.Errors.Range"
  );

const baseBusStopSchema = z.object({
  nameFields: languageFieldsSchema,
  descriptionFields: descriptionFieldsSchema.optional(),
  latitude: z
    .number()
    .min(-90, "Latitude|Validation.Errors.Min")
    .max(90, "Latitude|Validation.Errors.Max"),
  longitude: coordinateSchema,
  images: z.array(z.any()).optional(),
  laneIds: z.array(uuidSchema).optional(),
  routeIds: z.array(uuidSchema).optional(),
  iconId: uuidSchema.nullable().optional(),
  zoneId: uuidSchema.nullable().optional(),
  hasShelter: z.boolean().default(false),
  hasBench: z.boolean().default(false),
  hasLighting: z.boolean().default(false),
  isAccessible: z.boolean().default(false),
  hasRealTimeInfo: z.boolean().default(false),
  order: positiveIntSchema.optional(),
  isActive: z.boolean().default(true),
});

export const busStopSchema = baseModelSchema.extend(baseBusStopSchema.shape);
export const createBusStopSchema = baseBusStopSchema;
export const updateBusStopSchema = baseBusStopSchema.partial().extend({
  id: uuidSchema,
});
export const deleteBusStopSchema = z.object({
  id: uuidSchema,
});

// Schema Types
export type CreateBusStopData = z.infer<typeof createBusStopSchema>;
export type UpdateBusStopData = z.infer<typeof updateBusStopSchema>;
export type DeleteBusStopData = z.infer<typeof deleteBusStopSchema>;

// Filter Types
export interface BusStopFilterParams extends FilterParams {
  zoneId?: string;
  hasShelter?: boolean;
  hasRealTimeInfo?: boolean;
}

export interface BusStopTableSearchParams
  extends BusStopFilterParams,
    SearchParams {}

// Field Configurations
export const busStopFieldConfigs: Record<string, FieldConfig> = {
  latitude: {
    type: "number",
    filters: { range: true },
  },
  longitude: {
    type: "number",
    filters: { range: true },
  },
  zoneId: {
    type: "string",
  },
  hasShelter: { type: "boolean" },
  hasBench: { type: "boolean" },
  hasLighting: { type: "boolean" },
  isAccessible: { type: "boolean" },
  hasRealTimeInfo: { type: "boolean" },
};

// Form Props
export type BusStopFormProps<T extends CreateBusStopData | UpdateBusStopData> =
  BaseFormProps<T>;

export const BUS_STOP_FORM_PATHS = {
  nameFields: "nameFields",
  descriptionFields: "descriptionFields",
  latitude: "latitude",
  longitude: "longitude",
  images: "images",
  iconId: "iconId",
  zoneId: "zoneId",
  hasShelter: "hasShelter",
  hasBench: "hasBench",
  hasLighting: "hasLighting",
  isAccessible: "isAccessible",
  hasRealTimeInfo: "hasRealTimeInfo",
  order: "order",
  isActive: "isActive",
} as const;

export type BusStopFormPath = keyof typeof BUS_STOP_FORM_PATHS;

// Dialog Props
export interface BusStopDialogProps extends BaseDialogProps {
  stop?: BusStopWithRelations | null;
}

export type ViewBusStopDialogProps = BaseDialogProps & {
  data: BusStopWithRelations;
};
export type CreateBusStopDialogProps = BaseDialogProps;
export type UpdateBusStopDialogProps = BaseDialogProps & {
  data: BusStopWithRelations;
};

// Action Buttons
export type BusStopActionButton = BaseActionButton<BusStopWithRelations>;
export type BusStopActionHandlers = BaseActionHandlers<BusStopWithRelations>;

export const BUS_STOP_ACTION_BUTTONS: BusStopActionButton[] = [
  {
    icon: Info,
    tooltip: "ViewBusStop",
    ...BASE_BUTTON_STYLES.view,
    onClick: (stop, handlers) => {
      handlers.setSelectedItem?.(stop);
      handlers.setIsViewDialogOpen?.(true);
    },
    requiresPermission: false,
  },
  {
    icon: Edit,
    tooltip: "UpdateBusStop",
    ...BASE_BUTTON_STYLES.edit,
    onClick: (stop, handlers) => handlers.handleOpenUpdateDialog?.(stop),
    requiresPermission: Permission.UPDATE_BUS_STOP,
  },
  {
    icon: Trash2,
    tooltip: "DeleteBusStop",
    ...BASE_BUTTON_STYLES.delete,
    onClick: (stop, handlers) => handlers.handleDelete?.(stop.id),
    requiresPermission: Permission.DELETE_BUS_STOP,
  },
];

// Form Fields
export const BUS_STOP_FORM_FIELDS: FormFieldDefinition[] = [
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
    key: "latitude",
    label: "Latitude",
    icon: MapPin,
    type: "number",
  },
  {
    key: "longitude",
    label: "Longitude",
    icon: MapPin,
    type: "number",
  },
  {
    key: "images",
    label: "Images",
    icon: ImageIcon,
    type: "file",
    isOptional: true,
  },
  {
    key: "iconId",
    label: "MapIcon",
    icon: Map,
    type: "relation",
    isOptional: true,
  },
  {
    key: "zoneId",
    label: "Zone",
    icon: Layers,
    type: "relation",
    isOptional: true,
  },
  {
    key: "hasShelter",
    label: "HasShelter",
    icon: CheckSquare,
    type: "boolean",
  },
  {
    key: "hasBench",
    label: "HasBench",
    icon: CheckSquare,
    type: "boolean",
  },
  {
    key: "hasLighting",
    label: "HasLighting",
    icon: CheckSquare,
    type: "boolean",
  },
  {
    key: "isAccessible",
    label: "IsAccessible",
    icon: Navigation,
    type: "boolean",
  },
  {
    key: "hasRealTimeInfo",
    label: "HasRealTimeInfo",
    icon: ToggleLeft,
    type: "boolean",
  },
  {
    key: "order",
    label: "DisplayOrder",
    icon: Hash,
    type: "number",
    isOptional: true,
  },
  {
    key: "isActive",
    label: "IsActive",
    icon: ToggleLeft,
    type: "boolean",
  },
];

export const BUS_STOP_FORM_SECTIONS: FormSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: BUS_STOP_FORM_FIELDS.filter((field) =>
      ["nameFields", "descriptionFields", "latitude", "longitude"].includes(
        field.key
      )
    ),
  },
  {
    title: "MediaAndRelations",
    fields: BUS_STOP_FORM_FIELDS.filter((field) =>
      ["images", "iconId", "zoneId"].includes(field.key)
    ),
  },
  {
    title: "Amenities",
    fields: BUS_STOP_FORM_FIELDS.filter((field) =>
      [
        "hasShelter",
        "hasBench",
        "hasLighting",
        "isAccessible",
        "hasRealTimeInfo",
        "order",
        "isActive",
      ].includes(field.key)
    ),
  },
];

export const BUS_STOP_FILTER_FIELDS: FilterFieldDefinition[] = [
  {
    key: "zoneId",
    label: "Zone",
    icon: Layers,
    filterType: "relation",
  },
  {
    key: "hasShelter",
    label: "HasShelter",
    icon: CheckSquare,
    filterType: "boolean",
  },
  {
    key: "isAccessible",
    label: "IsAccessible",
    icon: Navigation,
    filterType: "boolean",
  },
  {
    key: "hasRealTimeInfo",
    label: "HasRealTimeInfo",
    icon: ToggleLeft,
    filterType: "boolean",
  },
];

export const BUS_STOP_FILTER_SECTIONS: FilterSectionDefinition[] = [
  {
    title: "BasicFilters",
    fields: BUS_STOP_FILTER_FIELDS,
  },
];

export const BUS_STOP_VIEW_FIELDS: ViewFieldDefinition[] = [
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
    key: "latitude",
    label: "Latitude",
    icon: MapPin,
    viewType: "number",
  },
  {
    key: "longitude",
    label: "Longitude",
    icon: MapPin,
    viewType: "number",
  },
  {
    key: "hasShelter",
    label: "HasShelter",
    icon: CheckSquare,
    viewType: "boolean",
  },
  {
    key: "isAccessible",
    label: "IsAccessible",
    icon: Navigation,
    viewType: "boolean",
  },
  {
    key: "isActive",
    label: "IsActive",
    icon: ToggleLeft,
    viewType: "boolean",
  },
];

export const BUS_STOP_VIEW_SECTIONS: ViewSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: BUS_STOP_VIEW_FIELDS,
  },
];

export const getBusStopTranslations = (
  t: (key: string) => string,
  tValidation: (key: string) => string,
  tFields: (key: string) => string
): TranslationFunctions => ({
  BusStops: t,
  Validation: tValidation,
  Fields: tFields,
});
