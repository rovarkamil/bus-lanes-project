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

type Translate = (key: string, options?: Record<string, unknown>) => string;

const RelationCell = ({
  icon: Icon,
  label,
  value,
  t,
}: {
  icon: typeof RouteIcon;
  label: string;
  value?: string;
  t: Translate;
}) => (
  <div className="flex items-center gap-2 text-sm">
    <Icon className="w-4 h-4 text-muted-foreground" />
    <span className="font-medium">{t(label)}</span>
    <span className="text-muted-foreground">{value ?? "—"}</span>
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

export const busScheduleColumns = (
  t: Translate
): Column<BusScheduleWithRelations>[] => [
  {
    key: "route",
    label: t("Table.Route"),
    sortable: true,
    render: (schedule) => (
      <RelationCell
        icon={RouteIcon}
        label="Table.Route"
        value={schedule.route?.routeNumber ?? schedule.route?.id}
        t={t}
      />
    ),
  },
  {
    key: "stop",
    label: t("Table.Stop"),
    sortable: true,
    render: (schedule) => (
      <RelationCell
        icon={MapPin}
        label="Table.Stop"
        value={schedule.stop?.name?.en ?? t("Common.NotAvailable")}
        t={t}
      />
    ),
  },
  {
    key: "departureTime",
    label: t("Table.Departure"),
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
    label: t("Table.Day"),
    sortable: true,
    render: (schedule) => (
      <Badge variant="secondary">{t(`DayOfWeek.${schedule.dayOfWeek}`)}</Badge>
    ),
  },
  {
    key: "specificDate",
    label: t("Table.SpecificDate"),
    sortable: true,
    render: (schedule) =>
      schedule.specificDate ? (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{formatDate(schedule.specificDate)}</span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">
          {t("Common.NotAvailable")}
        </span>
      ),
  },
  {
    key: "notes",
    label: t("Table.Notes"),
    sortable: false,
    className: "max-w-[220px]",
    render: (schedule) =>
      schedule.notes ? (
        <span className="text-sm text-muted-foreground line-clamp-2">
          {schedule.notes}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">
          {t("Common.NotAvailable")}
        </span>
      ),
  },
  {
    key: "status",
    label: t("Table.Status"),
    sortable: true,
    render: (schedule) => (
      <StatusBadge isActive={schedule.isActive ?? false} t={t} />
    ),
  },
];
