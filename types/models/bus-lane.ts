import { Permission, Prisma } from "@prisma/client";
import {
  Route as RouteIcon,
  Map as MapIcon,
  Info,
  Edit,
  Trash2,
  Palette,
  LineChart,
  ToggleLeft,
  Layers,
  Image as ImageIcon,
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
  pathSchema,
  uuidSchema,
  positiveIntSchema,
  percentageSchema,
} from "./shared-schemas";
import { CoordinateTuple } from "@/types/map";

// Response Types
export type BusLaneResponse = ResponseWithRelations<BusLaneWithRelations>;
export type BusLanesResponse =
  PaginatedResponseWithRelations<BusLaneWithRelations>;

// Prisma Types
export type BusLaneWithRelations = Prisma.BusLaneGetPayload<{
  include: {
    name: true;
    description: true;
    images: true;
    stops: true;
    routes: {
      include: {
        name: true;
      };
    };
    service: {
      include: {
        name: true;
      };
    };
  };
}>;

// Schema Definitions
const laneDraftStopSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  name: z.string().max(120).optional(),
});

const baseBusLaneSchema = z
  .object({
    nameFields: languageFieldsSchema,
    descriptionFields: descriptionFieldsSchema.optional(),
    path: pathSchema,
    color: hexColorSchema.default("#0066CC"),
    weight: positiveIntSchema.min(1).max(20).default(5),
    opacity: percentageSchema.default(0.8),
    images: z.array(z.any()).optional(),
    stopIds: z.array(uuidSchema).optional(),
    routeIds: z.array(uuidSchema).optional(),
    serviceId: uuidSchema.nullable().optional(),
    isActive: z.boolean().default(true),
  })
  .extend({
    draftStops: z.array(laneDraftStopSchema).optional(),
  });

export const busLaneSchema = baseModelSchema.extend(baseBusLaneSchema.shape);
export const createBusLaneSchema = baseBusLaneSchema;
export const updateBusLaneSchema = baseBusLaneSchema.partial().extend({
  id: uuidSchema,
});
export const deleteBusLaneSchema = z.object({
  id: uuidSchema,
});

// Schema Types
export type CreateBusLaneData = z.infer<typeof createBusLaneSchema>;
export type UpdateBusLaneData = z.infer<typeof updateBusLaneSchema>;
export type DeleteBusLaneData = z.infer<typeof deleteBusLaneSchema>;
export type LaneDraftStopInput = z.infer<typeof laneDraftStopSchema>;

// Map Editor Types
export interface MapEditorLaneDraft {
  id?: string; // Optional ID for editing existing lanes
  path: CoordinateTuple[];
  color?: string;
  weight?: number;
  opacity?: number;
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
  routeIds?: string[];
  draftStops?: Array<{
    latitude: number;
    longitude: number;
    name?: string;
  }>;
  isActive?: boolean;
}

export interface CreateBusLanesMapEditorData {
  lanes: MapEditorLaneDraft[];
}

export interface UpdateBusLanesMapEditorData {
  lanes: Array<{
    id: string;
    path?: CoordinateTuple[];
    color?: string;
    weight?: number;
    opacity?: number;
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
    routeIds?: string[];
    isActive?: boolean;
  }>;
}

// Map Editor Zod Schemas
export const mapEditorLaneDraftSchema = z.object({
  path: z.array(z.tuple([z.number(), z.number()])).min(2),
  color: hexColorSchema.optional(),
  weight: positiveIntSchema.min(1).max(20).optional(),
  opacity: percentageSchema.optional(),
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
  routeIds: z.array(uuidSchema).optional(),
  draftStops: z
    .array(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        name: z.string().max(120).optional(),
      })
    )
    .optional(),
  isActive: z.boolean().optional(),
});

export const createBusLanesMapEditorSchema = z.object({
  lanes: z.array(mapEditorLaneDraftSchema).min(1),
});

export const updateBusLanesMapEditorSchema = z.object({
  lanes: z
    .array(
      z.object({
        id: uuidSchema,
        path: z
          .array(z.tuple([z.number(), z.number()]))
          .min(2)
          .optional(),
        color: hexColorSchema.optional(),
        weight: positiveIntSchema.min(1).max(20).optional(),
        opacity: percentageSchema.optional(),
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
        routeIds: z.array(uuidSchema).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .min(1),
});

// Filter Types
export interface BusLaneFilterParams extends FilterParams {
  serviceId?: string;
  isActive?: boolean;
}

export interface BusLaneTableSearchParams
  extends BusLaneFilterParams,
    SearchParams {}

// Field Configurations
export const busLaneFieldConfigs: Record<string, FieldConfig> = {
  serviceId: { type: "string" },
  color: { type: "string" },
  isActive: { type: "boolean" },
};

// Form Props
export type BusLaneFormProps<T extends CreateBusLaneData | UpdateBusLaneData> =
  BaseFormProps<T>;

export const BUS_LANE_FORM_PATHS = {
  nameFields: "nameFields",
  descriptionFields: "descriptionFields",
  path: "path",
  color: "color",
  weight: "weight",
  opacity: "opacity",
  images: "images",
  stopIds: "stopIds",
  routeIds: "routeIds",
  serviceId: "serviceId",
  isActive: "isActive",
} as const;

export type BusLaneFormPath = keyof typeof BUS_LANE_FORM_PATHS;

// Dialog Props
export interface BusLaneDialogProps extends BaseDialogProps {
  lane?: BusLaneWithRelations | null;
}

export type ViewBusLaneDialogProps = BaseDialogProps & {
  data: BusLaneWithRelations;
};
export type CreateBusLaneDialogProps = BaseDialogProps;
export type UpdateBusLaneDialogProps = BaseDialogProps & {
  data: BusLaneWithRelations;
};

// Action Buttons
export type BusLaneActionButton = BaseActionButton<BusLaneWithRelations>;
export type BusLaneActionHandlers = BaseActionHandlers<BusLaneWithRelations>;

export const BUS_LANE_ACTION_BUTTONS: BusLaneActionButton[] = [
  {
    icon: Info,
    tooltip: "ViewBusLane",
    ...BASE_BUTTON_STYLES.view,
    onClick: (lane, handlers) => {
      handlers.setSelectedItem?.(lane);
      handlers.setIsViewDialogOpen?.(true);
    },
    requiresPermission: false,
  },
  {
    icon: Edit,
    tooltip: "UpdateBusLane",
    ...BASE_BUTTON_STYLES.edit,
    onClick: (lane, handlers) => handlers.handleOpenUpdateDialog?.(lane),
    requiresPermission: Permission.UPDATE_BUS_LANE,
  },
  {
    icon: Trash2,
    tooltip: "DeleteBusLane",
    ...BASE_BUTTON_STYLES.delete,
    onClick: (lane, handlers) => handlers.handleDelete?.(lane.id),
    requiresPermission: Permission.DELETE_BUS_LANE,
  },
];

// Form Fields
export const BUS_LANE_FORM_FIELDS: FormFieldDefinition[] = [
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
    key: "path",
    label: "Path",
    icon: MapIcon,
    type: "map-path",
  },
  {
    key: "color",
    label: "Color",
    icon: Palette,
    type: "color",
  },
  {
    key: "weight",
    label: "Weight",
    icon: LineChart,
    type: "number",
  },
  {
    key: "opacity",
    label: "Opacity",
    icon: LineChart,
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
    key: "stopIds",
    label: "Stops",
    icon: Layers,
    type: "relation",
    isOptional: true,
  },
  {
    key: "routeIds",
    label: "Routes",
    icon: RouteIcon,
    type: "relation",
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
    key: "isActive",
    label: "IsActive",
    icon: ToggleLeft,
    type: "boolean",
  },
];

export const BUS_LANE_FORM_SECTIONS: FormSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: BUS_LANE_FORM_FIELDS.filter((field) =>
      ["nameFields", "descriptionFields", "path", "color"].includes(field.key)
    ),
  },
  {
    title: "Display",
    fields: BUS_LANE_FORM_FIELDS.filter((field) =>
      ["weight", "opacity", "images", "isActive"].includes(field.key)
    ),
  },
  {
    title: "Relations",
    fields: BUS_LANE_FORM_FIELDS.filter((field) =>
      ["stopIds", "routeIds", "serviceId"].includes(field.key)
    ),
  },
];

export const BUS_LANE_FILTER_FIELDS: FilterFieldDefinition[] = [
  {
    key: "serviceId",
    label: "TransportService",
    icon: RouteIcon,
    filterType: "relation",
  },
  {
    key: "isActive",
    label: "IsActive",
    icon: ToggleLeft,
    filterType: "boolean",
  },
];

export const BUS_LANE_FILTER_SECTIONS: FilterSectionDefinition[] = [
  {
    title: "BasicFilters",
    fields: BUS_LANE_FILTER_FIELDS,
  },
];

export const BUS_LANE_VIEW_FIELDS: ViewFieldDefinition[] = [
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
    key: "weight",
    label: "Weight",
    icon: LineChart,
    viewType: "number",
  },
  {
    key: "opacity",
    label: "Opacity",
    icon: LineChart,
    viewType: "number",
  },
  {
    key: "isActive",
    label: "IsActive",
    icon: ToggleLeft,
    viewType: "boolean",
  },
];

export const BUS_LANE_VIEW_SECTIONS: ViewSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: BUS_LANE_VIEW_FIELDS,
  },
];

export const getBusLaneTranslations = (
  t: (key: string) => string,
  tValidation: (key: string) => string,
  tFields: (key: string) => string
): TranslationFunctions => ({
  BusLanes: t,
  Validation: tValidation,
  Fields: tFields,
});
