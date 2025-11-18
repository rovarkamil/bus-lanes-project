"use client";

import { FC } from "react";
import { useTranslation } from "@/i18n/client";
import { BusScheduleWithRelations } from "@/types/models/bus-schedule";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Info,
  Route as RouteIcon,
  MapPin,
  Clock,
  Calendar,
  ToggleLeft,
  FileText,
} from "lucide-react";

interface ViewBusScheduleDialogProps {
  data: BusScheduleWithRelations;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewBusScheduleDialog: FC<ViewBusScheduleDialogProps> = ({
  data,
  isOpen,
  onOpenChange,
}) => {
  const { t, i18n } = useTranslation("BusSchedules");
  const isRTL = i18n.language !== "en";

  if (!data) return null;

  return (
    <CustomDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t("ViewDialog.Title")}
      description={t("ViewDialog.Description")}
      rtl={isRTL}
      icon={Info}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Badge
            variant={data.isActive ? "success" : "destructive"}
            className="flex items-center gap-1.5 px-3 py-1 text-sm"
          >
            <ToggleLeft className="h-4 w-4" />
            {data.isActive ? t("Common.Active") : t("Common.Inactive")}
          </Badge>
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 px-3 py-1"
          >
            <Calendar className="h-4 w-4" />
            {t(`DayOfWeek.${data.dayOfWeek}`)}
          </Badge>
          {data.specificDate && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 px-3 py-1"
            >
              <Calendar className="h-4 w-4" />
              {new Date(data.specificDate).toLocaleDateString()}
            </Badge>
          )}
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <RouteIcon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("ViewDialog.Route")}
                </p>
                <p className="text-base font-semibold">
                  {data.route?.routeNumber ?? data.route?.id ?? data.routeId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("ViewDialog.Stop")}
                </p>
                <p className="text-base font-semibold">
                  {data.stop?.id ?? data.stopId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("ViewDialog.DepartureTime")}
                </p>
                <p className="text-base font-semibold">{data.departureTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {data.notes && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">
                  {t("ViewDialog.Notes")}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">{data.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </CustomDialog>
  );
};
