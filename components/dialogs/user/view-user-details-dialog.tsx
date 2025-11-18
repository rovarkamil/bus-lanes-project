/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { FC, useState, useEffect } from "react";
import { useTranslation } from "@/i18n/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { UserWithRelations } from "@/types/models/user";
import { GenericDialogProps } from "@/types/models/common";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { useFetchUsers } from "@/hooks/employee-hooks/use-users";
import { ViewField } from "@/components/ui/view-field";
import { USER_VIEW_SECTIONS } from "@/types/models/user";
import { UserType } from "@prisma/client";

// eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding
type TabType = "profile" | "roles" | "activity" | "audit-logs" | "orders";

interface ViewUserDetailsDialogProps
  extends Omit<
    GenericDialogProps<never, never, UserWithRelations>,
    "onSubmit"
  > {
  user: UserWithRelations;
}

export const ViewUserDetailsDialog: FC<ViewUserDetailsDialogProps> = ({
  user,
  open,
  onOpenChange,
}) => {
  const { t, i18n } = useTranslation("Users");
  const isRTL = i18n.language !== "en";
  const { data: session } = useSession();
  const isAdmin = session?.user?.userType === UserType.SUPER_ADMIN;
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  // Add user data refresh capability
  const { data: userData, refetch } = useFetchUsers({
    id: user?.id,
    enabled: open && !!user?.id,
  });

  useEffect(() => {
    if (open && user?.id) {
      refetch();
    }
  }, [open, user?.id, refetch]);

  if (!user) return null;

  // Use the most up-to-date user data
  const currentUser = user ?? userData?.items?.[0];

  const userStatusColor = currentUser.deletedAt
    ? "bg-red-500/15 text-red-700 dark:text-red-400 ring-red-500/30"
    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-emerald-500/30";

  return (
    <CustomDialog
      isOpen={open}
      onOpenChange={onOpenChange}
      icon={UserIcon}
      maxWidth="5xl"
      title={currentUser.name}
      description={t("ViewDialog.Description")}
      rtl={isRTL}
    >
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="flex items-center gap-2 mb-4">
          {Boolean(
            isAdmin && currentUser.userType === UserType.SUPER_ADMIN
          ) && (
            <Badge variant="secondary" className="font-medium">
              {t("Admin")}
            </Badge>
          )}
          <Badge
            variant="outline"
            className={cn(
              "px-2 py-1 rounded-lg font-medium ring-1",
              userStatusColor
            )}
          >
            {currentUser.deletedAt
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
              <UserIcon className="h-4 w-4" />
              {t("ViewDialog.Profile")}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <div className="py-6 space-y-6">
              <TabsContent value="profile" className="m-0 space-y-6">
                {USER_VIEW_SECTIONS.map((section) => (
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
                                      currentUser
                                    )
                                : (currentUser as Record<string, unknown>)[
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
