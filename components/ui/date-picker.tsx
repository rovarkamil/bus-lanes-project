"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DayPicker } from "react-day-picker";
import { useTranslation } from "@/i18n/client";

interface DatePickerProps {
  date?: Date;
  onChange: (date: Date | undefined) => void;
  className?: string;
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center relative items-center",
        caption_dropdowns: "flex justify-center gap-1",
        caption_label: "hidden", // Hide the redundant month/year text
        vhidden: "hidden",
        dropdown:
          "relative inline-flex items-center px-2 py-1 text-sm rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ",
        dropdown_month: "flex-1",
        dropdown_year: "flex-1",
        dropdown_icon: "hidden",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "rounded-md w-9 font-normal text-[0.8rem] text-muted-foreground ",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground"
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}

export function DatePicker({ date, onChange, className }: DatePickerProps) {
  const { t, i18n } = useTranslation("Dashboard");
  const isRTL = i18n.language !== "en";
  return (
    <Popover>
      <PopoverTrigger asChild dir={isRTL ? "rtl" : "ltr"}>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{t("PickADate")}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-popover/95 backdrop-blur-sm border border-border/40 shadow-lg"
        align="start"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={onChange}
          initialFocus
          captionLayout="dropdown-buttons"
          fromYear={1900}
          toYear={2100}
          disabled={(date) =>
            date > new Date(2100, 0, 1) || date < new Date(1900, 0, 1)
          }
          hideHead={false}
        />
      </PopoverContent>
    </Popover>
  );
}
