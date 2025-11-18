"use client";

import { FC } from "react";
import { useTranslation } from "@/i18n/client";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { FormSection } from "@/components/ui/form-section";
import { FilterField } from "@/components/ui/filter-field";
import { ZoneFilterParams } from "@/types/models/zone";

interface ZoneFilterDialogProps {
  currentInputs: ZoneFilterParams;
  onInputChange: (
    name: string,
    value: string | Date | boolean | undefined
  ) => void;
  onSearch: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ZoneFilterDialog: FC<ZoneFilterDialogProps> = ({
  currentInputs,
  onInputChange,
  onSearch,
  isOpen,
  onOpenChange,
}) => {
  const { t, i18n } = useTranslation("Zones");
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
                key: "color",
                label: "FilterDialog.Color",
                filterType: "text",
                placeholder: "FilterDialog.ColorPlaceholder",
              }}
              value={currentInputs.color}
              onChange={(value) => onInputChange("color", value as string)}
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
