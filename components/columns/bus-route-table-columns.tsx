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

type Translate = (key: string, options?: Record<string, unknown>) => string;

const RouteInfoCell = ({ route }: { route: BusRouteWithRelations }) => (
  <div className="flex flex-col">
    <span className="text-sm font-medium">{route.name?.en ?? "-"}</span>
    {route.description?.en && (
      <span className="text-xs text-muted-foreground line-clamp-2">
        {route.description.en}
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

const RelationBadge = ({
  label,
  count,
  t,
}: {
  label: string;
  count: number;
  t: Translate;
}) => (
  <Badge variant="outline" className="bg-muted text-foreground border-border">
    {t(label)}: {count}
  </Badge>
);

const CurrencyCell = ({
  fare,
  currency,
  t,
}: {
  fare?: number | null;
  currency: string;
  t: Translate;
}) =>
  fare !== undefined && fare !== null ? (
    <div className="flex items-center gap-2">
      <DollarSign className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm font-medium">{fare.toFixed(2)} </span>
      <Badge variant="outline" className="ml-1">
        {t(`Currency.${currency}`)}
      </Badge>
    </div>
  ) : (
    <span className="text-sm text-muted-foreground">
      {t("Common.NotAvailable")}
    </span>
  );

const TimingCell = ({
  route,
  t,
}: {
  route: BusRouteWithRelations;
  t: Translate;
}) => (
  <div className="flex flex-col gap-1">
    {route.frequency && (
      <RelationBadge
        label="Table.FrequencyLabel"
        count={route.frequency}
        t={t}
      />
    )}
    {route.duration && (
      <RelationBadge label="Table.DurationLabel" count={route.duration} t={t} />
    )}
  </div>
);

const RelationsCell = ({
  route,
  t,
}: {
  route: BusRouteWithRelations;
  t: Translate;
}) => (
  <div className="flex flex-col gap-1">
    <RelationBadge label="Table.Lanes" count={route.lanes?.length ?? 0} t={t} />
    <RelationBadge label="Table.Stops" count={route.stops?.length ?? 0} t={t} />
    <RelationBadge
      label="Table.Schedules"
      count={route.schedules?.length ?? 0}
      t={t}
    />
  </div>
);

const ServiceCell = ({
  serviceType,
  t,
  tTransportServices,
}: {
  serviceType?: string | null;
  t: Translate;
  tTransportServices: Translate;
}) => (
  <div className="flex items-center gap-2">
    <RouteIcon className="w-4 h-4 text-muted-foreground" />
    <span className="text-sm">
      {serviceType
        ? tTransportServices(`TransportServiceType.${serviceType}`)
        : t("Common.NotAvailable")}
    </span>
  </div>
);

export const busRouteColumns = (
  t: Translate,
  tTransportServices: Translate
): Column<BusRouteWithRelations>[] => [
  {
    key: "name",
    label: t("Table.Name"),
    sortable: true,
    render: (route) => <RouteInfoCell route={route} />,
  },
  {
    key: "routeNumber",
    label: t("Table.Route"),
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
    label: t("Table.Direction"),
    sortable: true,
    render: (route) => (
      <Badge variant="secondary">
        <RouteIcon className="w-3 h-3 mr-1" />
        {t(`RouteDirection.${route.direction}`)}
      </Badge>
    ),
  },
  {
    key: "fare",
    label: t("Table.Fare"),
    sortable: true,
    render: (route) => (
      <CurrencyCell
        fare={route.fare}
        currency={route.currency ?? "IQD"}
        t={t}
      />
    ),
  },
  {
    key: "duration",
    label: t("Table.Timing"),
    sortable: false,
    render: (route) => <TimingCell route={route} t={t} />,
  },
  {
    key: "relations",
    label: t("Table.Relations"),
    sortable: false,
    render: (route) => <RelationsCell route={route} t={t} />,
  },
  {
    key: "service",
    label: t("Table.Service"),
    sortable: true,
    render: (route) => (
      <ServiceCell
        serviceType={route.service?.type}
        t={t}
        tTransportServices={tTransportServices}
      />
    ),
  },
  {
    key: "isActive",
    label: t("Table.Status"),
    sortable: true,
    render: (route) => <StatusBadge isActive={route.isActive ?? false} t={t} />,
  },
  {
    key: "createdAt",
    label: t("Table.Created"),
    sortable: true,
    render: (route) => (
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm">{formatDate(route.createdAt)}</span>
      </div>
    ),
  },
];
