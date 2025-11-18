"use client";

import { FC, useState, useEffect } from "react";
import { useTranslation } from "@/i18n/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { SettingWithRelations } from "@/types/models/setting";
import { GenericDialogProps } from "@/types/models/common";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { useFetchSettings } from "@/hooks/employee-hooks/use-settings";
import { ViewField } from "@/components/ui/view-field";
import { SETTING_VIEW_SECTIONS } from "@/types/models/setting";

type TabType = "details";

interface ViewSettingDetailsDialogProps
  extends Omit<
    GenericDialogProps<never, never, SettingWithRelations>,
    "onSubmit"
  > {
  setting: SettingWithRelations;
}

export const ViewSettingDetailsDialog: FC<ViewSettingDetailsDialogProps> = ({
  setting,
  open,
  onOpenChange,
}) => {
  const { t, i18n } = useTranslation("Settings");
  const isRTL = i18n.language !== "en";
  const [activeTab] = useState<TabType>("details");

  // Add setting data refresh capability
  const { data: settingData, refetch } = useFetchSettings({
    filter: { id: setting?.id },
    enabled: open && !!setting?.id,
  });

  useEffect(() => {
    if (open && setting?.id) {
      refetch();
    }
  }, [open, setting?.id, refetch]);

  if (!setting) return null;

  // Use the most up-to-date setting data
  const currentSetting = setting ?? settingData?.items?.[0];

  const settingStatusColor = currentSetting.deletedAt
    ? "bg-red-500/15 text-red-700 dark:text-red-400 ring-red-500/30"
    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-emerald-500/30";

  return (
    <CustomDialog
      isOpen={open}
      onOpenChange={onOpenChange}
      icon={Settings}
      maxWidth="5xl"
      title={currentSetting.key}
      description={t("ViewDialog.Description")}
      rtl={isRTL}
    >
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="flex items-center gap-2 mb-4">
          <Badge
            variant="outline"
            className={cn(
              "px-2 py-1 rounded-lg font-medium ring-1",
              settingStatusColor
            )}
          >
            {currentSetting.deletedAt
              ? t("ViewDialog.Deleted")
              : t("ViewDialog.Active")}
          </Badge>
        </div>

        <Tabs
          defaultValue="details"
          value={activeTab}
          className="h-full"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <TabsList
            className="w-full justify-start"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <TabsTrigger value="details" className="gap-2">
              <Settings className="h-4 w-4" />
              {t("ViewDialog.Details")}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <div className="py-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
              <TabsContent
                value="details"
                className="m-0 space-y-6"
                dir={isRTL ? "rtl" : "ltr"}
              >
                {SETTING_VIEW_SECTIONS.map((section) => (
                  <div
                    key={section.title}
                    className="space-y-4"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {t(`ViewDialog.${section.title}`)}
                    </h3>
                    <Card className="p-4" dir={isRTL ? "rtl" : "ltr"}>
                      <div className="grid gap-2">
                        {section.fields.map((field) => (
                          <ViewField
                            key={field.key}
                            field={field}
                            value={
                              field.key.includes(".")
                                ? field.key
                                    .split(".")
                                    .reduce<unknown>(
                                      (obj, key) =>
                                        (obj as Record<string, unknown>)?.[key],
                                      currentSetting
                                    )
                                : (currentSetting as Record<string, unknown>)[
                                    field.key
                                  ]
                            }
                            t={t}
                          />
                        ))}
                      </div>
                    </Card>
                  </div>
                ))}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </CustomDialog>
  );
};
