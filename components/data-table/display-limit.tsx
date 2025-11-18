import { FC } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DisplayLimitProps {
  limit: number;
  onLimitChange: (limit: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  isRtl?: boolean;
  t: (key: string) => string;
}

export const DisplayLimit: FC<DisplayLimitProps> = ({
  limit,
  onLimitChange,
  hasActiveFilters,
  onClearFilters,
  isRtl = false,
  t,
}) => {
  const displayLimitOptions = [10, 25, 50, 100];

  return (
    <div className="flex gap-2">
      <Select
        value={limit.toString()}
        onValueChange={(value) => {
          onLimitChange(parseInt(value));
        }}
      >
        <SelectTrigger className={cn("w-[180px]", isRtl && "flex-row-reverse")}>
          <SelectValue placeholder={t("RowsPerPage")} />
        </SelectTrigger>
        <SelectContent align="end" className="max-h-[300px]">
          <SelectGroup>
            <SelectLabel>{t("DisplayLimit")}</SelectLabel>
            {displayLimitOptions.map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value} {t("Rows")}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className={cn(
            "px-2 font-normal text-muted-foreground",
            isRtl && "flex-row-reverse"
          )}
        >
          <X className="h-4 w-4 mr-2" />
          {t("ClearFilters")}
        </Button>
      )}
    </div>
  );
};
