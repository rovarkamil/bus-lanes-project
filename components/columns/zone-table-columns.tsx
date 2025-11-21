"use client";

import { Column } from "@/types/data-table";
import { ZoneWithRelations } from "@/types/models/zone";
import { Badge } from "@/components/ui/badge";
import { ToggleLeft, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

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
];
