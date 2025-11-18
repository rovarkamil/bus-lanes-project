import { FC } from "react";
import { Label } from "./label";
import { Input } from "./input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FilterFieldDefinition,
  PaginatedResponse,
} from "@/types/models/common";
import { useTranslation } from "@/i18n/client";
import SelectWithPagination from "@/components/select-with-pagination";
import { UseQueryResult } from "@tanstack/react-query";

interface FilterFieldProps {
  field: FilterFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  t: (key: string) => string;
  relation?: {
    fetchFunction: (
      params?: any
    ) => UseQueryResult<PaginatedResponse<any>, Error>;
    fields: { key: string; label: string }[];
    params?: any;
    defaultValue?: any;
    value?: any;
    error?: string;
  };
}

export const FilterField: FC<FilterFieldProps> = ({
  field,
  value,
  onChange,
  onKeyPress,
  t,
  relation,
}) => {
  const { t: tDashboard, i18n } = useTranslation("Dashboard");
  const isRTL = i18n.language !== "en";
  const Icon = field.icon;

  const renderField = () => {
    switch (field.filterType) {
      case "text":
        return (
          <Input
            value={value?.toString() || ""}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyPress}
            placeholder={t(field.placeholder || "")}
            className={cn("h-9", field.exactMatch && "border-primary border-2")}
            title={
              field.exactMatch ? tDashboard("Filters.ExactMatch") : undefined
            }
          />
        );

      case "select":
        return (
          <Select
            value={value?.toString() || ""}
            onValueChange={(value) => onChange(value)}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <SelectTrigger
              className={cn(
                "h-9",
                field.exactMatch && "border-primary border-2"
              )}
              dir={isRTL ? "rtl" : "ltr"}
              title={
                field.exactMatch ? tDashboard("Filters.ExactMatch") : undefined
              }
            >
              <SelectValue placeholder={t(field.placeholder || "")} />
            </SelectTrigger>
            <SelectContent dir={isRTL ? "rtl" : "ltr"}>
              {field.options?.map((option) => (
                <SelectItem
                  key={option.value.toString()}
                  value={option.value.toString()}
                >
                  {t(option.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "relation":
        return (
          <SelectWithPagination
            fetchFunction={
              relation?.fetchFunction ||
              (() => ({ data: { data: [], meta: { total: 0 } } }) as any)
            }
            onSelect={(user) => onChange(user?.id || null)}
            fields={relation?.fields || []}
            params={relation?.params}
            placeholder={t(field.placeholder || "")}
            value={relation?.value}
            defaultValue={relation?.defaultValue}
            error={relation?.error}
            canClear={true}
          />
        );

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground",
                  field.exactMatch && "border-primary border-2"
                )}
                title={field.exactMatch ? t("Filters.ExactMatch") : undefined}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? (
                  format(value as Date, "PPP")
                ) : (
                  <span>{t(field.placeholder || "")}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value as Date}
                onSelect={(date) => onChange(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        {t(field.label)}
        {field.exactMatch && (
          <span
            className="text-xs text-primary ml-1"
            title={tDashboard("Filters.ExactMatch")}
          >
            {tDashboard("Filters.ExactMatchLabel")}
          </span>
        )}
      </Label>
      {renderField()}
    </div>
  );
};
