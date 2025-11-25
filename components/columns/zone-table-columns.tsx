"use client";

import { Column, RenderContext } from "@/types/data-table";
import { ZoneWithRelations, ZONE_ACTION_BUTTONS } from "@/types/models/zone";
import { Badge } from "@/components/ui/badge";
import { ToggleLeft, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/data-table/confirmation-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Permission, UserType } from "@prisma/client";

type Translate = (key: string, options?: Record<string, unknown>) => string;

const ZoneInfoCell = ({
  zone,
  t,
}: {
  zone: ZoneWithRelations;
  t: Translate;
}) => (
  <div className="flex flex-col">
    <span className="text-sm font-medium">
      {zone.name?.en ?? t("Common.NotAvailable")}
    </span>
    {zone.description?.en && (
      <span className="text-xs text-muted-foreground line-clamp-2">
        {zone.description.en}
      </span>
    )}
  </div>
);

const StatusBadge = ({ isActive, t }: { isActive: boolean; t: Translate }) => (
  <Badge
    variant="outline"
    className={cn(
      "border font-medium",
      isActive
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-rose-50 text-rose-700 border-rose-200"
    )}
  >
    <ToggleLeft className="w-3 h-3 mr-1" />
    {isActive ? t("Common.Active") : t("Common.Inactive")}
  </Badge>
);

const ActionButtons = ({
  item,
  context,
}: {
  item: ZoneWithRelations;
  context: RenderContext<ZoneWithRelations>;
}) => (
  <div className="flex items-center gap-2">
    {ZONE_ACTION_BUTTONS.map((button, idx) => {
      const hasPermission =
        !button.requiresPermission ||
        context.session?.user.userType === UserType.SUPER_ADMIN ||
        context.session?.user.role?.permissions.includes(
          button.requiresPermission
        );

      const Icon = button.icon;

      if (button.requiresPermission === Permission.DELETE_ZONE) {
        return (
          <ConfirmationDialog
            key={idx}
            title={context.t("Actions.DeleteConfirmTitle")}
            message={context.t("Actions.DeleteConfirmMessage")}
            onConfirm={() =>
              button.onClick(item, {
                handleDelete: context.handlers.handleDelete,
              })
            }
            confirmLabel={
              context.isDeleting
                ? context.t("Actions.Deleting")
                : context.t("Actions.Delete")
            }
            cancelLabel={context.t("Common.Cancel")}
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

export const zoneColumns = (t: Translate): Column<ZoneWithRelations>[] => [
  {
    key: "name",
    label: t("Table.Zone"),
    sortable: true,
    render: (zone) => <ZoneInfoCell zone={zone} t={t} />,
  },
  {
    key: "color",
    label: t("Table.Color"),
    sortable: false,
    render: (zone) => (
      <div className="flex items-center gap-2">
        <span
          className="h-5 w-5 rounded-full ring-1 ring-border"
          style={{ backgroundColor: zone.color ?? "#0066CC" }}
        />
        <span className="text-sm">
          {zone.color ?? t("Common.NotAvailable")}
        </span>
      </div>
    ),
  },
  {
    key: "stops",
    label: t("Table.Stops"),
    sortable: false,
    render: (zone) => (
      <Badge variant="secondary">
        <Layers className="w-3 h-3 mr-1" />
        {zone.stops?.length ?? 0}
      </Badge>
    ),
  },
  {
    key: "status",
    label: t("Table.Status"),
    sortable: true,
    render: (zone) => <StatusBadge isActive={zone.isActive ?? false} t={t} />,
  },
  {
    key: "actions",
    label: t("Table.Actions"),
    sortable: false,
    className: "w-[120px]",
    render: (zone, context) => <ActionButtons item={zone} context={context} />,
  },
];
