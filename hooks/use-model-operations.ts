import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/client";
import {
  ModelOptions,
  ListOptions,
  PaginatedResponse,
} from "@/types/models/common";
import { z } from "zod";

interface UseModelOperationsProps<
  TSchema extends z.ZodObject<z.ZodRawShape>,
  TData extends z.infer<TSchema>,
  TCreateData extends Partial<TData>,
  TUpdateData extends { id: string } & Partial<TData>,
  TSearchParams extends Record<string, unknown>
> {
  options: ModelOptions<TSchema>;
  initialSearchParams: TSearchParams;
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

interface UseModelOperationsReturn<TData, TCreateData, TUpdateData> {
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
  sortBy: string | undefined;
  sortOrder: "asc" | "desc" | undefined;
  handleSort: (column: string) => void;

  // Filters
  filters: Record<string, unknown>;
  hasActiveFilters: boolean;
  handleClearFilters: () => void;
  handleFilterChange: (name: string, value: unknown) => void;
  applyFilters: () => void;

  // CRUD operations
  handleCreate: (data: TCreateData) => Promise<void>;
  handleUpdate: (data: TUpdateData) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  refetch: () => void;
}

export function useModelOperations<
  TSchema extends z.ZodObject<z.ZodRawShape>,
  TData extends z.infer<TSchema>,
  TCreateData extends Partial<TData>,
  TUpdateData extends { id: string } & Partial<TData>,
  TSearchParams extends Record<string, unknown>
>({
  options,
  initialSearchParams,
  onSuccess,
  useFetch,
  useCreate,
  useUpdate,
  useDelete,
}: UseModelOperationsProps<
  TSchema,
  TData,
  TCreateData,
  TUpdateData,
  TSearchParams
>): UseModelOperationsReturn<TData, TCreateData, TUpdateData> {
  const { t } = useTranslation("Common");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<string | undefined>(
    initialSearchParams?.sortBy as string
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(
    initialSearchParams?.sortOrder as "asc" | "desc"
  );
  const [pendingFilters, setPendingFilters] = useState<Record<string, unknown>>(
    initialSearchParams ?? {}
  );
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown>>(
    initialSearchParams ?? {}
  );

  const hasActiveFilters = Object.keys(appliedFilters).length > 0;

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleClearFilters = () => {
    setPendingFilters({});
    setAppliedFilters({});
  };

  const handleFilterChange = (name: string, value: unknown) => {
    setPendingFilters((prev: Record<string, unknown>) => {
      // Get the field config if it exists
      const fieldConfig = options.fieldConfigs?.[name];
      
      // If value is empty, remove the key from filters
      if (value === undefined || value === null || value === "") {
        const newFilters = { ...prev };
        delete newFilters[name];
        return newFilters;
      }
      
      // Check if exactMatch is enabled for this field
      const exactMatch = fieldConfig?.exactMatch === true || 
                         fieldConfig?.filters?.exactMatch === true;
                         
      return { 
        ...prev, 
        [name]: value,
        // If the field config has exactMatch set to true, preserve that in the filter
        ...(exactMatch && { [`${name}_exactMatch`]: true })
      };
    });
  };

  const applyFilters = () => {
    setAppliedFilters(pendingFilters);
    setCurrentPage(1);
  };

  // Data fetching
  const { data, isPending, refetch } = useFetch({
    // Only include non-empty filter values from appliedFilters
    ...Object.entries(appliedFilters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>),
    page: currentPage,
    limit,
    ...(sortBy && { sortBy: sortBy }),
    ...(sortOrder && { sortOrder: sortOrder }),
  } as TSearchParams & ListOptions);

  // Mutations
  const { mutate: create } = useCreate();
  const { mutate: update } = useUpdate();
  const { mutate: deleteItem, isPending: isDeletePending } = useDelete();

  // Computed values
  const totalItems = data?.total || 0;

  // Handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
  }, []);

  const handleCreate = useCallback(
    async (data: TCreateData) => {
      create(data, {
        onSuccess: () => {
          toast.success(
            t(`${options.modelName}.CreateDialog.UserCreatedSuccessfully`)
          );
          refetch();
          onSuccess?.();
        },
      });
    },
    [create, refetch, onSuccess, t, options.modelName]
  );

  const handleUpdate = useCallback(
    async (data: TUpdateData) => {
      update(data, {
        onSuccess: () => {
          toast.success(
            t(`${options.modelName}.UpdateDialog.UserUpdatedSuccessfully`)
          );
          refetch();
          onSuccess?.();
        },
      });
    },
    [update, refetch, onSuccess, t, options.modelName]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      deleteItem(
        { id },
        {
          onSuccess: () => {
            toast.success(
              t(`${options.modelName}.DeleteDialog.UserDeletedSuccessfully`)
            );
            refetch();
            onSuccess?.();
          },
        }
      );
    },
    [deleteItem, refetch, onSuccess, t, options.modelName]
  );

  return {
    items: data?.items,
    totalItems: data?.total ?? 0,
    isLoading: isPending,
    isDeleting: isDeletePending,
    currentPage,
    totalPages: Math.ceil(totalItems / limit),
    limit,
    handlePageChange,
    handleLimitChange,
    sortBy,
    sortOrder,
    handleSort,
    filters: pendingFilters,
    hasActiveFilters,
    handleClearFilters,
    handleFilterChange,
    applyFilters,
    handleCreate,
    handleUpdate,
    handleDelete,
    refetch,
  };
}
