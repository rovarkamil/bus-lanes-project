"use client";

import { Column } from "@/types/data-table";
import { TransportServiceWithRelations } from "@/types/models/transport-service";
import { Badge } from "@/components/ui/badge";
import { Bus, Gauge, Clock, ToggleLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Translate = (key: string, options?: Record<string, unknown>) => string;

const ServiceInfoCell = ({
  service,
}: {
  service: TransportServiceWithRelations;
}) => (
  <div className="flex flex-col">
    <span className="text-sm font-medium">{service.name?.en ?? "-"}</span>
    {service.description?.en && (
      <span className="text-xs text-muted-foreground line-clamp-2">
        {service.description.en}
      </span>
    )}
  </div>
);

const CapacityCell = ({
  capacity,
  t,
}: {
  capacity?: number | null;
  t: Translate;
}) =>
  capacity ? (
    <Badge
      variant="outline"
      className="bg-blue-50 text-blue-700 border-blue-200"
    >
      <Gauge className="w-3 h-3 mr-1" />
      {capacity}
    </Badge>
  ) : (
    <span className="text-sm text-muted-foreground">
      {t("Common.NotAvailable")}
    </span>
  );

const OperatingHoursCell = ({
  from,
  to,
  t,
}: {
  from?: string | null;
  to?: string | null;
  t: Translate;
}) =>
  from || to ? (
    <div className="flex items-center gap-2 text-sm">
      <Clock className="w-4 h-4 text-muted-foreground" />
      <span>
        {t("Table.OperatingRange", {
          from: from ?? "--:--",
          to: to ?? "--:--",
        })}
      </span>
    </div>
  ) : (
    <span className="text-sm text-muted-foreground">
      {t("Table.ScheduleTBD")}
    </span>
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

const RelationsCell = ({
  service,
  t,
}: {
  service: TransportServiceWithRelations;
  t: Translate;
}) => (
  <div className="flex flex-wrap gap-2">
    <Badge variant="secondary">
      {t("Table.Routes")}: {service.routes?.length ?? 0}
    </Badge>
    <Badge variant="secondary">
      {t("Table.Lanes")}: {service.lanes?.length ?? 0}
    </Badge>
  </div>
);

export const transportServiceColumns = (
  t: Translate
): Column<TransportServiceWithRelations>[] => [
  {
    key: "name",
    label: t("Table.Service"),
    sortable: true,
    render: (service) => <ServiceInfoCell service={service} />,
  },
  {
    key: "type",
    label: t("Table.Type"),
    sortable: true,
    render: (service) => (
      <Badge variant="secondary">
        <Bus className="w-3 h-3 mr-1" />
        {t(`TransportServiceType.${service.type}`)}
      </Badge>
    ),
  },
  {
    key: "color",
    label: t("Table.Color"),
    sortable: false,
    render: (service) => (
      <div className="flex items-center gap-2">
        <span
          className="h-5 w-5 rounded-full ring-1 ring-border"
          style={{ backgroundColor: service.color ?? "#0066CC" }}
        />
        <span className="text-sm">{service.color}</span>
      </div>
    ),
  },
  {
    key: "capacity",
    label: t("Table.Capacity"),
    sortable: true,
    render: (service) => <CapacityCell capacity={service.capacity} t={t} />,
  },
  {
    key: "operatingHours",
    label: t("Table.OperatingHours"),
    sortable: false,
    render: (service) => (
      <OperatingHoursCell
        from={service.operatingFrom}
        to={service.operatingTo}
        t={t}
      />
    ),
  },
  {
    key: "relations",
    label: t("Table.Relations"),
    sortable: false,
    render: (service) => <RelationsCell service={service} t={t} />,
  },
  {
    key: "status",
    label: t("Table.Status"),
    sortable: true,
    render: (service) => (
      <StatusBadge isActive={service.isActive ?? false} t={t} />
    ),
  },
];
