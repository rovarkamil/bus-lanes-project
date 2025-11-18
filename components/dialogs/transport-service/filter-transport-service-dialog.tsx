"use client";

import { FC } from "react";
import { useTranslation } from "@/i18n/client";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { FormSection } from "@/components/ui/form-section";
import { FilterField } from "@/components/ui/filter-field";
import { TransportServiceFilterParams } from "@/types/models/transport-service";
import { TransportServiceType } from "@prisma/client";

interface TransportServiceFilterDialogProps {
  currentInputs: TransportServiceFilterParams;
  onInputChange: (
    name: string,
    value: string | Date | boolean | undefined
  ) => void;
  onSearch: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TransportServiceFilterDialog: FC<
  TransportServiceFilterDialogProps
> = ({ currentInputs, onInputChange, onSearch, isOpen, onOpenChange }) => {
  const { t, i18n } = useTranslation("TransportServices");
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
                key: "type",
                label: "FilterDialog.Type",
                filterType: "select",
                options: Object.values(TransportServiceType).map((type) => ({
                  label: `TransportServiceType.${type}`,
                  value: type,
                })),
              }}
              value={currentInputs.type as string}
              onChange={(value) => onInputChange("type", value as string)}
              t={t}
            />
            <FilterField
              field={{
                key: "isActive",
                label: "FilterDialog.IsActive",
                filterType: "boolean",
              }}
              value={currentInputs.isActive}
              onChange={(value) => onInputChange("isActive", value as boolean)}
              t={t}
            />
            <FilterField
              field={{
                key: "capacity",
                label: "FilterDialog.Capacity",
                filterType: "number",
                placeholder: "FilterDialog.CapacityPlaceholder",
              }}
              value={currentInputs.capacity}
              onChange={(value) =>
                onInputChange("capacity", value ? (value as string) : undefined)
              }
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
