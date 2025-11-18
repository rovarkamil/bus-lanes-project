import { useState, useCallback } from "react";
import { FieldConfig } from "@/types/models/common";

export interface UseFiltersReturn<T> {
  filters: Partial<T>;
  updateFilter: (key: keyof T, value: T[keyof T] | null) => void;
  resetFilters: () => void;
}

export function useFilters<T extends Record<string, unknown>>(
  fieldConfigs: Record<string, FieldConfig>,
  initialFilters: T
): UseFiltersReturn<T> {
  const [filters, setFilters] = useState<Partial<T>>(() => {
    // Initialize with only non-empty values from initialFilters
    return Object.entries(initialFilters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        acc[key as keyof T] = value as T[keyof T];
      }
      return acc;
    }, {} as Partial<T>);
  });

  const updateFilter = useCallback((key: keyof T, value: T[keyof T] | null) => {
    setFilters((prev) => {
      // If value is empty, remove the key from filters
      if (value === undefined || value === null || value === "") {
        const newFilters = { ...prev };
        delete newFilters[key];
        return newFilters;
      }
      
      // Check if exactMatch is enabled for this field
      const fieldConfig = fieldConfigs[key as string];
      const exactMatch = fieldConfig?.exactMatch === true || 
                         fieldConfig?.filters?.exactMatch === true;
      
      return { 
        ...prev, 
        [key]: value,
        // If the field has exactMatch set to true, update the filter accordingly
        ...(exactMatch && { [`${String(key)}_exactMatch`]: true })
      };
    });
  }, [fieldConfigs]);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    filters,
    updateFilter,
    resetFilters,
  };
}
