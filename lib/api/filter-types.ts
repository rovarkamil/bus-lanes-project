/* eslint-disable @zohodesk/no-hardcoding/no-hardcoding */
import { Prisma } from "@prisma/client";
import { FilterOperator, FilterValue } from "@/types/models/common";

/**
 * Defines the type of a field in a model for filtering purposes
 */
export interface FieldConfig {
  /**
   * The field type
   */
  type: "string" | "number" | "boolean" | "date" | "relation" | "enum";

  /**
   * Whether the field should be included in full-text search
   */
  searchable: boolean;

  /**
   * The name of the relation field if type is 'relation'
   */
  relationField?: string;

  /**
   * Additional filter configuration
   */
  filters?: {
    /**
     * Whether to support multi-select for this field
     */
    multiSelect?: boolean;

    /**
     * Whether to support range filtering (min/max) for this field
     */
    range?: boolean;

    /**
     * Custom operators to support for this field
     */
    customOperators?: FilterOperator[];

    /**
     * Transform function for the filter value
     */
    transform?: (value: FilterValue) => unknown;

    /**
     * Query mode for string operations
     */
    mode?: Prisma.QueryMode;

    /**
     * Whether to perform exact matching for this field
     */
    exactMatch?: boolean;
  };

  /**
   * Field validation rules
   */
  maxLength?: number;
  pattern?: string;
  options?: unknown[];
  defaultValue?: unknown;

  /**
   * Whether to perform exact matching for this field
   */
  exactMatch?: boolean;
}
