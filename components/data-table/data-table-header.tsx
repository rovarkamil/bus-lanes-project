import { TableHead } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableHeaderProps {
  column: string;
  label: string;
  sortBy?: string;
  // eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding
  sortOrder?: "asc" | "desc";
  onSort: (column: string) => void;
  className?: string;
}

export function DataTableHeader({
  column,
  label,
  sortBy,
  sortOrder,
  onSort,
  className,
}: DataTableHeaderProps) {
  const isActive = sortBy === column;

  return (
    <TableHead
      onClick={() => onSort(column)}
      className={cn(
        // eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding
        "cursor-pointer select-none",
        "group hover:bg-accent/50 transition-all duration-200",
        isActive && "bg-accent/30",
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        {/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */}
        <span className={cn(isActive && "text-primary font-medium")}>
          {label}
        </span>
        <div className="flex flex-col space-y-1">
          <ChevronUp
            className={cn(
              "h-3 w-3 transition-colors duration-200",
              isActive && sortOrder === "asc"
                ? "text-primary"
                : "text-muted-foreground/30 group-hover:text-muted-foreground/50"
            )}
          />
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-colors duration-200",
              isActive && sortOrder === "desc"
                ? "text-primary"
                : "text-muted-foreground/30 group-hover:text-muted-foreground/50"
            )}
          />
        </div>
      </div>
    </TableHead>
  );
}
