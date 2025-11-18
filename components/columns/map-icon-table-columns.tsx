"use client";

import { Column } from "@/types/data-table";
import { MapIconWithRelations } from "@/types/models/map-icon";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Move, ToggleLeft } from "lucide-react";

const IconPreview = ({ url, name }: { url?: string; name?: string }) =>
  url ? (
    <div className="flex items-center gap-2">
      <div className="relative h-10 w-10 rounded-md border border-border bg-muted/40 overflow-hidden">
        <Image src={url} alt={name ?? ""} fill className="object-contain p-1" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{name ?? "Custom icon"}</span>
        <span className="text-xs text-muted-foreground line-clamp-1">
          {url}
        </span>
      </div>
    </div>
  ) : (
    <span className="text-sm text-muted-foreground">No preview</span>
  );

const AnchorCell = ({
  label,
  valueX,
  valueY,
}: {
  label: string;
  valueX?: number | null;
  valueY?: number | null;
}) => (
  <Badge
    variant="outline"
    className="font-medium bg-muted text-foreground border-border"
  >
    {label}: {valueX ?? 0}, {valueY ?? 0}
  </Badge>
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

const UsageCell = ({
  services,
  stops,
}: {
  services?: { id: string }[];
  stops?: { id: string }[];
}) => (
  <div className="flex flex-col gap-1">
    <Badge variant="secondary">Services: {services?.length ?? 0}</Badge>
    <Badge variant="secondary">Stops: {stops?.length ?? 0}</Badge>
  </div>
);

export const mapIconColumns: Column<MapIconWithRelations>[] = [
  {
    key: "preview",
    label: "Preview",
    sortable: false,
    render: (icon) => (
      <IconPreview
        url={icon.file?.url}
        name={icon.name?.en ?? icon.file?.name ?? ""}
      />
    ),
  },
  {
    key: "name",
    label: "Name",
    sortable: true,
    render: (icon) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium">{icon.name?.en ?? "-"}</span>
        {icon.description?.en && (
          <span className="text-xs text-muted-foreground line-clamp-2">
            {icon.description.en}
          </span>
        )}
      </div>
    ),
  },
  {
    key: "iconSize",
    label: "Size",
    sortable: true,
    render: (icon) => (
      <Badge
        variant="outline"
        className="bg-blue-50 text-blue-700 border-blue-200"
      >
        <Move className="w-3 h-3 mr-1" />
        {icon.iconSize ?? 32}px
      </Badge>
    ),
  },
  {
    key: "anchors",
    label: "Anchors",
    sortable: false,
    render: (icon) => (
      <div className="flex flex-wrap gap-2">
        <AnchorCell
          label="Icon"
          valueX={icon.iconAnchorX}
          valueY={icon.iconAnchorY}
        />
        <AnchorCell
          label="Popup"
          valueX={icon.popupAnchorX}
          valueY={icon.popupAnchorY}
        />
      </div>
    ),
  },
  {
    key: "usage",
    label: "Usage",
    sortable: false,
    render: (icon) => (
      <UsageCell services={icon.transportServices} stops={icon.busStops} />
    ),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (icon) => <StatusBadge isActive={icon.isActive ?? false} />,
  },
];
