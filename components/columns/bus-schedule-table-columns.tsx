"use client";

import { Column } from "@/types/data-table";
import { BusScheduleWithRelations } from "@/types/models/bus-schedule";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatDate";
import {
  MapPin,
  Route as RouteIcon,
  Clock,
  Calendar,
  ToggleLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const RelationCell = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof RouteIcon;
  label: string;
  value?: string;
}) => (
  <div className="flex items-center gap-2 text-sm">
    <Icon className="w-4 h-4 text-muted-foreground" />
    <span className="font-medium">{label}</span>
    <span className="text-muted-foreground">{value ?? "—"}</span>
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

export const busScheduleColumns: Column<BusScheduleWithRelations>[] = [
  {
    key: "route",
    label: "Route",
    sortable: true,
    render: (schedule) => (
      <RelationCell
        icon={RouteIcon}
        label="Route"
        value={schedule.route?.routeNumber ?? schedule.route?.id}
      />
    ),
  },
  {
    key: "stop",
    label: "Stop",
    sortable: true,
    render: (schedule) => (
      <RelationCell
        icon={MapPin}
        label="Stop"
        value={schedule.stop?.id ?? "—"}
      />
    ),
  },
  {
    key: "departureTime",
    label: "Departure",
    sortable: true,
    render: (schedule) => (
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{schedule.departureTime}</span>
      </div>
    ),
  },
  {
    key: "dayOfWeek",
    label: "Day",
    sortable: true,
    render: (schedule) => (
      <Badge variant="secondary">{`DayOfWeek.${schedule.dayOfWeek}`}</Badge>
    ),
  },
  {
    key: "specificDate",
    label: "Specific Date",
    sortable: true,
    render: (schedule) =>
      schedule.specificDate ? (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{formatDate(schedule.specificDate)}</span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
  },
  {
    key: "notes",
    label: "Notes",
    sortable: false,
    className: "max-w-[220px]",
    render: (schedule) =>
      schedule.notes ? (
        <span className="text-sm text-muted-foreground line-clamp-2">
          {schedule.notes}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (schedule) => <StatusBadge isActive={schedule.isActive ?? false} />,
  },
];
