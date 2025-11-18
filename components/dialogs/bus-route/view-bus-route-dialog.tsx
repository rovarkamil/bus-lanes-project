"use client";

import { FC } from "react";
import { useTranslation } from "@/i18n/client";
import { BusRouteWithRelations } from "@/types/models/bus-route";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Info,
  Hash,
  Route as RouteIcon,
  DollarSign,
  Clock,
  Layers,
  MapPin,
  ToggleLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ViewBusRouteDialogProps {
  data: BusRouteWithRelations;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewBusRouteDialog: FC<ViewBusRouteDialogProps> = ({
  data,
  isOpen,
  onOpenChange,
}) => {
  const { t, i18n } = useTranslation("BusRoutes");
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
      maxWidth="4xl"
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
          {data.routeNumber && (
            <Badge
              variant="outline"
              className="flex items-center gap-1.5 px-3 py-1"
            >
              <Hash className="h-4 w-4" />
              {data.routeNumber}
            </Badge>
          )}
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 px-3 py-1"
          >
            <RouteIcon className="h-4 w-4" />
            {t(`RouteDirection.${data.direction}`)}
          </Badge>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">
                {t("Common.Name")}
              </p>
              <p className="text-lg font-semibold">
                {data.name?.en ?? t("Common.NotAvailable")}
              </p>
            </div>
            {data.description?.en && (
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("Common.Description")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.description.en}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {t("ViewDialog.Pricing")}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {t("ViewDialog.FareValue", {
                    fare: data.fare ?? t("Common.NotAvailable"),
                  })}
                </Badge>
                <Badge variant="outline">
                  {t(`Currency.${data.currency}`)}
                </Badge>
                {data.frequency && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1.5"
                  >
                    <Clock className="h-3 w-3" />
                    {t("ViewDialog.FrequencyValue", { value: data.frequency })}
                  </Badge>
                )}
                {data.duration && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1.5"
                  >
                    <Clock className="h-3 w-3" />
                    {t("ViewDialog.DurationValue", { value: data.duration })}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <RouteIcon className="h-4 w-4" />
                {t("ViewDialog.Relations")}
              </h3>
              <div className="flex flex-col gap-2">
                <Badge variant="secondary" className="flex items-center gap-2">
                  <Layers className="h-3 w-3" />
                  {t("ViewDialog.LanesCount", {
                    count: data.lanes?.length ?? 0,
                  })}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {t("ViewDialog.StopsCount", {
                    count: data.stops?.length ?? 0,
                  })}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-2">
                  <RouteIcon className="h-3 w-3" />
                  {t("ViewDialog.Service")}
                  <span className={cn("font-semibold")}>
                    {data.service?.type ?? t("Common.None")}
                  </span>
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {!!data.stops?.length && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t("ViewDialog.Stops")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.stops?.map((stop) => (
                  <Badge
                    key={stop.id}
                    variant="outline"
                    className="text-xs px-2 py-1"
                  >
                    {stop.id}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!!data.lanes?.length && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4" />
                {t("ViewDialog.Lanes")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.lanes?.map((lane) => (
                  <Badge
                    key={lane.id}
                    variant="outline"
                    className="text-xs px-2 py-1"
                  >
                    {lane.id}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CustomDialog>
  );
};
