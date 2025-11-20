import { Permission, Prisma, DayOfWeek } from "@prisma/client";
import {
  Calendar,
  Clock,
  Info,
  Edit,
  Trash2,
  ToggleLeft,
  Route as RouteIcon,
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
import { uuidSchema, timeStringSchema } from "./shared-schemas";

// Response Types
export type BusScheduleResponse =
  ResponseWithRelations<BusScheduleWithRelations>;
export type BusSchedulesResponse =
  PaginatedResponseWithRelations<BusScheduleWithRelations>;

// Prisma Types
export type BusScheduleWithRelations = Prisma.BusScheduleGetPayload<{
  include: {
    route: {
      include: {
        name: true;
      };
    };
    stop: {
      include: {
        name: true;
      };
    };
  };
}>;

// Schema Definitions
const baseBusScheduleSchema = z.object({
  routeId: uuidSchema,
  stopId: uuidSchema,
  departureTime: timeStringSchema,
  dayOfWeek: z.nativeEnum(DayOfWeek),
  specificDate: z.coerce.date().optional(),
  notes: z.string().max(512).optional(),
  isActive: z.boolean().default(true),
});

export const busScheduleSchema = baseModelSchema.extend(
  baseBusScheduleSchema.shape
);
export const createBusScheduleSchema = baseBusScheduleSchema;
export const updateBusScheduleSchema = baseBusScheduleSchema.partial().extend({
  id: uuidSchema,
});
export const deleteBusScheduleSchema = z.object({
  id: uuidSchema,
});

// Schema Types
export type CreateBusScheduleData = z.infer<typeof createBusScheduleSchema>;
export type UpdateBusScheduleData = z.infer<typeof updateBusScheduleSchema>;
export type DeleteBusScheduleData = z.infer<typeof deleteBusScheduleSchema>;

// Filter Types
export interface BusScheduleFilterParams extends FilterParams {
  routeId?: string;
  stopId?: string;
  dayOfWeek?: DayOfWeek | DayOfWeek[];
  isActive?: boolean;
}

export interface BusScheduleTableSearchParams
  extends BusScheduleFilterParams,
    SearchParams {}

// Field Configurations
export const busScheduleFieldConfigs: Record<string, FieldConfig> = {
  routeId: { type: "string" },
  stopId: { type: "string" },
  dayOfWeek: {
    ...ENUM_FILTER_CONFIG,
    type: "enum",
    options: Object.values(DayOfWeek),
  },
  isActive: { type: "boolean" },
};

// Form Props
export type BusScheduleFormProps<
  T extends CreateBusScheduleData | UpdateBusScheduleData,
> = BaseFormProps<T>;

export const BUS_SCHEDULE_FORM_PATHS = {
  routeId: "routeId",
  stopId: "stopId",
  departureTime: "departureTime",
  dayOfWeek: "dayOfWeek",
  specificDate: "specificDate",
  notes: "notes",
  isActive: "isActive",
} as const;

export type BusScheduleFormPath = keyof typeof BUS_SCHEDULE_FORM_PATHS;

// Dialog Props
export interface BusScheduleDialogProps extends BaseDialogProps {
  schedule?: BusScheduleWithRelations | null;
}

export type ViewBusScheduleDialogProps = BaseDialogProps & {
  data: BusScheduleWithRelations;
};
export type CreateBusScheduleDialogProps = BaseDialogProps;
export type UpdateBusScheduleDialogProps = BaseDialogProps & {
  data: BusScheduleWithRelations;
};

// Action Buttons
export type BusScheduleActionButton =
  BaseActionButton<BusScheduleWithRelations>;
export type BusScheduleActionHandlers =
  BaseActionHandlers<BusScheduleWithRelations>;

export const BUS_SCHEDULE_ACTION_BUTTONS: BusScheduleActionButton[] = [
  {
    icon: Info,
    tooltip: "ViewBusSchedule",
    ...BASE_BUTTON_STYLES.view,
    onClick: (schedule, handlers) => {
      handlers.setSelectedItem?.(schedule);
      handlers.setIsViewDialogOpen?.(true);
    },
    requiresPermission: false,
  },
  {
    icon: Edit,
    tooltip: "UpdateBusSchedule",
    ...BASE_BUTTON_STYLES.edit,
    onClick: (schedule, handlers) =>
      handlers.handleOpenUpdateDialog?.(schedule),
    requiresPermission: Permission.UPDATE_BUS_SCHEDULE,
  },
  {
    icon: Trash2,
    tooltip: "DeleteBusSchedule",
    ...BASE_BUTTON_STYLES.delete,
    onClick: (schedule, handlers) => handlers.handleDelete?.(schedule.id),
    requiresPermission: Permission.DELETE_BUS_SCHEDULE,
  },
];

// Form Fields
export const BUS_SCHEDULE_FORM_FIELDS: FormFieldDefinition[] = [
  {
    key: "routeId",
    label: "Route",
    icon: RouteIcon,
    type: "relation",
  },
  {
    key: "stopId",
    label: "Stop",
    icon: MapPin,
    type: "relation",
  },
  {
    key: "departureTime",
    label: "DepartureTime",
    icon: Clock,
    type: "time",
  },
  {
    key: "dayOfWeek",
    label: "DayOfWeek",
    icon: Calendar,
    type: "select",
    options: Object.values(DayOfWeek).map((value) => ({
      label: `DayOfWeek.${value}`,
      value,
    })),
  },
  {
    key: "specificDate",
    label: "SpecificDate",
    icon: Calendar,
    type: "date",
    isOptional: true,
  },
  {
    key: "notes",
    label: "Notes",
    icon: FileText,
    type: "textarea",
    isOptional: true,
  },
  {
    key: "isActive",
    label: "IsActive",
    icon: ToggleLeft,
    type: "boolean",
  },
];

export const BUS_SCHEDULE_FORM_SECTIONS: FormSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: BUS_SCHEDULE_FORM_FIELDS,
  },
];

export const BUS_SCHEDULE_FILTER_FIELDS: FilterFieldDefinition[] = [
  {
    key: "routeId",
    label: "Route",
    icon: RouteIcon,
    filterType: "relation",
  },
  {
    key: "stopId",
    label: "Stop",
    icon: MapPin,
    filterType: "relation",
  },
  {
    key: "dayOfWeek",
    label: "DayOfWeek",
    icon: Calendar,
    filterType: "select",
    options: Object.values(DayOfWeek).map((value) => ({
      label: `DayOfWeek.${value}`,
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

export const BUS_SCHEDULE_FILTER_SECTIONS: FilterSectionDefinition[] = [
  {
    title: "BasicFilters",
    fields: BUS_SCHEDULE_FILTER_FIELDS,
  },
];

export const BUS_SCHEDULE_VIEW_FIELDS: ViewFieldDefinition[] = [
  {
    key: "route",
    label: "Route",
    icon: RouteIcon,
    viewType: "text",
  },
  {
    key: "stop",
    label: "Stop",
    icon: MapPin,
    viewType: "text",
  },
  {
    key: "departureTime",
    label: "DepartureTime",
    icon: Clock,
    viewType: "text",
  },
  {
    key: "dayOfWeek",
    label: "DayOfWeek",
    icon: Calendar,
    viewType: "badge",
    formatValue: (value) => `DayOfWeek.${value as string}`,
  },
  {
    key: "specificDate",
    label: "SpecificDate",
    icon: Calendar,
    viewType: "date",
  },
  {
    key: "notes",
    label: "Notes",
    icon: FileText,
    viewType: "text",
  },
  {
    key: "isActive",
    label: "IsActive",
    icon: ToggleLeft,
    viewType: "boolean",
  },
];

export const BUS_SCHEDULE_VIEW_SECTIONS: ViewSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: BUS_SCHEDULE_VIEW_FIELDS,
  },
];

export const getBusScheduleTranslations = (
  t: (key: string) => string,
  tValidation: (key: string) => string,
  tFields: (key: string) => string
): TranslationFunctions => ({
  BusSchedules: t,
  Validation: tValidation,
  Fields: tFields,
});
