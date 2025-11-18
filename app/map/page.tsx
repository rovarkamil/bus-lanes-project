"use client";

import { useMemo } from "react";
import { Loader2, MapPin, Route, Layers, BusFront } from "lucide-react";
import { useMapData } from "@/hooks/public-hooks/use-map";
import InteractiveBusMap from "@/components/map/interactive-bus-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/client";

const SummaryCard = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof MapPin;
}) => {
  const { t, i18n } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  return (
  <Card className="border-border/60 bg-background/80 shadow-sm" dir={isRTL ? "rtl" : "ltr"}>
    <CardContent className="flex items-center gap-4 p-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {t(label)}
        </p>
        <p className="text-2xl font-semibold">{value.toLocaleString()}</p>
      </div>
    </CardContent>
  </Card>
  );
};

const MapPage = () => {
  const { t, i18n } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  const { data, isPending, error, refetch } = useMapData();
  const payload = data?.data;

  const stats = useMemo(
    () => ({
      stops: payload?.stops.length ?? 0,
      lanes: payload?.lanes.length ?? 0,
      routes: payload?.routes.length ?? 0,
      services: payload?.services.length ?? 0,
    }),
    [payload]
  );

  return (
    <main className="space-y-8 px-4 py-10 md:px-10" dir={isRTL ? "rtl" : "ltr"}>
      <section className="space-y-6 text-center md:text-left">
        <Badge variant="outline" className="mx-auto w-fit md:mx-0">
          {t("LiveTransitMap")}
        </Badge>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("ExploreBusLanesStopsAndRoutesInRealTime")}
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            {t("UseServiceFiltersInspectZonesAndTapMarkersForMultilingualInformationAmenitiesMediaAndLinkedRoutesDataRefreshesAutomaticallyFromTheAdminDashboardSourceOfTruth")}
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" dir={isRTL ? "rtl" : "ltr"}>
        <SummaryCard label={t("ActiveStops")} value={stats.stops} icon={MapPin} />
        <SummaryCard label={t("MappedLanes")} value={stats.lanes} icon={Layers} />
        <SummaryCard label={t("BusRoutes")} value={stats.routes} icon={Route} />
        <SummaryCard
          label={t("TransportServices")}
          value={stats.services}
          icon={BusFront}
        />
      </section>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col gap-3 p-6 text-destructive">
            <p className="text-lg font-semibold">{t("UnableToLoadMapData")}</p>
            <p className="text-sm text-destructive/80">
              {error.message || t("PleaseTryAgainInAMoment")}
            </p>
            <Button
              variant="outline"
              className="w-fit border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => refetch()}
            >
              {t("Retry")}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">{t("InteractiveMap")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("ToggleServicesLayersAndTapAnyStopForLocalizedDetails")}
            </p>
          </div>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
            {t("AutoRefreshEveryMinute")}
          </Badge>
        </div>

        <Card className="border-border/60 bg-background/80 shadow-lg">
          <CardContent className="p-0" dir={isRTL ? "rtl" : "ltr"}>
            {isPending && !payload ? (
              <div className="flex h-[620px] items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                {t("LoadingLiveMapData")}
              </div>
            ) : (
              <InteractiveBusMap
                stops={payload?.stops ?? []}
                lanes={payload?.lanes ?? []}
                routes={payload?.routes ?? []}
                zones={payload?.zones ?? []}
                services={payload?.services ?? []}
                className={cn(isPending ? "opacity-60" : "opacity-100")}
              />
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default MapPage;
