// This is an example of how to create a model for a table in the database.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Prisma, Permission, HaircutStyleCategory } from "@prisma/client";
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
  FileText,
  Image,
  Info,
  Edit,
  Trash2,
  Grid,
  ToggleLeft,
} from "lucide-react";

// Response Types
export type GalleryResponse = ResponseWithRelations<GalleryWithRelations>;
export type GalleriesResponse =
  PaginatedResponseWithRelations<GalleryWithRelations>;

// Base Gallery Type without relations
export interface BaseGallery {
  id: string;
  titleId: string;
  descriptionId: string | null;
  category: HaircutStyleCategory;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Prisma Types
export type GalleryWithRelations = Prisma.GalleryGetPayload<{
  include: {
    title: { select: { id: true; en: true; ar: true; ckb: true } };
    description: { select: { id: true; en: true; ar: true; ckb: true } };
    images: {
      select: { id: true; url: true; type: true; name: true; size: true };
    };
  };
}>;

// Schema Definitions
const baseGallerySchema = z.object({
  titleFields: z.object({
    en: z.string(),
    ar: z.string().nullable(),
    ckb: z.string().nullable(),
  }), // this is for the languages models if it has any model for that
  descriptionFields: z
    .object({
      en: z.string(),
      ar: z.string().nullable(),
      ckb: z.string().nullable(),
    })
    .optional(),
  images: z.array(z.any()).optional(), // this is for the images models if it has any model for that
  category: z
    .nativeEnum(HaircutStyleCategory)
    .default(HaircutStyleCategory.HAIRCUTS),
  isActive: z.boolean().default(true),
});

export const gallerySchema = baseModelSchema.extend({
  ...baseGallerySchema.shape,
});

export const createGallerySchema = baseGallerySchema;

export const updateGallerySchema = z.object({
  id: z.string().uuid("Id|Validation.Errors.InvalidUuid"),
  titleFields: z.object({
    en: z.string(),
    ar: z.string().nullable(),
    ckb: z.string().nullable(),
  }),
  descriptionFields: z
    .object({
      en: z.string(),
      ar: z.string().nullable(),
      ckb: z.string().nullable(),
    })
    .optional(),
  images: z.array(z.any()).optional(), // this is for the images models if it has any model for that
  category: z
    .nativeEnum(HaircutStyleCategory)
    .default(HaircutStyleCategory.HAIRCUTS),
  isActive: z.boolean().optional(),
  titleId: z.string().uuid(),
  descriptionId: z.string().uuid().optional(),
});

export const deleteGallerySchema = z.object({
  id: z.string().uuid("Id|Gallery.Errors.InvalidUuid"),
});

// Schema Types
export type CreateGalleryData = z.infer<typeof createGallerySchema>;
export type UpdateGalleryData = z.infer<typeof updateGallerySchema>;
export type DeleteGalleryData = z.infer<typeof deleteGallerySchema>;

// Filter Types
export interface GalleryFilterParams extends FilterParams {
  category?: HaircutStyleCategory | HaircutStyleCategory[];
}

export interface GalleryTableSearchParams
  extends GalleryFilterParams,
    SearchParams {}

// Field Configurations
export const galleryFieldConfigs: Record<string, FieldConfig> = {
  category: {
    ...ENUM_FILTER_CONFIG,
    type: "enum",
    options: Object.values(HaircutStyleCategory),
  },
};

// Form Props
export type GalleryFormProps<T extends CreateGalleryData | UpdateGalleryData> =
  BaseFormProps<T>;

// Form Field Types
export type GalleryFormFields = keyof CreateGalleryData;

// Form field paths
export const GALLERY_FORM_PATHS = {
  titleFields: "titleFields",
  descriptionFields: "descriptionFields",
  file: "file",
  isActive: "isActive",
} as const;

export type GalleryFormPath = keyof typeof GALLERY_FORM_PATHS;

// Dialog Props
export interface GalleryDialogProps extends BaseDialogProps {
  gallery?: GalleryWithRelations | null;
}

export type ViewGalleryDialogProps = BaseDialogProps & {
  data: GalleryWithRelations;
};

export type CreateGalleryDialogProps = BaseDialogProps & {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export type UpdateGalleryDialogProps = BaseDialogProps & {
  data: GalleryWithRelations;
};

// Action Types
export type GalleryActionButton = BaseActionButton<GalleryWithRelations>;
export type GalleryActionHandlers = BaseActionHandlers<GalleryWithRelations>;

export const GALLERY_ACTION_BUTTONS: GalleryActionButton[] = [
  {
    icon: Info,
    tooltip: "ViewDetails",
    ...BASE_BUTTON_STYLES.view,
    onClick: (gallery, handlers) => {
      handlers.setSelectedItem?.(gallery);
      handlers.setIsViewDialogOpen?.(true);
    },
    requiresPermission: false,
  },
  {
    icon: Edit,
    tooltip: "UpdateGallery",
    ...BASE_BUTTON_STYLES.edit,
    onClick: (gallery, handlers) => handlers.handleOpenUpdateDialog?.(gallery),
    requiresPermission: Permission.UPDATE_GALLERY,
  },
  {
    icon: Trash2,
    tooltip: "Delete",
    ...BASE_BUTTON_STYLES.delete,
    onClick: (gallery, handlers) => handlers.handleDelete?.(gallery.id),
    requiresPermission: Permission.DELETE_GALLERY,
  },
];

// Form Field Definitions
export const GALLERY_FORM_FIELDS: FormFieldDefinition[] = [
  {
    key: "titleFields",
    label: "Title",
    icon: FileText,
    type: "language",
    placeholder: "TitlePlaceholder",
  },
  {
    key: "descriptionFields",
    label: "Description",
    icon: FileText,
    type: "language",
    placeholder: "DescriptionPlaceholder",
  },
  {
    key: "file",
    label: "File",
    icon: Image,
    type: "file",
    placeholder: "FilePlaceholder",
  },
  {
    key: "isActive",
    label: "IsActive",
    icon: ToggleLeft,
    type: "boolean",
    placeholder: "IsActivePlaceholder",
  },
];

// Form Sections
export const GALLERY_FORM_SECTIONS: FormSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: GALLERY_FORM_FIELDS.filter((field) =>
      ["titleFields", "descriptionFields", "file", "isActive"].includes(
        field.key
      )
    ),
  },
];

// Filter Field Definitions
export const GALLERY_FILTER_FIELDS: FilterFieldDefinition[] = [
  {
    key: "category",
    label: "Category",
    icon: Grid,
    filterType: "select",
    placeholder: "CategoryPlaceholder",
    options: Object.values(HaircutStyleCategory).map((category) => ({
      label: `HaircutStyleCategory.${category}`,
      value: category,
    })),
  },
];

// Filter Sections
export const GALLERY_FILTER_SECTIONS: FilterSectionDefinition[] = [
  {
    title: "BasicFilters",
    fields: GALLERY_FILTER_FIELDS,
  },
];

// View Field Definitions
export const GALLERY_VIEW_FIELDS: ViewFieldDefinition[] = [
  {
    key: "title",
    label: "Title",
    icon: FileText,
    viewType: "language",
  },
  {
    key: "description",
    label: "Description",
    icon: FileText,
    viewType: "language",
  },
  {
    key: "file",
    label: "File",
    icon: Image,
    viewType: "image",
  },
  {
    key: "isActive",
    label: "IsActive",
    icon: ToggleLeft,
    viewType: "boolean",
  },
];

// View Sections
export const GALLERY_VIEW_SECTIONS: ViewSectionDefinition[] = [
  {
    title: "BasicInformation",
    fields: GALLERY_VIEW_FIELDS.filter((field) =>
      ["title", "description", "file", "isActive"].includes(field.key)
    ),
  },
];

// Add translation utility function
export const getGalleryTranslations = (
  t: (key: string) => string,
  tValidation: (key: string) => string,
  tFields: (key: string) => string
): TranslationFunctions => ({
  Gallery: t,
  Validation: tValidation,
  Fields: tFields,
});
