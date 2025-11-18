import * as React from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslation } from "react-i18next";

export interface DateRangePickerProps {
  className?: string;
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  error?: string;
}

export function DateRangePicker({
  className,
  date,
  onDateChange,
  error,
}: DateRangePickerProps) {
  const { t } = useTranslation("Common");
  return (
    <div className={cn("w-full space-y-1", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              error && "border-destructive focus-visible:ring-destructive/50",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>{t("PickADateRange")}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-destructive font-medium">{error}</p>}
    </div>
  );
}
