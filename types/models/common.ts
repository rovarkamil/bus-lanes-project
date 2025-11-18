/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { UserType, Permission } from "@prisma/client";
import { type LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { type VariantProps } from "class-variance-authority";
import { UseFormReturn, FieldValues } from "react-hook-form";
import { Session } from "next-auth";
import { UseQueryResult } from "@tanstack/react-query";

// Context Type
export interface Context<T = unknown> {
  session?: {
    user: {
      id: string;
      userType: UserType;
      role: {
        permissions: Permission[];
      };
    };
  };
  body?: T;
  paginationParams?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  };
}

// Generic API Response type
export type ApiResponse<T, E extends string = string> = {
  success: boolean;
  data?: T;
  message?: E;
  error?: {
    code: E;
    message: string;
    details?: unknown;
  };
};

export interface ErrorResponse {
  success: false;
  message: string;
  errorCode: string;
  details?: unknown;
}

// Status Badge Types
export type StatusBadgeVariant = "default" | "success" | "error";

export interface StatusBadgeProps {
  variant?: StatusBadgeVariant;
  children?: React.ReactNode;
  className?: string;
  label?: string;
}

// Model Options and Configuration Types
export interface ModelOptions<SchemaType extends z.ZodObject<z.ZodRawShape>> {
  modelName: string;
  schema: SchemaType;
  apiPath: string;
  queryKey: string[];
  fieldConfigs?: Record<string, FieldConfig>;
}

export interface ListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  filter?: Record<string, unknown>;
  exact?: boolean;
}

// Generic Paginated Response type
export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// Generic Model Operations Types
export interface UseModelOperationsProps<
  TSchema extends z.ZodObject<z.ZodRawShape>,
  TData extends z.infer<TSchema>,
  TCreateData extends Partial<TData>,
  TUpdateData extends { id: string } & Partial<TData>,
  TSearchParams extends Record<string, unknown>,
> {
  options: ModelOptions<TSchema>;
  initialSearchParams?: TSearchParams;
  onSuccess?: () => void;
  useFetch: (params: TSearchParams & ListOptions) => {
    data?: PaginatedResponse<TData>;
    isPending: boolean;
    refetch: () => void;
  };
  useCreate: () => {
    mutate: (
      data: TCreateData,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void }
    ) => void;
    isPending: boolean;
  };
  useUpdate: () => {
    mutate: (
      data: TUpdateData,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void }
    ) => void;
    isPending: boolean;
  };
  useDelete: () => {
    mutate: (
      data: { id: string },
      options?: { onSuccess?: () => void; onError?: (error: Error) => void }
    ) => void;
    isPending: boolean;
  };
}

export interface UseModelOperationsReturn<TData, TCreateData, TUpdateData> {
  // Data and loading states
  items: TData[] | undefined;
  totalItems: number;
  isLoading: boolean;
  isDeleting: boolean;

  // Pagination
  currentPage: number;
  totalPages: number;
  limit: number;
  handlePageChange: (page: number) => void;
  handleLimitChange: (limit: number) => void;

  // Sorting
  sort?: string;
  order?: "asc" | "desc";
  handleSort: (column: string) => void;

  // Filters
  filters: Record<string, unknown>;
  hasActiveFilters: boolean;
  handleClearFilters: () => void;
  handleFilterChange: (name: string, value: unknown) => void;

  // CRUD operations
  handleCreate: (data: TCreateData) => Promise<void>;
  handleUpdate: (data: TUpdateData) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  refetch: () => void;
}

// Generic Data Table Types
export type ColumnAlignment = "left" | "center" | "right";

// Interface for DataPage render context
export interface DataPageRenderContext<T = unknown> {
  index: number;
  t: (key: string) => string;
  session: Session | null;
  isDeleting: boolean;
  handlers: {
    setSelectedItem: (item: T | null) => void;
    setIsViewDialogOpen: (item: T) => void;
    handleOpenUpdateDialog: (item: T) => void;
    handleDelete: (id: string) => void;
    isRtl: boolean;
  };
  isRtl: boolean;
}

// Custom column definition for DataPage
export interface DataPageColumn<T> {
  key: keyof T | "index" | "actions" | string;
  label: string;
  render?: (item: T, context: DataPageRenderContext<T>) => React.ReactNode;
  align?: ColumnAlignment;
  sortable?: boolean;
  width?: string | number;
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  hidden?: boolean;
  fixed?: "left" | "right";
  tooltip?: string;
  showInMobile?: boolean;
}

// Generic RenderContext for DataTable
export interface GenericRenderContext<T = unknown> {
  index: number;
  t: (key: string) => string;
  session: Session | null;
  isDeleting: boolean;
  handlers: {
    setSelectedItem: (item: T | null) => void;
    setIsViewDialogOpen: (open: boolean) => void;
    handleOpenUpdateDialog: (item: T) => void;
    handleDelete: (id: string) => void;
    isRtl: boolean;
  };
}

// Column configuration for tables
export interface Column<T> {
  key: keyof T | "index" | "actions";
  label: string;
  render?: (item: T, index: number) => React.ReactNode;
  align?: ColumnAlignment;
  sortable?: boolean;
  width?: string | number;
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  hidden?: boolean;
  fixed?: "left" | "right";
  tooltip?: string;
  filterable?: boolean;
  searchable?: boolean;
  filterComponent?: React.ComponentType<{
    value: unknown;
    onChange: (value: unknown) => void;
  }>;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  noDataMessage?: string;
  className?: string;
  onRowClick?: (item: T) => void;
  selectedRows?: T[];
  canUpdate?: boolean;
  canDelete?: boolean;
}

export interface DataTableHeaderProps {
  column: string;
  label: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort: (column: string) => void;
  className?: string;
  align?: ColumnAlignment;
}

export interface DataTableActionProps<T> {
  item: T;
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  isDeleting?: boolean;
  isRtl?: boolean;
  className?: string;
  i18n?: {
    view?: string;
    edit?: string;
    delete?: string;
    cancel?: string;
    confirm?: string;
    deleteConfirmTitle?: string;
    deleteConfirmMessage?: string;
  };
}

export interface GenericDataTableProps<
  TSchema extends z.ZodObject<z.ZodRawShape>,
  TData extends z.infer<TSchema>,
> {
  options: ModelOptions<TSchema>;
  data: TData[];
  columns: Column<TData>[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  limit: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onCreateClick?: () => void;
  canCreate?: boolean;
  onRowClick?: (item: TData) => void;
  className?: string;
}

// Error Types
export type ErrorSeverity = "error" | "warning" | "info";

export class BaseError extends Error {
  constructor(
    public message: string,
    public status: number = 400,
    public field?: string,
    public code?: string,
    public type?: string,
    public value?: string,
    public severity: ErrorSeverity = "error"
  ) {
    super(message);
    this.name = "BaseError";
  }

  getTranslatedMessage(
    t?: (key: string, options: Record<string, string>) => string
  ): string {
    if (!t) return this.message;

    // Split the message into namespace and key parts
    const [namespace, ...keyParts] = this.message.split(".");
    const key = keyParts.join(".");

    // For validation errors, we need to get the field translation if it exists
    let field = "";
    if (this.field) {
      // Try to get the field translation
      field = t(this.field, { ns: "Fields" });

      // If translation failed (returns the key), try with first letter capitalized
      if (field === this.field) {
        const capitalizedKey =
          this.field.charAt(0).toUpperCase() + this.field.slice(1);
        field = t(capitalizedKey, { ns: "Fields" });

        // If still no translation, use the original field name with first letter capitalized
        if (field === capitalizedKey) {
          field = capitalizedKey;
        }
      }
    }

    // For validation errors, we need to handle both the field and value
    const params: Record<string, string> = {
      ns: namespace,
      field: field || this.field || "Field",
      defaultValue: this.message,
    };

    // Add value if it exists (for unique constraint errors)
    if (this.value) {
      params.value = this.value;
    }

    // Translate the message using the namespace and key
    return t(key, params);
  }
}

// Filter Types
export type FilterOperator =
  | "equals"
  | "not"
  | "in"
  | "notIn"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "between"
  | "search";

export interface FilterConfig {
  field?: string;
  operator?: FilterOperator;
  transform?: (value: FilterValue) => unknown;
  mode?: "insensitive" | "sensitive";
  unique?: boolean;
  exactMatch?: boolean;
}

// Field configuration for filtering and validation
export type FieldConfig = FilterConfig & {
  type: "string" | "number" | "boolean" | "date" | "enum" | "relation";
  searchable?: boolean;
  filters?: {
    customOperators?: string[];
    multiSelect?: boolean;
    operator?: string;
    mode?: "insensitive" | "sensitive";
    range?: boolean;
    transform?: (value: FilterValue) => unknown;
    field?: string;
    unique?: boolean;
    exactMatch?: boolean;
  };
  options?: string[];
  maxLength?: number;
  pattern?: string;
  defaultValue?: unknown;
  unique?: boolean;
  exactMatch?: boolean;
};

// Generic type for filter values
export type FilterValue =
  | string
  | number
  | boolean
  | Date
  | Array<unknown>
  | Record<string, unknown>;

// Generic Dialog Props
export interface GenericDialogProps<TCreate, TUpdate, TData> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  onSuccess?: (data: TData) => void;
  onSubmit?: (data: TCreate | TUpdate) => Promise<void>;
  mode?: "create" | "update" | "view";
  title?: string;
  description?: string;
}

// Generic Search Params
export interface SearchParams {
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Generic Filter Params
export interface FilterParams extends Record<string, unknown> {
  createdAt?: { gte?: Date; lte?: Date };
  updatedAt?: { gte?: Date; lte?: Date };
  deletedAt?: Date | null;
}

// Generic Action Button Types
export interface BaseActionButton<T> {
  icon: LucideIcon;
  tooltip: string;
  variant: VariantProps<typeof buttonVariants>["variant"];
  className: string;
  onClick: (item: T, handlers: BaseActionHandlers<T>) => void;
  requiresPermission: Permission | false;
}

export interface BaseActionHandlers<T> {
  setSelectedItem?: (item: T) => void;
  setIsViewDialogOpen?: (open: boolean) => void;
  handleOpenUpdateDialog?: (item: T) => void;
  handleDelete?: (id: string) => void;
}

// Common Response Types
export interface BaseResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface BasePaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Common Schema Types
export interface BaseSchema {
  id: string;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Generic Response Types with Relations
export type ResponseWithRelations<T> = BaseResponse<T>;
export type PaginatedResponseWithRelations<T> = BaseResponse<
  BasePaginatedResponse<T>
>;

// Generic Schema Types
export const baseModelSchema = z.object({
  id: z.string().uuid(),
  deletedAt: z
    .union([
      z.date(),
      z.string().transform((val) => (val ? new Date(val) : null)),
    ])
    .nullable()
    .optional(),
  createdAt: z
    .union([z.date(), z.string().transform((val) => new Date(val))])
    .optional(),
  updatedAt: z
    .union([z.date(), z.string().transform((val) => new Date(val))])
    .optional(),
});

// Common search configurations
export const STRING_SEARCH_CONFIG = {
  searchable: true,
  filters: {
    customOperators: ["contains", "equals"] as string[],
    mode: "insensitive",
  },
} as const;

export const ENUM_FILTER_CONFIG = {
  searchable: false,
  filters: {
    multiSelect: true,
    operator: "in",
    transform: (value: FilterValue) => (Array.isArray(value) ? value : [value]),
  },
} as const;

// Common button style configurations
export const BASE_BUTTON_STYLES = {
  view: {
    variant: "ghost" as const,
    className: "hover:bg-primary/10 hover:text-primary",
  },
  edit: {
    variant: "ghost" as const,
    className: "hover:bg-indigo-500/10 hover:text-indigo-500",
  },
  delete: {
    variant: "ghost" as const,
    className: "hover:bg-red-500/10 hover:text-red-500",
  },
} as const;

// Error Translation Types
export type ErrorTranslationKey =
  | "too_small"
  | "invalid_email"
  | "invalid_uuid"
  | "password_uppercase"
  | "password_lowercase"
  | "password_number"
  | "password_special"
  | "role_required"
  | "required";

export interface ErrorTranslationConfig {
  pattern: RegExp | string;
  key: ErrorTranslationKey;
  condition?: (error: string) => boolean;
}

export interface ErrorTranslator {
  (
    error: string,
    tErrors: (key: string, options?: { defaultValue: string }) => string
  ): string;
}

// Dialog Form Types
export interface DialogFormState {
  isSubmitting: boolean;
  showPassword: boolean;
}

export interface DialogFormProps<T> {
  onSubmit: (data: T) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  t: (key: string) => string;
  tErrors: (key: string, options?: { defaultValue: string }) => string;
}

// Generic Dialog Types
export interface BaseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export interface ViewDialogProps<T> extends BaseDialogProps {
  data: T;
}

export interface CreateDialogProps<T> extends BaseDialogProps {
  initialData?: Partial<T>;
}

export interface UpdateDialogProps<T> extends BaseDialogProps {
  data: T;
}

export interface DeleteDialogProps extends BaseDialogProps {
  id: string;
}

// Generic Form Types
export interface BaseFormProps<TData extends FieldValues, TContext = unknown> {
  form: UseFormReturn<TData, TContext>;
  onSubmit: (data: TData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  mode: "create" | "update" | "view";
}

export interface FormFieldDefinition {
  key: string;
  label: string;
  icon: LucideIcon;
  type?: string;
  placeholder?: string;
  isOptional?: boolean;
  options?: { label: string; value: string | number | boolean }[];
}

export interface FormSectionDefinition {
  title: string;
  fields: FormFieldDefinition[];
}

export interface FilterFieldDefinition {
  key: string;
  label: string;
  icon?: LucideIcon;
  filterType:
    | "text"
    | "number"
    | "boolean"
    | "select"
    | "multiselect"
    | "date"
    | "relation"
    | "role-select";
  relation?: {
    fetchFunction: (
      params?: any
    ) => UseQueryResult<PaginatedResponse<any>, Error>;
    fields: { key: string; label: string }[];
    params?: any;
    defaultValue?: any;
    value?: any;
  };
  placeholder?: string;
  options?: { label: string; value: string | number | boolean }[];
  exactMatch?: boolean;
}

export interface FilterSectionDefinition {
  title: string;
  fields: FilterFieldDefinition[];
}

export interface ViewFieldDefinition extends FormFieldDefinition {
  viewType:
    | "text"
    | "badge"
    | "date"
    | "copyable"
    | "list"
    | "boolean"
    | "number"
    | "url"
    | "color"
    | "image";
  formatValue?: <T>(value: T) => React.ReactNode;
}

export interface ViewSectionDefinition {
  title: string;
  fields: ViewFieldDefinition[];
}

// Enhanced Error Types
export interface UniqueConstraintError {
  field: string;
  value: any;
  entityName: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    status: number;
    field?: string;
    code?: string;
    type?: string;
    value?: string;
  };
}

export type Namespace =
  | "Users"
  | "Roles"
  | "Services"
  | "Blogs"
  | "FAQs"
  | "FAQCategories"
  | "ResearchAreas"
  | "ResearchCategories"
  | "ServiceCategories"
  | "SocialMedia"
  | "Contacts"
  | "Settings"
  | "AboutUs"
  | "BlogCategories"
  | "AuditLogs"
  | "Validation"
  | "Fields"
  | "Items"
  | "Categories"
  | "Suppliers"
  | "CashierSessions"
  | "Refunds"
  | "Orders"
  | "SupplierOrders"
  | "SupplierRefunds"
  | "SupplierPayments"
  | "BarcodePrints"
  | "CashierSessionTransfers"
  | "TransportServices"
  | "BusStops"
  | "BusLanes"
  | "BusRoutes"
  | "BusSchedules"
  | "Zones"
  | "MapIcons";

export type TranslationFunctions = {
  [K in Namespace]?: (key: string, options?: Record<string, string>) => string;
};
