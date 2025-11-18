import { ReactNode } from "react";
import { DisplayLimit } from "./display-limit";

interface TableFiltersProps {
  totalItems: number;
  limit: number;
  onLimitChange: (limit: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  isRtl?: boolean;
  filterDialog?: ReactNode;
  t: (key: string) => string;
  className?: string;
}

export function TableFilters({
  totalItems,
  limit,
  onLimitChange,
  hasActiveFilters,
  onClearFilters,
  isRtl,
  filterDialog,
  t,
  className,
}: TableFiltersProps) {
  return (
    <div
      className={`flex flex-col xl:flex-row sm:justify-between gap-4 mb-6 ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="flex gap-2">
          {filterDialog}
          <DisplayLimit
            limit={limit}
            onLimitChange={onLimitChange}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={onClearFilters}
            isRtl={isRtl}
            t={t}
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {t("TotalItems")}: {totalItems}
      </p>
    </div>
  );
}
