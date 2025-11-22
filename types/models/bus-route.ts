import { Permission, Prisma, RouteDirection, Currency } from "@prisma/client";
import {
  Route as RouteIcon,
  Info,
  Edit,
  Trash2,
  Hash,
  Clock,
  DollarSign,
  ToggleLeft,
  Layers,
  MapPin,
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
import {
  languageFieldsSchema,
  descriptionFieldsSchema,
  uuidSchema,
  positiveIntSchema,
} from "./shared-schemas";

// Response Types
export type BusRouteResponse = ResponseWithRelations<BusRouteWithRelations>;
export type BusRoutesResponse =
  PaginatedResponseWithRelations<BusRouteWithRelations>;

// Prisma Types
export type BusRouteWithRelations = Prisma.BusRouteGetPayload<{
  include: {
    name: true;
    description: true;
    service: true;
    lanes: {
      include: {
        name: true;
      };
    };
    stops: {
      include: {
        name: true;
      };
    };
    schedules: true;
  };
}>;

// Schema Definitions
const baseBusRouteSchema = z.object({
  nameFields: languageFieldsSchema,
  descriptionFields: descriptionFieldsSchema.optional(),
  serviceId: uuidSchema.nullable().optional(),
  routeNumber: z.string().max(50).optional(),
  direction: z.nativeEnum(RouteDirection).default(RouteDirection.BIDIRECTIONAL),
  fare: z.number().min(0).optional(),
  currency: z.nativeEnum(Currency).default(Currency.IQD),
  frequency: positiveIntSchema.optional(),
  duration: positiveIntSchema.optional(),
  laneIds: z.array(uuidSchema).optional(),
  stopIds: z.array(uuidSchema).optional(),
  isActive: z.boolean().default(true),
});

export const busRouteSchema = baseModelSchema.extend(baseBusRouteSchema.shape);
export const createBusRouteSchema = baseBusRouteSchema;
export const updateBusRouteSchema = baseBusRouteSchema.partial().extend({
  id: uuidSchema,
});
export const deleteBusRouteSchema = z.object({
  id: uuidSchema,
});

// Schema Types
export type CreateBusRouteData = z.infer<typeof createBusRouteSchema>;
export type UpdateBusRouteData = z.infer<typeof updateBusRouteSchema>;
export type DeleteBusRouteData = z.infer<typeof deleteBusRouteSchema>;

// Map Editor Types
export interface MapEditorRouteDraft {
  name?: {
    en: string;
    ar?: string | null;
    ckb?: string | null;
  };
  description?: {
    en?: string | null;
    ar?: string | null;
    ckb?: string | null;
  };
  serviceId?: string | null;
  routeNumber?: string;
  direction?: RouteDirection;
  fare?: number;
  currency?: Currency;
  frequency?: number;
  duration?: number;
  laneIds?: string[];
  stopIds?: string[];
  isActive?: boolean;
}

export interface CreateBusRoutesMapEditorData {
  routes: MapEditorRouteDraft[];
}

export interface UpdateBusRoutesMapEditorData {
  routes: Array<{
    id: string;
    nameFields?: {
      en: string;
      ar?: string | null;
      ckb?: string | null;
    };
    descriptionFields?: {
      en?: string | null;
      ar?: string | null;
      ckb?: string | null;
    };
    serviceId?: string | null;
    routeNumber?: string;
    direction?: RouteDirection;
    fare?: number;
    currency?: Currency;
    frequency?: number;
    duration?: number;
    laneIds?: string[];
    stopIds?: string[];
    isActive?: boolean;
  }>;
}

// Map Editor Zod Schemas
export const mapEditorRouteDraftSchema = z.object({
  name: z
    .object({
      en: z.string().min(1),
      ar: z.string().nullable().optional(),
      ckb: z.string().nullable().optional(),
    })
    .optional(),
  description: z
    .object({
      en: z.string().nullable().optional(),
      ar: z.string().nullable().optional(),
      ckb: z.string().nullable().optional(),
    })
    .optional(),
  serviceId: uuidSchema.nullable().optional(),
  routeNumber: z.string().max(50).optional(),
  direction: z.nativeEnum(RouteDirection).optional(),
  fare: z.number().min(0).optional(),
  currency: z.nativeEnum(Currency).optional(),
  frequency: positiveIntSchema.optional(),
  duration: positiveIntSchema.optional(),
  laneIds: z.array(uuidSchema).optional(),
  stopIds: z.array(uuidSchema).optional(),
  isActive: z.boolean().optional(),
});

export const createBusRoutesMapEditorSchema = z.object({
  routes: z.array(mapEditorRouteDraftSchema).min(1),
});

export const updateBusRoutesMapEditorSchema = z.object({
  routes: z
    .array(
      z.object({
        id: uuidSchema,
        nameFields: z
          .object({
            en: z.string().min(1),
            ar: z.string().nullable().optional(),
            ckb: z.string().nullable().optional(),
          })
          .optional(),
        descriptionFields: z
          .object({
            en: z.string().nullable().optional(),
            ar: z.string().nullable().optional(),
            ckb: z.string().nullable().optional(),
          })
          .optional(),
        serviceId: uuidSchema.nullable().optional(),
        routeNumber: z.string().max(50).optional(),
        direction: z.nativeEnum(RouteDirection).optional(),
        fare: z.number().min(0).optional(),
        currency: z.nativeEnum(Currency).optional(),
        frequency: positiveIntSchema.optional(),
        duration: positiveIntSchema.optional(),
        laneIds: z.array(uuidSchema).optional(),
        stopIds: z.array(uuidSchema).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .min(1),
});

// Filter Types
export interface BusRouteFilterParams extends FilterParams {
  serviceId?: string;
  direction?: RouteDirection | RouteDirection[];
  isActive?: boolean;
}

export interface BusRouteTableSearchParams
  extends BusRouteFilterParams,
    SearchParams {}

// Field Configurations
export const busRouteFieldConfigs: Record<string, FieldConfig> = {
  serviceId: { type: "string" },
  routeNumber: {
    type: "string",
    searchable: true,
    operator: "contains",
    mode: "insensitive",
  },
  direction: {
    ...ENUM_FILTER_CONFIG,
    type: "enum",
    options: Object.values(RouteDirection),
  },
  isActive: { type: "boolean" },
};

// Form Props
export type BusRouteFormProps<
  T extends CreateBusRouteData | UpdateBusRouteData,
> = BaseFormProps<T>;

export const BUS_ROUTE_FORM_PATHS = {
  nameFields: "nameFields",
  descriptionFields: "descriptionFields",
  serviceId: "serviceId",
  routeNumber: "routeNumber",
  direction: "direction",
  fare: "fare",
  currency: "currency",
  frequency: "frequency",
  duration: "duration",
  laneIds: "laneIds",
  stopIds: "stopIds",
  isActive: "isActive",
} as const;

export type BusRouteFormPath = keyof typeof BUS_ROUTE_FORM_PATHS;

// Dialog Props
export interface BusRouteDialogProps extends BaseDialogProps {
  route?: BusRouteWithRelations | null;
}

export type ViewBusRouteDialogProps = BaseDialogProps & {
  data: BusRouteWithRelations;
};
export type CreateBusRouteDialogProps = BaseDialogProps;
export type UpdateBusRouteDialogProps = BaseDialogProps & {
  data: BusRouteWithRelations;
};

// Action Buttons
export type BusRouteActionButton = BaseActionButton<BusRouteWithRelations>;
export type BusRouteActionHandlers = BaseActionHandlers<BusRouteWithRelations>;

export const BUS_ROUTE_ACTION_BUTTONS: BusRouteActionButton[] = [
  {
    icon: Info,
    tooltip: "ViewBusRoute",
    ...BASE_BUTTON_STYLES.view,
    onClick: (route, handlers) => {
      handlers.setSelectedItem?.(route);
      handlers.setIsViewDialogOpen?.(true);
    },
    requiresPermission: false,
  },
  {
    icon: Edit,
    tooltip: "UpdateBusRoute",
    ...BASE_BUTTON_STYLES.edit,
    onClick: (route, handlers) => handlers.handleOpenUpdateDialog?.(route),
    requiresPermission: Permission.UPDATE_BUS_ROUTE,
  },
  {
    icon: Trash2,
    tooltip: "DeleteBusRoute",
    ...BASE_BUTTON_STYLES.delete,
    onClick: (route, handlers) => handlers.handleDelete?.(route.id),
    requiresPermission: Permission.DELETE_BUS_ROUTE,
  },
];

// Form Fields
export const BUS_ROUTE_FORM_FIELDS: FormFieldDefinition[] = [
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
    key: "serviceId",
    label: "TransportService",
    icon: RouteIcon,
    type: "relation",
    isOptional: true,
  },
  {
    key: "routeNumber",
    label: "RouteNumber",
    icon: Hash,
    type: "text",
    isOptional: true,
  },
  {
    key: "direction",
    label: "Direction",
    icon: RouteIcon,
    type: "select",
    options: Object.values(RouteDirection).map((value) => ({
      label: `RouteDirection.${value}`,
      value,
    })),
  },
  {
    key: "fare",
    label: "Fare",
    icon: DollarSign,
    type: "number",
    isOptional: true,
  },
  {
    key: "currency",
    label: "Currency",
    icon: DollarSign,
    type: "select",
    options: Object.values(Currency).map((value) => ({
      label: `Currency.${value}`,
      value,
    })),
  },
  {
    key: "frequency",
    label: "FrequencyMinutes",
    icon: Clock,
    type: "number",
    isOptional: true,
  },
  {
    key: "duration",
    label: "DurationMinutes",
    icon: Clock,
    type: "number",
    isOptional: true,
  },
  {
    key: "laneIds",
    label: "Lanes",
    icon: Layers,
    type: "relation",
    isOptional: true,
  },
  {
    key: "stopIds",
    label: "Stops",
    icon: MapPin,
    type: "relation",
    isOptional: true,
  },
  {
    key: "isActive",
    label: "IsActive",
    icon: ToggleLeft,
    type: "boolean",
  },
];

export const BUS_ROUTE_FORM_SECTIONS: FormSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: BUS_ROUTE_FORM_FIELDS.filter((field) =>
      ["nameFields", "descriptionFields", "serviceId", "routeNumber"].includes(
        field.key
      )
    ),
  },
  {
    title: "OperationalDetails",
    fields: BUS_ROUTE_FORM_FIELDS.filter((field) =>
      [
        "direction",
        "fare",
        "currency",
        "frequency",
        "duration",
        "isActive",
      ].includes(field.key)
    ),
  },
  {
    title: "Relations",
    fields: BUS_ROUTE_FORM_FIELDS.filter((field) =>
      ["laneIds", "stopIds"].includes(field.key)
    ),
  },
];

export const BUS_ROUTE_FILTER_FIELDS: FilterFieldDefinition[] = [
  {
    key: "serviceId",
    label: "TransportService",
    icon: RouteIcon,
    filterType: "relation",
  },
  {
    key: "direction",
    label: "Direction",
    icon: RouteIcon,
    filterType: "select",
    options: Object.values(RouteDirection).map((value) => ({
      label: `RouteDirection.${value}`,
      value,
    })),
  },
  {
    key: "isActive",
    label: "IsActive",
    icon: ToggleLeft,
    filterType: "boolean",
  },
];

export const BUS_ROUTE_FILTER_SECTIONS: FilterSectionDefinition[] = [
  {
    title: "BasicFilters",
    fields: BUS_ROUTE_FILTER_FIELDS,
  },
];

export const BUS_ROUTE_VIEW_FIELDS: ViewFieldDefinition[] = [
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
    key: "routeNumber",
    label: "RouteNumber",
    icon: Hash,
    viewType: "text",
  },
  {
    key: "direction",
    label: "Direction",
    icon: RouteIcon,
    viewType: "badge",
    formatValue: (value) => `RouteDirection.${value as string}`,
  },
  {
    key: "fare",
    label: "Fare",
    icon: DollarSign,
    viewType: "number",
  },
  {
    key: "currency",
    label: "Currency",
    icon: DollarSign,
    viewType: "badge",
    formatValue: (value) => `Currency.${value as string}`,
  },
  {
    key: "frequency",
    label: "FrequencyMinutes",
    icon: Clock,
    viewType: "number",
  },
  {
    key: "duration",
    label: "DurationMinutes",
    icon: Clock,
    viewType: "number",
  },
  {
    key: "isActive",
    label: "IsActive",
    icon: ToggleLeft,
    viewType: "boolean",
  },
];

export const BUS_ROUTE_VIEW_SECTIONS: ViewSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: BUS_ROUTE_VIEW_FIELDS,
  },
];

export const getBusRouteTranslations = (
  t: (key: string) => string,
  tValidation: (key: string) => string,
  tFields: (key: string) => string
): TranslationFunctions => ({
  BusRoutes: t,
  Validation: tValidation,
  Fields: tFields,
});
