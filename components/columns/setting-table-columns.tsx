"use client";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/data-table/confirmation-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type Column, type RenderContext } from "@/types/data-table";
import {
  type SettingWithRelations,
  SETTING_ACTION_BUTTONS,
} from "@/types/models/setting";
import { formatDate } from "@/lib/formatDate";
import { cn } from "@/lib/utils";
import { UserType, SettingType } from "@prisma/client";
import { Key, FileText, Type, Lock, Trash2 } from "lucide-react";

const SettingKeyCell = ({ setting }: { setting: SettingWithRelations }) => (
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-2">
      <Key className="h-4 w-4 text-primary" />
      <span className="font-medium text-foreground">{setting.key}</span>
    </div>
  </div>
);

const SettingValueCell = ({ setting }: { setting: SettingWithRelations }) => (
  <div className="flex items-center gap-2">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground line-clamp-1">
              {setting.value}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="max-w-[300px]">
          <div className="space-y-1.5">
            <span className="text-sm font-mono whitespace-pre-wrap break-all">
              {setting.value}
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

const SettingTypeCell = ({
  type,
  t,
}: {
  type: SettingType;
  t: (key: string) => string;
}) => (
  <div className="flex items-center gap-2">
    <Type className="h-4 w-4 text-primary" />
    <span className="text-sm text-muted-foreground">{t(`Types.${type}`)}</span>
  </div>
);

const SettingIsLockedCell = ({
  isLocked,
  t,
}: {
  isLocked: boolean;
  t: (key: string) => string;
}) => (
  <div className="flex items-center gap-2">
    <Lock className="h-4 w-4 text-primary" />
    <span className="text-sm text-muted-foreground">
      {isLocked ? t("Yes") : t("No")}
    </span>
  </div>
);

const DateCell = ({ date }: { date: Date }) => (
  <span className="text-sm text-muted-foreground">{formatDate(date)}</span>
);

const ActionButtons = ({
  item,
  context,
}: {
  item: SettingWithRelations;
  context: RenderContext<SettingWithRelations>;
}) => (
  <div className="flex items-center gap-2">
    {SETTING_ACTION_BUTTONS.map((button, idx) => {
      const hasPermission =
        !button.requiresPermission ||
        context.session?.user.userType === UserType.SUPER_ADMIN ||
        context.session?.user.role?.permissions.includes(
          button.requiresPermission
        );

      const Icon = button.icon;

      // Check specifically for the delete button by icon type
      if (button.icon === Trash2) {
        return (
          <ConfirmationDialog
            key={idx}
            title={context.t("AreYouSure")}
            message={context.t("AreYouSureYouWantToDeleteThisSetting")}
            onConfirm={() =>
              button.onClick(item, {
                handleDelete: context.handlers.handleDelete,
              })
            }
            confirmLabel={
              context.isDeleting ? context.t("Deleting") : context.t("Delete")
            }
            cancelLabel={context.t("Cancel")}
            variant="destructive"
            isRtl={context.handlers.isRtl}
            disabled={context.isDeleting}
          >
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", button.className)}
              disabled={!hasPermission}
            >
              <Icon className="h-4 w-4" />
            </Button>
          </ConfirmationDialog>
        );
      }

      return (
        <TooltipProvider key={idx}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", button.className)}
                disabled={!hasPermission}
                onClick={() =>
                  button.onClick(item, {
                    setSelectedItem: context.handlers.setSelectedItem,
                    setIsViewDialogOpen: context.handlers.setIsViewDialogOpen,
                    handleOpenUpdateDialog:
                      context.handlers.handleOpenUpdateDialog,
                  })
                }
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>{context.t(button.tooltip)}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    })}
  </div>
);

// Define the columns with translatable labels
const getColumns = (
  t: (key: string) => string
): Column<SettingWithRelations>[] => [
  {
    key: "key",
    label: t("Key"),
    sortable: true,
    showInMobile: true,
    render: (setting: SettingWithRelations) => (
      <SettingKeyCell setting={setting} />
    ),
  },
  {
    key: "value",
    label: t("Value"),
    sortable: false,
    showInMobile: true,
    render: (setting: SettingWithRelations) => (
      <SettingValueCell setting={setting} />
    ),
  },
  {
    key: "type",
    label: t("Type"),
    sortable: true,
    showInMobile: true,
    render: (setting: SettingWithRelations) => (
      <SettingTypeCell type={setting.type} t={t} />
    ),
  },
  {
    key: "isLocked",
    label: t("IsLocked"),
    sortable: true,
    showInMobile: true,
    render: (setting: SettingWithRelations) => (
      <SettingIsLockedCell isLocked={setting.isLocked} t={t} />
    ),
  },
  {
    key: "createdAt",
    label: t("Created"),
    sortable: true,
    showInMobile: false,
    render: (setting: SettingWithRelations) => (
      <DateCell date={setting.createdAt} />
    ),
  },
  {
    key: "updatedAt",
    label: t("Updated"),
    sortable: true,
    showInMobile: false,
    render: (setting: SettingWithRelations) => (
      <DateCell date={setting.updatedAt} />
    ),
  },
  {
    key: "actions",
    label: t("Actions"),
    sortable: false,
    showInMobile: true,
    render: (
      setting: SettingWithRelations,
      context: RenderContext<SettingWithRelations>
    ) => <ActionButtons item={setting} context={context} />,
  },
];

// Export the function to generate translated columns
export { getColumns as getSettingColumns };
