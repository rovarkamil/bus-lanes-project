"use client";

import { FC } from "react";
import { useTranslation } from "@/i18n/client";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { FormSection } from "@/components/ui/form-section";
import { FilterField } from "@/components/ui/filter-field";
import { BusScheduleFilterParams } from "@/types/models/bus-schedule";
import { DayOfWeek } from "@prisma/client";

interface BusScheduleFilterDialogProps {
  currentInputs: BusScheduleFilterParams;
  onInputChange: (
    name: string,
    value: string | Date | boolean | undefined
  ) => void;
  onSearch: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BusScheduleFilterDialog: FC<BusScheduleFilterDialogProps> = ({
  currentInputs,
  onInputChange,
  onSearch,
  isOpen,
  onOpenChange,
}) => {
  const { t, i18n } = useTranslation("BusSchedules");
  const isRTL = i18n.language !== "en";

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
    onOpenChange(false);
  };

  return (
    <CustomDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      icon={Filter}
      title={t("FilterDialog.Title")}
      description={t("FilterDialog.Description")}
      rtl={isRTL}
    >
      <form onSubmit={handleApplyFilters} className="space-y-6">
        <FormSection title={t("FilterDialog.BasicFilters")}>
          <div className="space-y-4">
            <FilterField
              field={{
                key: "routeId",
                label: "FilterDialog.RouteId",
                filterType: "text",
                placeholder: "FilterDialog.RouteIdPlaceholder",
              }}
              value={currentInputs.routeId}
              onChange={(value) => onInputChange("routeId", value as string)}
              t={t}
            />
            <FilterField
              field={{
                key: "stopId",
                label: "FilterDialog.StopId",
                filterType: "text",
                placeholder: "FilterDialog.StopIdPlaceholder",
              }}
              value={currentInputs.stopId}
              onChange={(value) => onInputChange("stopId", value as string)}
              t={t}
            />
            <FilterField
              field={{
                key: "dayOfWeek",
                label: "FilterDialog.DayOfWeek",
                filterType: "select",
                options: Object.values(DayOfWeek).map((day) => ({
                  label: `DayOfWeek.${day}`,
                  value: day,
                })),
              }}
              value={currentInputs.dayOfWeek as string}
              onChange={(value) => onInputChange("dayOfWeek", value as string)}
              t={t}
            />
            <FilterField
              field={{
                key: "isActive",
                label: "FilterDialog.IsActive",
                filterType: "boolean",
                placeholder: "FilterDialog.IsActivePlaceholder",
              }}
              value={currentInputs.isActive}
              onChange={(value) => onInputChange("isActive", value as boolean)}
              t={t}
            />
          </div>
        </FormSection>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("Common.Cancel")}
          </Button>
          <Button type="submit">{t("Common.Apply")}</Button>
        </div>
      </form>
    </CustomDialog>
  );
};


