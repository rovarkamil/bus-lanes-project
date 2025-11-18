/* eslint-disable @typescript-eslint/no-explicit-any */
import { FilterConfig, FilterValue, FieldConfig } from "@/types/models/common";
import { debugLog } from "./debug-config";

export const createWhereClause = <T extends Record<string, FilterValue>>(
  filters: T,
  config?: Partial<Record<keyof T, FilterConfig>>
) => {
  debugLog("Creating where clause with filters:", filters);
  debugLog("Filter config:", config);

  const where = Object.entries(filters).reduce(
    (where, [key, value]) => {
      if (value === undefined || value === null || value === "") return where;

      const fieldConfig = config?.[key];

      // Special handling for date fields
      if (["createdAt", "updatedAt", "deletedAt"].includes(key)) {
        const date = new Date(value as string);
        if (!isNaN(date.getTime())) {
          return {
            ...where,
            [key]: {
              gte: date, // Greater than or equal to the specified date
            },
          };
        }
        return where;
      }

      if (!fieldConfig) {
        // Handle boolean values
        if (
          typeof value === "boolean" ||
          value === "true" ||
          value === "false"
        ) {
          return { ...where, [key]: value === true || value === "true" };
        }
        return { ...where, [key]: value };
      }

      // Extract operator from fieldConfig, considering it might be a FieldConfig with filters property
      const filterConfig = fieldConfig as unknown as FieldConfig;
      const operator =
        filterConfig.filters?.operator || filterConfig.operator || "equals";
      const field = fieldConfig.field || key;
      const transform = fieldConfig.transform;
      // Use filters.mode if available, otherwise fall back to the mode property
      const mode = filterConfig.filters?.mode || filterConfig.mode;
      const transformedValue = transform ? transform(value) : value;

      // Handle enum types
      if (filterConfig.type === "enum") {
        return {
          ...where,
          [field]: transformedValue,
        };
      }

      // Handle nested fields (e.g., "role.name")
      const fieldParts = field.split(".");
      if (fieldParts.length > 1) {
        let currentLevel = where as Record<string, unknown>;
        fieldParts.slice(0, -1).forEach((part, index) => {
          if (!currentLevel[part]) {
            currentLevel[part] = {};
          }
          if (index < fieldParts.length - 2) {
            currentLevel = currentLevel[part] as Record<string, unknown>;
          }
        });

        const lastPart = fieldParts[fieldParts.length - 1];
        const parentPart = fieldParts[fieldParts.length - 2];

        // Special handling for role name filtering
        if (parentPart === "role" && lastPart === "name") {
          const roleFilter = currentLevel[parentPart] as Record<
            string,
            unknown
          >;
          currentLevel[parentPart] = {
            ...roleFilter,
            [lastPart]: getOperatorValue(
              operator,
              transformedValue as FilterValue,
              mode
            ),
          };
        } else {
          const parentFilter = currentLevel[parentPart] as Record<
            string,
            unknown
          >;
          currentLevel[parentPart] = {
            ...parentFilter,
            [lastPart]: getOperatorValue(
              operator,
              transformedValue as FilterValue,
              mode
            ),
          };
        }

        return where;
      }

      // Special handling for roleId filtering
      if (key === "roleId") {
        return {
          ...where,
          [field]: Array.isArray(transformedValue)
            ? { in: transformedValue }
            : { equals: transformedValue },
        };
      }

      // Handle boolean fields
      if (filterConfig.type === "boolean") {
        return {
          ...where,
          [field]: transformedValue === true || transformedValue === "true",
        };
      }

      return {
        ...where,
        [field]: getOperatorValue(
          operator,
          transformedValue as FilterValue,
          mode
        ),
      };
    },
    {} as Record<string, unknown>
  );

  debugLog("Generated where clause:", where);
  return where;
};

// Helper function to get the operator value
const getOperatorValue = (
  operator: string,
  value: FilterValue,
  mode?: "insensitive" | "sensitive"
): Record<string, unknown> => {
  switch (operator) {
    case "contains":
      return { contains: value, mode: mode || "insensitive" };
    case "startsWith":
      return { startsWith: value, mode: mode || "insensitive" };
    case "endsWith":
      return { endsWith: value, mode: mode || "insensitive" };
    case "in":
      return { in: value };
    case "gte":
    case "lte":
      return { [operator]: value };
    default:
      return { equals: value };
  }
};

export const createOrderBy = (
  sortBy?: string,
  sortOrder: "asc" | "desc" = "desc",
  fieldConfigs?: Record<string, FieldConfig>,
  defaultSort?: { field: string; order: "asc" | "desc" }
) => {
  debugLog("Creating orderBy with:", { sortBy, sortOrder, defaultSort });

  if (!sortBy && !defaultSort) {
    return { createdAt: "desc" as const };
  }

  const sortField = sortBy || defaultSort?.field || "createdAt";
  const finalSortOrder = sortOrder || defaultSort?.order || "desc";

  // Handle nested sorting (e.g., "role.name")
  const parts = sortField.split(".");
  if (parts.length > 1) {
    const orderBy = parts.reduceRight((acc, part, i) => {
      return { [part]: i === parts.length - 1 ? finalSortOrder : acc };
    }, {});
    debugLog("Generated nested orderBy:", orderBy);
    return orderBy;
  }

  // Allow base model fields (createdAt, updatedAt, deletedAt) and fields from fieldConfigs
  const isBaseModelField = [
    "createdAt",
    "updatedAt",
    "deletedAt",
    "id",
  ].includes(sortField);
  if (fieldConfigs && !fieldConfigs[sortField] && !isBaseModelField) {
    debugLog("Invalid sort field, using default:", sortField);
    return { createdAt: "desc" as const };
  }

  const orderBy = { [sortField]: finalSortOrder };
  debugLog("Generated orderBy:", orderBy);

  return orderBy;
};

export function createPrismaQuery({
  filters,
  fieldConfigs,
  listOptions,
  defaultSort,
  sessionContext,
}: {
  filters: Record<string, any>;
  fieldConfigs?: Record<string, any>;
  listOptions?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  };
  defaultSort?: { field: string; order: "asc" | "desc" };
  sessionContext?: {
    user: {
      id: string;
      isAdmin?: boolean;
      branchId?: string | null;
      userType?: string;
    };
  };
}) {
  debugLog("Creating Prisma query with:", {
    filters,
    fieldConfigs,
    listOptions,
    defaultSort,
    sessionContext,
  });

  // Start with an empty query
  const query: Record<string, any> = {};

  // Handle pagination
  if (listOptions?.page && listOptions?.limit) {
    query.skip = (listOptions.page - 1) * listOptions.limit;
    query.take = listOptions.limit;
    debugLog("Added pagination:", { skip: query.skip, take: query.take });
  }

  // Create where clause
  const where: Record<string, any> = {
    // Always exclude soft-deleted records
    deletedAt: null,
  };
  debugLog("Initial where clause:", where);

  // Process exactMatch flags first to create a map of which fields need exact matching
  const exactMatchFields = new Set<string>();
  if (filters) {
    Object.keys(filters).forEach(key => {
      if (key.endsWith('_exactMatch') && filters[key] === true) {
        const fieldName = key.replace('_exactMatch', '');
        exactMatchFields.add(fieldName);
        debugLog(`Field ${fieldName} marked for exact matching`);
      }
    });
  }

  // Handle filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      // Skip exactMatch flags as we've already processed them
      if (key.endsWith('_exactMatch')) return;
      
      if (
        key !== "page" &&
        key !== "limit" &&
        value !== undefined &&
        value !== null
      ) {
        debugLog(`Processing filter: ${key} = ${value}`);
        const fieldConfig = fieldConfigs?.[key];
        
        // Special handling for id field
        if (key === "id") {
          where[key] = value;
          debugLog(`Added direct filter for id:`, where[key]);
          return;
        }
        
        // Special handling for barcodes array
        if (key === "barcodes") {
          where[key] = {
            has: value,
          };
          debugLog(`Added has filter for barcodes:`, where[key]);
          return;
        }

        // Check if this field needs exact matching from the _exactMatch flag
        const needsExactMatch = exactMatchFields.has(key);
        
        if (fieldConfig) {
          const { type, filters: filterConfig } = fieldConfig;
          debugLog(`Found field config for ${key}:`, { type, filterConfig });

          // Check if this is a unique filter or if exactMatch is specified
          const isUnique = filterConfig?.unique || fieldConfig.unique;
          const isExactMatch = needsExactMatch || fieldConfig.exactMatch === true || filterConfig?.exactMatch === true;
          
          if (isUnique || isExactMatch) {
            // Handle invoiceNumber or other numeric fields that need to be converted
            if (type === "number") {
              where[key] = typeof value === 'string' ? Number(value) : value;
            } else {
              where[key] = value;
            }
            debugLog(`Added equals filter for ${isExactMatch ? 'exactMatch' : 'unique'} field ${key}:`, where[key]);
          } else if (type === "string" && filterConfig?.operator === "contains") {
            where[key] = {
              contains: value,
              mode: filterConfig.mode || "default",
            };
          } else if (type === "boolean") {
            where[key] = value === "true";
          } else if (type === "number") {
            where[key] = Number(value);
          } else if (type === "enum") {
            where[key] = value;
          } else if (
            type === "relation" &&
            filterConfig?.operator === "equals"
          ) {
            where[key] = value;
          }
          debugLog(`Added filter for ${key}:`, where[key]);
        } else {
          // Handle fields without config but that need exact matching
          if (needsExactMatch) {
            // For invoiceNumber specifically - force it to be a number for exact comparison
            if (key === "invoiceNumber") {
              where[key] = typeof value === 'string' ? Number(value) : value;
            } else {
              where[key] = value;
            }
            debugLog(`Added exact match filter without config for ${key}:`, where[key]);
          } else {
            // Default behavior for fields without config
            where[key] = value;
            debugLog(`Added default filter for ${key} without config:`, where[key]);
          }
        }
      }
    });
  }

  // Handle access control based on session context
  if (sessionContext?.user) {
    debugLog("Processing session context:", sessionContext.user);
    if (sessionContext.user.branchId) {
      where.branchId = sessionContext.user.branchId;
      debugLog("Added branch filter:", where.branchId);
    }
  }

  // Add where clause to query if not empty
  if (Object.keys(where).length > 0) {
    query.where = where;
    debugLog("Final where clause:", where);
  }

  // Handle sorting
  const sortBy = listOptions?.sortBy;
  const sortOrder = listOptions?.sortOrder || defaultSort?.order || "desc";

  if (sortBy) {
    query.orderBy = { [sortBy]: sortOrder };
    debugLog("Added sort by listOptions:", query.orderBy);
  } else if (defaultSort) {
    query.orderBy = { [defaultSort.field]: defaultSort.order };
    debugLog("Added sort by defaultSort:", query.orderBy);
  }

  debugLog("Final Prisma query:", query);
  return query;
}
