/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { FC } from "react";
import { useTranslation } from "@/i18n/client";
import { Filter, Shield, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FormSection } from "@/components/ui/form-section";
import { FilterField } from "@/components/ui/filter-field";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { RoleFilterParams } from "@/types/models/role";
import { Permission } from "@prisma/client";

interface RoleFilterDialogProps {
  currentInputs: RoleFilterParams;
  onInputChange: (
    name: string,
    value: string | Date | boolean | Permission[] | undefined
  ) => void;
  onSearch: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RoleFilterDialog: FC<RoleFilterDialogProps> = ({
  currentInputs,
  onInputChange,
  onSearch,
  onKeyPress,
  isOpen,
  onOpenChange,
}) => {
  const { t, i18n } = useTranslation("Roles");
  const isRTL = i18n.language !== "en";

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
    onOpenChange(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onOpenChange(true)}
        className={cn(
          "h-10 w-10 rounded-lg border-gray-200",
          "hover:bg-muted/50 hover:text-primary hover:border-primary/50",
          "dark:border-gray-800 dark:hover:border-primary/50",
          // eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding
          "transition-all duration-200"
        )}
        aria-label={t("FilterDialog.Title")}
      >
        <Filter className="h-4 w-4" />
      </Button>

      <CustomDialog
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        icon={Filter}
        title={t("FilterDialog.Title")}
        description={t("FilterDialog.Description")}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("Cancel")}
            </Button>
            <Button type="submit" form="filterForm">
              {t("FilterDialog.ApplyFilters")}
            </Button>
          </>
        }
        rtl={isRTL}
      >
        <form
          id="filterForm"
          onSubmit={handleApplyFilters}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className="space-y-6">
            {/* Basic Information Section */}
            <FormSection title={t("FilterDialog.BasicFilters")}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FilterField
                  field={{
                    key: "name",
                    label: "FilterDialog.Name",
                    icon: Shield,
                    filterType: "text",
                    placeholder: "NamePlaceholder",
                  }}
                  value={currentInputs.name}
                  onChange={(value) => onInputChange("name", value as string)}
                  onKeyPress={onKeyPress}
                  t={t}
                />

                <FilterField
                  field={{
                    key: "kurdishName",
                    label: "FilterDialog.KurdishName",
                    icon: Shield,
                    filterType: "text",
                    placeholder: "KurdishNamePlaceholder",
                  }}
                  value={currentInputs.kurdishName}
                  onChange={(value) =>
                    onInputChange("kurdishName", value as string)
                  }
                  onKeyPress={onKeyPress}
                  t={t}
                />

                <FilterField
                  field={{
                    key: "arabicName",
                    label: "FilterDialog.ArabicName",
                    icon: Shield,
                    filterType: "text",
                    placeholder: "ArabicNamePlaceholder",
                  }}
                  value={currentInputs.arabicName}
                  onChange={(value) =>
                    onInputChange("arabicName", value as string)
                  }
                  onKeyPress={onKeyPress}
                  t={t}
                />

                <FilterField
                  field={{
                    key: "permissions",
                    label: "FilterDialog.Permissions",
                    icon: Shield,
                    filterType: "multiselect",
                    placeholder: "PermissionsPlaceholder",
                    options: Object.values(Permission).map((permission) => ({
                      label: `Permissions.${permission}`,
                      value: permission,
                    })),
                  }}
                  value={currentInputs.permissions}
                  onChange={(value) =>
                    onInputChange("permissions", value as Permission[])
                  }
                  onKeyPress={onKeyPress}
                  t={t}
                />
              </div>
            </FormSection>

            {/* Date Filters Section */}
            <FormSection title={t("FilterDialog.DateFilters")}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FilterField
                  field={{
                    key: "createdAt",
                    label: "FilterDialog.CreatedAt",
                    icon: CalendarIcon,
                    filterType: "date",
                    placeholder: "PickADate",
                  }}
                  value={currentInputs.createdAt}
                  onChange={(value) =>
                    onInputChange("createdAt", value as Date)
                  }
                  onKeyPress={onKeyPress}
                  t={t}
                />

                <FilterField
                  field={{
                    key: "updatedAt",
                    label: "FilterDialog.UpdatedAt",
                    icon: CalendarIcon,
                    filterType: "date",
                    placeholder: "PickADate",
                  }}
                  value={currentInputs.updatedAt}
                  onChange={(value) =>
                    onInputChange("updatedAt", value as Date)
                  }
                  onKeyPress={onKeyPress}
                  t={t}
                />

                <FilterField
                  field={{
                    key: "deletedAt",
                    label: "FilterDialog.DeletedAt",
                    icon: CalendarIcon,
                    filterType: "date",
                    placeholder: "PickADate",
                  }}
                  value={currentInputs.deletedAt}
                  onChange={(value) =>
                    onInputChange("deletedAt", value as Date)
                  }
                  onKeyPress={onKeyPress}
                  t={t}
                />
              </div>
            </FormSection>
          </div>
        </form>
      </CustomDialog>
    </>
  );
};
