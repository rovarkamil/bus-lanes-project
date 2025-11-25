"use client";

import { Column, RenderContext } from "@/types/data-table";
import {
  BusScheduleWithRelations,
  BUS_SCHEDULE_ACTION_BUTTONS,
} from "@/types/models/bus-schedule";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatDate";
import {
  MapPin,
  Route as RouteIcon,
  Clock,
  Calendar,
  ToggleLeft,
} from "lucide-react";
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

const RelationCell = ({
  icon: Icon,
  label,
  value,
  t,
}: {
  icon: typeof RouteIcon;
  label: string;
  value?: string;
  t: Translate;
}) => (
  <div className="flex items-center gap-2 text-sm">
    <Icon className="w-4 h-4 text-muted-foreground" />
    <span className="font-medium">{t(label)}</span>
    <span className="text-muted-foreground">{value ?? "—"}</span>
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
  item: BusScheduleWithRelations;
  context: RenderContext<BusScheduleWithRelations>;
}) => {
  return (
    <div className="flex items-center gap-2">
      {BUS_SCHEDULE_ACTION_BUTTONS.map((button, idx) => {
        const hasPermission =
          !button.requiresPermission ||
          context.session?.user.userType === UserType.SUPER_ADMIN ||
          context.session?.user.role?.permissions.includes(
            button.requiresPermission
          );

        const Icon = button.icon;

        if (button.requiresPermission === Permission.DELETE_BUS_SCHEDULE) {
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
};

export const busScheduleColumns = (
  t: Translate
): Column<BusScheduleWithRelations>[] => [
  {
    key: "route",
    label: t("Table.Route"),
    sortable: true,
    render: (schedule) => (
      <RelationCell
        icon={RouteIcon}
        label="Table.Route"
        value={schedule.route?.routeNumber ?? schedule.route?.id}
        t={t}
      />
    ),
  },
  {
    key: "stop",
    label: t("Table.Stop"),
    sortable: true,
    render: (schedule) => (
      <RelationCell
        icon={MapPin}
        label="Table.Stop"
        value={schedule.stop?.name?.en ?? t("Common.NotAvailable")}
        t={t}
      />
    ),
  },
  {
    key: "departureTime",
    label: t("Table.Departure"),
    sortable: true,
    render: (schedule) => (
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{schedule.departureTime}</span>
      </div>
    ),
  },
  {
    key: "dayOfWeek",
    label: t("Table.Day"),
    sortable: true,
    render: (schedule) => (
      <Badge variant="secondary">{t(`DayOfWeek.${schedule.dayOfWeek}`)}</Badge>
    ),
  },
  {
    key: "specificDate",
    label: t("Table.SpecificDate"),
    sortable: true,
    render: (schedule) =>
      schedule.specificDate ? (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{formatDate(schedule.specificDate)}</span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">
          {t("Common.NotAvailable")}
        </span>
      ),
  },
  {
    key: "notes",
    label: t("Table.Notes"),
    sortable: false,
    className: "max-w-[220px]",
    render: (schedule) =>
      schedule.notes ? (
        <span className="text-sm text-muted-foreground line-clamp-2">
          {schedule.notes}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">
          {t("Common.NotAvailable")}
        </span>
      ),
  },
  {
    key: "status",
    label: t("Table.Status"),
    sortable: true,
    render: (schedule) => (
      <StatusBadge isActive={schedule.isActive ?? false} t={t} />
    ),
  },
  {
    key: "actions",
    label: t("Table.Actions"),
    sortable: false,
    className: "w-[120px]",
    render: (schedule, context) => (
      <ActionButtons item={schedule} context={context} />
    ),
  },
];
