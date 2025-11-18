"use client";

import { Column } from "@/types/data-table";
import { BusStopWithRelations } from "@/types/models/bus-stop";
import { Badge } from "@/components/ui/badge";
import { Map, Layers, Image as ImageIcon, Navigation2 } from "lucide-react";

const CoordinateCell = ({ latitude, longitude }: { latitude?: number | null; longitude?: number | null }) => (
  <div className="flex flex-col">
    <span className="text-sm font-medium">{latitude?.toFixed(5) ?? "—"}</span>
    <span className="text-xs text-muted-foreground">{longitude?.toFixed(5) ?? "—"}</span>
  </div>
);

const FeatureBadge = ({ label, value }: { label: string; value?: boolean }) =>
  value ? (
    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
      {label}
    </Badge>
  ) : null;

const RelationsCell = ({ stop }: { stop: BusStopWithRelations }) => (
  <div className="flex flex-wrap gap-2">
    <Badge variant="secondary">
      Lanes: {stop.lanes?.length ?? 0}
    </Badge>
    <Badge variant="secondary">
      Routes: {stop.routes?.length ?? 0}
    </Badge>
    <Badge variant="secondary">
      Schedules: {stop.schedules?.length ?? 0}
    </Badge>
  </div>
);

const ImageCountCell = ({ count }: { count: number }) =>
  count > 0 ? (
    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
      <ImageIcon className="w-3 h-3 mr-1" />
      {count}
    </Badge>
  ) : (
    <span className="text-sm text-muted-foreground">No images</span>
  );

export const busStopColumns: Column<BusStopWithRelations>[] = [
  {
    key: "name",
    label: "Name",
    sortable: true,
    render: (stop) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium">{stop.name?.en ?? "-"}</span>
        {stop.description?.en && (
          <span className="text-xs text-muted-foreground line-clamp-2">
            {stop.description.en}
          </span>
        )}
      </div>
    ),
  },
  {
    key: "coordinates",
    label: "Coordinates",
    sortable: false,
    render: (stop) => <CoordinateCell latitude={stop.latitude} longitude={stop.longitude} />,
  },
  {
    key: "zone",
    label: "Zone",
    sortable: true,
    render: (stop) => (
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm">{stop.zone?.name?.en ?? "—"}</span>
      </div>
    ),
  },
  {
    key: "icon",
    label: "Map Icon",
    sortable: false,
    render: (stop) =>
      stop.icon ? (
        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
          <Map className="w-3 h-3 mr-1" />
          {stop.icon.name?.en ?? "Custom icon"}
        </Badge>
      ) : (
        <span className="text-sm text-muted-foreground">Default</span>
      ),
  },
  {
    key: "images",
    label: "Images",
    sortable: false,
    render: (stop) => <ImageCountCell count={stop.images?.length ?? 0} />,
  },
  {
    key: "amenities",
    label: "Amenities",
    sortable: false,
    render: (stop) => (
      <div className="flex flex-wrap gap-2">
        <FeatureBadge label="Shelter" value={stop.hasShelter} />
        <FeatureBadge label="Bench" value={stop.hasBench} />
        <FeatureBadge label="Lighting" value={stop.hasLighting} />
        <FeatureBadge label="Accessible" value={stop.isAccessible} />
        <FeatureBadge label="Real-time" value={stop.hasRealTimeInfo} />
      </div>
    ),
  },
  {
    key: "relations",
    label: "Usage",
    sortable: false,
    render: (stop) => <RelationsCell stop={stop} />,
  },
  {
    key: "order",
    label: "Order",
    sortable: true,
    render: (stop) => (
      <Badge variant="outline" className="bg-muted text-foreground border-border">
        #{stop.order ?? "—"}
      </Badge>
    ),
  },
  {
    key: "mapLink",
    label: "View",
    sortable: false,
    render: (stop) => (
      <a
        href={`https://www.openstreetmap.org/?mlat=${stop.latitude}&mlon=${stop.longitude}#map=16/${stop.latitude}/${stop.longitude}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
      >
        <Navigation2 className="w-4 h-4" />
        Open Map
      </a>
    ),
  },
];

