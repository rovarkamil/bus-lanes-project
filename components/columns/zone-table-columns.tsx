"use client";

import { Column } from "@/types/data-table";
import { ZoneWithRelations } from "@/types/models/zone";
import { Badge } from "@/components/ui/badge";
import { ToggleLeft, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const ZoneInfoCell = ({ zone }: { zone: ZoneWithRelations }) => (
  <div className="flex flex-col">
    <span className="text-sm font-medium">{zone.name?.en ?? "-"}</span>
    {zone.description?.en && (
      <span className="text-xs text-muted-foreground line-clamp-2">
        {zone.description.en}
      </span>
    )}
  </div>
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

export const zoneColumns: Column<ZoneWithRelations>[] = [
  {
    key: "name",
    label: "Zone",
    sortable: true,
    render: (zone) => <ZoneInfoCell zone={zone} />,
  },
  {
    key: "color",
    label: "Color",
    sortable: false,
    render: (zone) => (
      <div className="flex items-center gap-2">
        <span
          className="h-5 w-5 rounded-full ring-1 ring-border"
          style={{ backgroundColor: zone.color ?? "#0066CC" }}
        />
        <span className="text-sm">{zone.color}</span>
      </div>
    ),
  },
  {
    key: "stops",
    label: "Stops",
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
    label: "Status",
    sortable: true,
    render: (zone) => <StatusBadge isActive={zone.isActive ?? false} />,
  },
];
