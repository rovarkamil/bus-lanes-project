"use client";

import { useMemo } from "react";
import { Column } from "@/types/data-table";
import { BusLaneWithRelations } from "@/types/models/bus-lane";
import { formatDate } from "@/lib/formatDate";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Activity, Route as RouteIcon, MapPin, CircleDot } from "lucide-react";

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
];
