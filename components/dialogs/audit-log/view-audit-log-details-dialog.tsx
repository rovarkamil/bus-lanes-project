/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { FC, useState, useEffect } from "react";
import { useTranslation } from "@/i18n/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HistoryIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AuditLogWithRelations } from "@/types/models/audit-log";
import { GenericDialogProps } from "@/types/models/common";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { useFetchAuditLogs } from "@/hooks/employee-hooks/use-audit-logs";
import { ViewField } from "@/components/ui/view-field";
import { AUDIT_LOG_VIEW_SECTIONS } from "@/types/models/audit-log";

interface ViewAuditLogDetailsDialogProps
  extends Omit<
    GenericDialogProps<never, never, AuditLogWithRelations>,
    "onSubmit"
  > {
  auditLog: AuditLogWithRelations;
}

export const ViewAuditLogDetailsDialog: FC<ViewAuditLogDetailsDialogProps> = ({
  auditLog,
  open,
  onOpenChange,
}) => {
  const { t, i18n } = useTranslation("AuditLogs");
  const isRTL = i18n.language !== "en";
  const [activeTab, setActiveTab] = useState<"details">("details");

  // Add audit log data refresh capability
  const { data: auditLogData, refetch } = useFetchAuditLogs({
    filter: { id: auditLog?.id },
    enabled: open && !!auditLog?.id,
  });

  useEffect(() => {
    if (open && auditLog?.id) {
      refetch();
    }
  }, [open, auditLog?.id, refetch]);

  if (!auditLog) return null;

  // Use the most up-to-date audit log data
  const currentAuditLog = auditLog ?? auditLogData?.items?.[0];

  const actionColor =
    currentAuditLog.action === "DELETE"
      ? "bg-red-500/15 text-red-700 dark:text-red-400 ring-red-500/30"
      : currentAuditLog.action === "UPDATE"
        ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 ring-yellow-500/30"
        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-emerald-500/30";

  return (
    <CustomDialog
      isOpen={open}
      onOpenChange={onOpenChange}
      icon={HistoryIcon}
      maxWidth="5xl"
      title={t("ViewDialog.Title")}
      description={t("ViewDialog.Description")}
      rtl={isRTL}
    >
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="flex items-center gap-2 mb-4">
          <Badge
            variant="outline"
            className={cn(
              "px-2 py-1 rounded-lg font-medium ring-1",
              actionColor
            )}
          >
            {t(`ViewDialog.${currentAuditLog.action}`)}
          </Badge>
        </div>

        <Tabs
          defaultValue="details"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "details")}
          className="h-full"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <TabsList
            className="w-full justify-start"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <TabsTrigger value="details" className="gap-2">
              <HistoryIcon className="h-4 w-4" />
              {t("ViewDialog.Details")}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <div className="py-6 space-y-6">
              <TabsContent value="details" className="m-0 space-y-6">
                {AUDIT_LOG_VIEW_SECTIONS.map((section) => (
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
                                      currentAuditLog
                                    )
                                : (currentAuditLog as Record<string, unknown>)[
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
