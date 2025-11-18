"use client";

import { Column } from "@/types/data-table";
import { TransportServiceWithRelations } from "@/types/models/transport-service";
import { Badge } from "@/components/ui/badge";
import { Bus, Gauge, Clock, ToggleLeft } from "lucide-react";
import { cn } from "@/lib/utils";

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

const CapacityCell = ({ capacity }: { capacity?: number | null }) =>
  capacity ? (
    <Badge
      variant="outline"
      className="bg-blue-50 text-blue-700 border-blue-200"
    >
      <Gauge className="w-3 h-3 mr-1" />
      {capacity}
    </Badge>
  ) : (
    <span className="text-sm text-muted-foreground">—</span>
  );

const OperatingHoursCell = ({
  from,
  to,
}: {
  from?: string | null;
  to?: string | null;
}) =>
  from || to ? (
    <div className="flex items-center gap-2 text-sm">
      <Clock className="w-4 h-4 text-muted-foreground" />
      <span>
        {from ?? "--:--"} - {to ?? "--:--"}
      </span>
    </div>
  ) : (
    <span className="text-sm text-muted-foreground">Schedule TBD</span>
  );

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

const RelationsCell = ({
  service,
}: {
  service: TransportServiceWithRelations;
}) => (
  <div className="flex flex-wrap gap-2">
    <Badge variant="secondary">Routes: {service.routes?.length ?? 0}</Badge>
    <Badge variant="secondary">Lanes: {service.lanes?.length ?? 0}</Badge>
  </div>
);

export const transportServiceColumns: Column<TransportServiceWithRelations>[] =
  [
    {
      key: "name",
      label: "Service",
      sortable: true,
      render: (service) => <ServiceInfoCell service={service} />,
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (service) => (
        <Badge variant="secondary">
          <Bus className="w-3 h-3 mr-1" />
          {service.type}
        </Badge>
      ),
    },
    {
      key: "color",
      label: "Color",
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
      label: "Capacity",
      sortable: true,
      render: (service) => <CapacityCell capacity={service.capacity} />,
    },
    {
      key: "operatingHours",
      label: "Operating Hours",
      sortable: false,
      render: (service) => (
        <OperatingHoursCell
          from={service.operatingFrom}
          to={service.operatingTo}
        />
      ),
    },
    {
      key: "relations",
      label: "Relations",
      sortable: false,
      render: (service) => <RelationsCell service={service} />,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (service) => <StatusBadge isActive={service.isActive ?? false} />,
    },
  ];
