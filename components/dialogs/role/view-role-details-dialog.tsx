/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { FC, useState, useEffect } from "react";
import { useTranslation } from "@/i18n/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { RoleWithRelations } from "@/types/models/role";
import { GenericDialogProps } from "@/types/models/common";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { useFetchRoles } from "@/hooks/employee-hooks/use-roles";
import { ViewField } from "@/components/ui/view-field";
import { ROLE_VIEW_SECTIONS } from "@/types/models/role";

// eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding
type TabType = "profile" | "permissions" | "users" | "audit-logs";

interface ViewRoleDetailsDialogProps
  extends Omit<
    GenericDialogProps<never, never, RoleWithRelations>,
    "onSubmit"
  > {
  role: RoleWithRelations;
}

export const ViewRoleDetailsDialog: FC<ViewRoleDetailsDialogProps> = ({
  role,
  open,
  onOpenChange,
}) => {
  const { t, i18n } = useTranslation("Roles");
  const isRTL = i18n.language !== "en";
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  // Add role data refresh capability
  const { data: roleData, refetch } = useFetchRoles({
    filter: { id: role?.id },
    enabled: open && !!role?.id,
  });

  useEffect(() => {
    if (open && role?.id) {
      refetch();
    }
  }, [open, role?.id, refetch]);

  if (!role) return null;

  // Use the most up-to-date role data
  const currentRole = role ?? roleData?.items?.[0];

  const roleStatusColor = currentRole.deletedAt
    ? "bg-red-500/15 text-red-700 dark:text-red-400 ring-red-500/30"
    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-emerald-500/30";

  return (
    <CustomDialog
      isOpen={open}
      onOpenChange={onOpenChange}
      icon={ShieldIcon}
      maxWidth="5xl"
      title={currentRole.name}
      description={t("ViewDialog.Description")}
      rtl={isRTL}
    >
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="flex items-center gap-2 mb-4">
          <Badge
            variant="outline"
            className={cn(
              "px-2 py-1 rounded-lg font-medium ring-1",
              roleStatusColor
            )}
          >
            {currentRole.deletedAt
              ? t("ViewDialog.Deleted")
              : t("ViewDialog.Active")}
          </Badge>
        </div>

        <Tabs
          defaultValue="profile"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabType)}
          className="h-full"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <TabsList
            className="w-full justify-start"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <TabsTrigger value="profile" className="gap-2">
              <ShieldIcon className="h-4 w-4" />
              {t("ViewDialog.Profile")}
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <ShieldIcon className="h-4 w-4" />
              {t("ViewDialog.Permissions")}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <div className="py-6 space-y-6">
              <TabsContent
                value="profile"
                className="m-0 space-y-6"
                dir={isRTL ? "rtl" : "ltr"}
              >
                {ROLE_VIEW_SECTIONS.map((section) => (
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
                        {section.fields
                          .filter((field) => field.key !== "permissions")
                          .map((field) => (
                            <ViewField
                              key={field.key}
                              field={field}
                              value={
                                field.key.includes(".")
                                  ? field.key
                                      .split(".")
                                      .reduce<unknown>(
                                        (obj, key) =>
                                          (obj as Record<string, unknown>)?.[
                                            key
                                          ],
                                        currentRole
                                      )
                                  : (currentRole as Record<string, unknown>)[
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

              <TabsContent
                value="permissions"
                className="m-0 space-y-6"
                dir={isRTL ? "rtl" : "ltr"}
              >
                <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {t("ViewDialog.Permissions")}
                  </h3>
                  <Card className="p-4">
                    <div className="grid gap-4">
                      {Object.entries(
                        currentRole.permissions.reduce(
                          (acc, permission) => {
                            const type = permission.split("_")[0];
                            if (!acc[type]) {
                              acc[type] = [];
                            }
                            acc[type].push(permission);
                            return acc;
                          },
                          {} as Record<string, string[]>
                        )
                      ).map(([type, permissions]) => (
                        <div key={type} className="space-y-2">
                          <h4 className="text-sm font-medium">{t(type)}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {permissions.map((permission) => (
                              <div
                                key={permission}
                                className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md"
                              >
                                <ShieldIcon className="h-4 w-4 text-primary" />
                                <span className="text-sm">
                                  {t(`PermissionsTypes.${permission}`)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </CustomDialog>
  );
};
