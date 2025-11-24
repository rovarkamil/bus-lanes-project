"use client";

import { useMemo } from "react";
import { Column, RenderContext } from "@/types/data-table";
import {
  BusLaneWithRelations,
  BUS_LANE_ACTION_BUTTONS,
} from "@/types/models/bus-lane";
import { formatDate } from "@/lib/formatDate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/data-table/confirmation-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Activity, Route as RouteIcon, MapPin, CircleDot } from "lucide-react";
import { UserType, Permission } from "@prisma/client";

type Translate = (key: string, options?: Record<string, unknown>) => string;

const PathLengthCell = ({ path, t }: { path: unknown; t: Translate }) => {
  const length = useMemo(() => {
    if (!Array.isArray(path)) return 0;
    return path.length;
  }, [path]);

  return (
    <Badge
      variant="outline"
      className="bg-blue-50 text-blue-700 border-blue-200"
    >
      <Activity className="w-3 h-3 mr-1" />
      {t("Table.PathPointsBadge", { count: length })}
    </Badge>
  );
};

const RelationCountCell = ({
  label,
  count,
  icon: Icon,
}: {
  label: string;
  count: number;
  icon: typeof RouteIcon;
}) => (
  <div className="flex items-center gap-2">
    <Icon className="w-4 h-4 text-muted-foreground" />
    <span className="text-sm text-foreground font-medium">
      {label}: {count}
    </span>
  </div>
);

const ColorCell = ({ color }: { color: string }) => (
  <div className="flex items-center gap-2">
    <span
      className="h-5 w-5 rounded-full ring-1 ring-border"
      style={{ backgroundColor: color }}
    />
    <span className="text-sm">{color}</span>
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
    <CircleDot className="w-3 h-3 mr-1" />
    {isActive ? t("Common.Active") : t("Common.Inactive")}
  </Badge>
);

const DateCell = ({ value }: { value: Date }) => (
  <div className="flex flex-col">
    <span className="text-sm font-medium text-foreground">
      {formatDate(value)}
    </span>
    <span className="text-xs text-muted-foreground">
      {new Date(value).toLocaleTimeString()}
    </span>
  </div>
);

const ActionButtons = ({
  item,
  context,
}: {
  item: BusLaneWithRelations;
  context: RenderContext<BusLaneWithRelations>;
}) => {
  return (
    <div className="flex items-center gap-2">
      {BUS_LANE_ACTION_BUTTONS.map((button, idx) => {
        const hasPermission =
          !button.requiresPermission ||
          context.session?.user.userType === UserType.SUPER_ADMIN ||
          context.session?.user.role?.permissions.includes(
            button.requiresPermission
          );

        const Icon = button.icon;

        if (button.requiresPermission === Permission.DELETE_BUS_LANE) {
          return (
            <ConfirmationDialog
              key={idx}
              title={context.t("AreYouSure")}
              message={context.t("AreYouSureYouWantToDeleteThisBusLane")}
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
};

export const busLaneColumns = (
  t: Translate
): Column<BusLaneWithRelations>[] => [
  {
    key: "name",
    label: t("Table.Name"),
    sortable: true,
    render: (lane) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {lane.name?.en ?? t("Common.NotAvailable")}
        </span>
        {lane.description?.en && (
          <span className="text-xs text-muted-foreground line-clamp-2">
            {lane.description.en}
          </span>
        )}
      </div>
    ),
  },
  {
    key: "path",
    label: t("Table.PathPoints"),
    sortable: false,
    render: (lane) => <PathLengthCell path={lane.path} t={t} />,
  },
  {
    key: "color",
    label: t("Table.Color"),
    sortable: false,
    render: (lane) => <ColorCell color={lane.color} />,
  },
  {
    key: "relations",
    label: t("Table.Relations"),
    sortable: false,
    className: "min-w-[220px]",
    render: (lane) => (
      <div className="flex flex-col gap-1">
        <RelationCountCell
          icon={MapPin}
          label={t("Table.Stops")}
          count={lane.stops?.length ?? 0}
        />
        <RelationCountCell
          icon={RouteIcon}
          label={t("Table.Routes")}
          count={lane.routes?.length ?? 0}
        />
      </div>
    ),
  },
  {
    key: "isActive",
    label: t("Table.Status"),
    sortable: true,
    render: (lane) => <StatusBadge isActive={lane.isActive ?? false} t={t} />,
  },
  {
    key: "service",
    label: t("Table.Service"),
    sortable: true,
    render: (lane) => (
      <div className="flex items-center gap-2">
        <RouteIcon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm">
          {lane.service?.type
            ? t(`TransportServiceType.${lane.service.type}`, {
                defaultValue: lane.service.type,
              })
            : t("Common.None")}
        </span>
      </div>
    ),
  },
  {
    key: "createdAt",
    label: t("Table.Created"),
    sortable: true,
    render: (lane) => <DateCell value={lane.createdAt} />,
  },
  {
    key: "actions",
    label: t("Table.Actions"),
    sortable: false,
    className: "w-[120px]",
    render: (lane, context) => <ActionButtons item={lane} context={context} />,
  },
];
