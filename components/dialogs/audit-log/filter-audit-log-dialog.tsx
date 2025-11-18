/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { FC } from "react";
import { useTranslation } from "@/i18n/client";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FormSection } from "@/components/ui/form-section";
import { FilterField } from "@/components/ui/filter-field";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { AuditLogFilterParams } from "@/types/models/audit-log";
import { AUDIT_LOG_FILTER_SECTIONS } from "@/types/models/audit-log";

interface AuditLogFilterDialogProps {
  currentInputs: AuditLogFilterParams;
  onInputChange: (
    name: string,
    value: string | Date | boolean | undefined
  ) => void;
  onSearch: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuditLogFilterDialog: FC<AuditLogFilterDialogProps> = ({
  currentInputs,
  onInputChange,
  onSearch,
  onKeyPress,
  isOpen,
  onOpenChange,
}) => {
  const { t, i18n } = useTranslation("AuditLogs");
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
        dir={isRTL ? "rtl" : "ltr"}
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
          <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
            {AUDIT_LOG_FILTER_SECTIONS.map((section) => (
              <FormSection
                key={section.title}
                title={t(`FilterDialog.${section.title}`)}
              >
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  {section.fields.map((field) => (
                    <FilterField
                      key={field.key}
                      field={{
                        ...field,
                        label: `FilterDialog.${field.label}`,
                        placeholder: field.placeholder
                          ? `FilterDialog.${field.placeholder}`
                          : undefined,
                        options: field.options?.map((option) => ({
                          ...option,
                          label: `FilterDialog.${option.label}`,
                        })),
                      }}
                      value={currentInputs[field.key]}
                      onChange={(value) =>
                        onInputChange(
                          field.key,
                          value as string | Date | boolean
                        )
                      }
                      onKeyPress={onKeyPress}
                      t={t}
                    />
                  ))}
                </div>
              </FormSection>
            ))}
          </div>
        </form>
      </CustomDialog>
    </>
  );
};
