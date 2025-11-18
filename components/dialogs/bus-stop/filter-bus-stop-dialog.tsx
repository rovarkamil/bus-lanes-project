"use client";

import { FC } from "react";
import { useTranslation } from "@/i18n/client";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { FormSection } from "@/components/ui/form-section";
import { FilterField } from "@/components/ui/filter-field";
import { BusStopFilterParams } from "@/types/models/bus-stop";

interface BusStopFilterDialogProps {
  currentInputs: BusStopFilterParams;
  onInputChange: (
    name: string,
    value: string | Date | boolean | undefined
  ) => void;
  onSearch: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BusStopFilterDialog: FC<BusStopFilterDialogProps> = ({
  currentInputs,
  onInputChange,
  onSearch,
  isOpen,
  onOpenChange,
}) => {
  const { t, i18n } = useTranslation("BusStops");
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
                key: "zoneId",
                label: "FilterDialog.ZoneId",
                filterType: "text",
                placeholder: "FilterDialog.ZonePlaceholder",
              }}
              value={currentInputs.zoneId}
              onChange={(value) => onInputChange("zoneId", value as string)}
              t={t}
            />
            {["hasShelter", "isAccessible", "hasRealTimeInfo"].map((key) => (
              <FilterField
                key={key}
                field={{
                  key,
                  label: `FilterDialog.${key}`,
                  filterType: "boolean",
                  placeholder: `FilterDialog.${key}Placeholder`,
                }}
                value={
                  currentInputs[key as keyof BusStopFilterParams] as boolean
                }
                onChange={(value) =>
                  onInputChange(key, value as boolean | undefined)
                }
                t={t}
              />
            ))}
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
