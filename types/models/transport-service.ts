import { Permission, Prisma, TransportServiceType } from "@prisma/client";
import {
  Bus,
  Info,
  Edit,
  Trash2,
  Palette,
  Gauge as GaugeIcon,
  Clock,
  CircleDot,
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
  hexColorSchema,
  timeStringSchema,
  uuidSchema,
  positiveIntSchema,
} from "./shared-schemas";

// Response Types
export type TransportServiceResponse =
  ResponseWithRelations<TransportServiceWithRelations>;
export type TransportServicesResponse =
  PaginatedResponseWithRelations<TransportServiceWithRelations>;

// Prisma Types
export type TransportServiceWithRelations = Prisma.TransportServiceGetPayload<{
  include: {
    name: true;
    description: true;
    icon: {
      include: {
        file: true;
        name: true;
      };
    };
    routes: true;
    lanes: true;
  };
}>;

// Schema Definitions
const languageSchema = languageFieldsSchema;

const baseTransportServiceSchema = z.object({
  nameFields: languageSchema,
  descriptionFields: descriptionFieldsSchema.optional(),
  type: z.nativeEnum(TransportServiceType).default(TransportServiceType.BUS),
  color: hexColorSchema.default("#0066CC"),
  iconId: uuidSchema.nullable().optional(),
  capacity: positiveIntSchema
    .max(500, "Capacity|Validation.Errors.Max")
    .optional(),
  operatingFrom: timeStringSchema.optional(),
  operatingTo: timeStringSchema.optional(),
  isActive: z.boolean().default(true),
});

export const transportServiceSchema = baseModelSchema.extend(
  baseTransportServiceSchema.shape
);
export const createTransportServiceSchema = baseTransportServiceSchema;
export const updateTransportServiceSchema = baseTransportServiceSchema
  .partial()
  .extend({
    id: uuidSchema,
  });
export const deleteTransportServiceSchema = z.object({
  id: uuidSchema,
});

// Schema Types
export type CreateTransportServiceData = z.infer<
  typeof createTransportServiceSchema
>;
export type UpdateTransportServiceData = z.infer<
  typeof updateTransportServiceSchema
>;
export type DeleteTransportServiceData = z.infer<
  typeof deleteTransportServiceSchema
>;

// Filter Types
export interface TransportServiceFilterParams extends FilterParams {
  name?: string;
  type?: TransportServiceType | TransportServiceType[];
  isActive?: boolean;
  capacity?: number;
}

export interface TransportServiceTableSearchParams
  extends TransportServiceFilterParams,
    SearchParams {}

// Field Configurations
export const transportServiceFieldConfigs: Record<string, FieldConfig> = {
  name: {
    type: "string",
    searchable: true,
    operator: "contains",
    mode: "insensitive",
  },
  type: {
    ...ENUM_FILTER_CONFIG,
    type: "enum",
    options: Object.values(TransportServiceType),
  },
  isActive: {
    type: "boolean",
  },
  capacity: {
    type: "number",
    filters: {
      range: true,
    },
  },
};

// Form Props
export type TransportServiceFormProps<
  T extends CreateTransportServiceData | UpdateTransportServiceData,
> = BaseFormProps<T>;

// Form field paths
export const TRANSPORT_SERVICE_FORM_PATHS = {
  nameFields: "nameFields",
  descriptionFields: "descriptionFields",
  type: "type",
  color: "color",
  iconId: "iconId",
  capacity: "capacity",
  operatingFrom: "operatingFrom",
  operatingTo: "operatingTo",
  isActive: "isActive",
} as const;

export type TransportServiceFormPath =
  keyof typeof TRANSPORT_SERVICE_FORM_PATHS;

// Dialog Props
export interface TransportServiceDialogProps extends BaseDialogProps {
  service?: TransportServiceWithRelations | null;
}

export type ViewTransportServiceDialogProps = BaseDialogProps & {
  data: TransportServiceWithRelations;
};
export type CreateTransportServiceDialogProps = BaseDialogProps;
export type UpdateTransportServiceDialogProps = BaseDialogProps & {
  data: TransportServiceWithRelations;
};

// Action Types
export type TransportServiceActionButton =
  BaseActionButton<TransportServiceWithRelations>;
export type TransportServiceActionHandlers =
  BaseActionHandlers<TransportServiceWithRelations>;

export const TRANSPORT_SERVICE_ACTION_BUTTONS: TransportServiceActionButton[] =
  [
    {
      icon: Info,
      tooltip: "ViewDetails",
      ...BASE_BUTTON_STYLES.view,
      onClick: (service, handlers) => {
        handlers.setSelectedItem?.(service);
        handlers.setIsViewDialogOpen?.(true);
      },
      requiresPermission: false,
    },
    {
      icon: Edit,
      tooltip: "UpdateTransportService",
      ...BASE_BUTTON_STYLES.edit,
      onClick: (service, handlers) =>
        handlers.handleOpenUpdateDialog?.(service),
      requiresPermission: Permission.UPDATE_TRANSPORT_SERVICE,
    },
    {
      icon: Trash2,
      tooltip: "DeleteTransportService",
      ...BASE_BUTTON_STYLES.delete,
      onClick: (service, handlers) => handlers.handleDelete?.(service.id),
      requiresPermission: Permission.DELETE_TRANSPORT_SERVICE,
    },
  ];

// Form Field Definitions
export const TRANSPORT_SERVICE_FORM_FIELDS: FormFieldDefinition[] = [
  {
    key: "nameFields",
    label: "Name",
    icon: Bus,
    type: "language",
  },
  {
    key: "descriptionFields",
    label: "Description",
    icon: CircleDot,
    type: "language",
    isOptional: true,
  },
  {
    key: "type",
    label: "Type",
    icon: Bus,
    type: "select",
    options: Object.values(TransportServiceType).map((value) => ({
      label: `TransportServiceType.${value}`,
      value,
    })),
  },
  {
    key: "color",
    label: "Color",
    icon: Palette,
    type: "color",
  },
  {
    key: "iconId",
    label: "MapIcon",
    icon: CircleDot,
    type: "relation",
  },
  {
    key: "capacity",
    label: "Capacity",
    icon: GaugeIcon,
    type: "number",
    isOptional: true,
  },
  {
    key: "operatingFrom",
    label: "OperatingFrom",
    icon: Clock,
    type: "time",
    isOptional: true,
  },
  {
    key: "operatingTo",
    label: "OperatingTo",
    icon: Clock,
    type: "time",
    isOptional: true,
  },
  {
    key: "isActive",
    label: "IsActive",
    icon: CircleDot,
    type: "boolean",
  },
];

// Form Sections
export const TRANSPORT_SERVICE_FORM_SECTIONS: FormSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: TRANSPORT_SERVICE_FORM_FIELDS.filter((field) =>
      ["nameFields", "descriptionFields", "type", "color", "iconId"].includes(
        field.key
      )
    ),
  },
  {
    title: "OperationalDetails",
    fields: TRANSPORT_SERVICE_FORM_FIELDS.filter((field) =>
      ["capacity", "operatingFrom", "operatingTo", "isActive"].includes(
        field.key
      )
    ),
  },
];

// Filter Field Definitions
export const TRANSPORT_SERVICE_FILTER_FIELDS: FilterFieldDefinition[] = [
  {
    key: "type",
    label: "Type",
    icon: Bus,
    filterType: "select",
    options: Object.values(TransportServiceType).map((value) => ({
      label: `TransportServiceType.${value}`,
      value,
    })),
  },
  {
    key: "isActive",
    label: "IsActive",
    icon: CircleDot,
    filterType: "boolean",
  },
];

// Filter Sections
export const TRANSPORT_SERVICE_FILTER_SECTIONS: FilterSectionDefinition[] = [
  {
    title: "BasicFilters",
    fields: TRANSPORT_SERVICE_FILTER_FIELDS,
  },
];

// View Field Definitions
export const TRANSPORT_SERVICE_VIEW_FIELDS: ViewFieldDefinition[] = [
  {
    key: "name",
    label: "Name",
    icon: Bus,
    viewType: "text",
  },
  {
    key: "description",
    label: "Description",
    icon: CircleDot,
    viewType: "text",
  },
  {
    key: "type",
    label: "Type",
    icon: Bus,
    viewType: "badge",
    formatValue: (value) => `TransportServiceType.${value as string}`,
  },
  {
    key: "color",
    label: "Color",
    icon: Palette,
    viewType: "color",
  },
  {
    key: "capacity",
    label: "Capacity",
    icon: GaugeIcon,
    viewType: "number",
  },
  {
    key: "operatingFrom",
    label: "OperatingFrom",
    icon: Clock,
    viewType: "text",
  },
  {
    key: "operatingTo",
    label: "OperatingTo",
    icon: Clock,
    viewType: "text",
  },
  {
    key: "isActive",
    label: "IsActive",
    icon: CircleDot,
    viewType: "boolean",
  },
];

// View Sections
export const TRANSPORT_SERVICE_VIEW_SECTIONS: ViewSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: TRANSPORT_SERVICE_VIEW_FIELDS.filter((field) =>
      [
        "name",
        "description",
        "type",
        "color",
        "capacity",
        "operatingFrom",
        "operatingTo",
        "isActive",
      ].includes(field.key)
    ),
  },
];

// Translation helper
export const getTransportServiceTranslations = (
  t: (key: string) => string,
  tValidation: (key: string) => string,
  tFields: (key: string) => string
): TranslationFunctions => ({
  TransportServices: t,
  Validation: tValidation,
  Fields: tFields,
});
