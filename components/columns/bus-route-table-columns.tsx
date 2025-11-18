"use client";

import { Column } from "@/types/data-table";
import { BusRouteWithRelations } from "@/types/models/bus-route";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatDate";
import {
  Route as RouteIcon,
  Clock,
  Hash,
  DollarSign,
  ToggleLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const StatusBadge = ({ isActive }: { isActive: boolean }) => (
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
    {isActive ? "Active" : "Inactive"}
  </Badge>
);

const RelationBadge = ({ label, count }: { label: string; count: number }) => (
  <Badge variant="outline" className="bg-muted text-foreground border-border">
    {label}: {count}
  </Badge>
);

const CurrencyCell = ({
  fare,
  currency,
}: {
  fare?: number | null;
  currency: string;
}) =>
  fare !== undefined && fare !== null ? (
    <div className="flex items-center gap-2">
      <DollarSign className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm font-medium">{fare.toFixed(2)} </span>
      <Badge variant="outline" className="ml-1">
        {currency}
      </Badge>
    </div>
  ) : (
    <span className="text-sm text-muted-foreground">—</span>
  );

export const busRouteColumns: Column<BusRouteWithRelations>[] = [
  {
    key: "name",
    label: "Name",
    sortable: true,
    render: (route) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium">{route.name?.en ?? "-"}</span>
        {route.description?.en && (
          <span className="text-xs text-muted-foreground line-clamp-2">
            {route.description.en}
          </span>
        )}
      </div>
    ),
  },
  {
    key: "routeNumber",
    label: "Route",
    sortable: true,
    render: (route) => (
      <Badge
        variant="outline"
        className="bg-blue-50 text-blue-700 border-blue-200"
      >
        <Hash className="w-3 h-3 mr-1" />
        {route.routeNumber ?? "—"}
      </Badge>
    ),
  },
  {
    key: "direction",
    label: "Direction",
    sortable: true,
    render: (route) => (
      <Badge variant="secondary">
        <RouteIcon className="w-3 h-3 mr-1" />
        {route.direction}
      </Badge>
    ),
  },
  {
    key: "fare",
    label: "Fare",
    sortable: true,
    render: (route) => (
      <CurrencyCell fare={route.fare} currency={route.currency ?? "IQD"} />
    ),
  },
  {
    key: "duration",
    label: "Timing",
    sortable: false,
    render: (route) => (
      <div className="flex flex-col gap-1">
        {route.frequency && (
          <RelationBadge label="Freq (min)" count={route.frequency} />
        )}
        {route.duration && (
          <RelationBadge label="Duration (min)" count={route.duration} />
        )}
      </div>
    ),
  },
  {
    key: "relations",
    label: "Relations",
    sortable: false,
    render: (route) => (
      <div className="flex flex-col gap-1">
        <RelationBadge label="Lanes" count={route.lanes?.length ?? 0} />
        <RelationBadge label="Stops" count={route.stops?.length ?? 0} />
        <RelationBadge label="Schedules" count={route.schedules?.length ?? 0} />
      </div>
    ),
  },
  {
    key: "service",
    label: "Service",
    sortable: true,
    render: (route) => (
      <div className="flex items-center gap-2">
        <RouteIcon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm">{route.service?.type ?? "—"}</span>
      </div>
    ),
  },
  {
    key: "isActive",
    label: "Status",
    sortable: true,
    render: (route) => <StatusBadge isActive={route.isActive ?? false} />,
  },
  {
    key: "createdAt",
    label: "Created",
    sortable: true,
    render: (route) => (
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm">{formatDate(route.createdAt)}</span>
      </div>
    ),
  },
];
