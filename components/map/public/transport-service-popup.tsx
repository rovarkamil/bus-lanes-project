"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocale } from "@/components/locale-provder";
import { useTranslation } from "@/i18n/client";
import {
  MapPin,
  Layers,
  Route as RouteIcon,
  Clock,
  Image as ImageIcon,
  Info,
} from "lucide-react";
import {
  MapTransportService,
  MapLane,
  MapRoute,
  MapStop,
  LanguageContent,
} from "@/types/map";
import { getLocalizedValue } from "@/lib/i18n/get-localized-value";
import { useFetchBusSchedules } from "@/hooks/public-hooks/use-bus-schedule";
import { useFetchBusLanes } from "@/hooks/public-hooks/use-bus-lane";
import { ImagePreviewer } from "@/components/show-image-previewer";

interface TransportServicePopupProps {
  service?: MapTransportService | null;
  serviceId: string;
  lanes: MapLane[];
  routes: MapRoute[];
  stops: MapStop[];
}

export function TransportServicePopup({
  service,
  serviceId,
  lanes,
  routes,
  stops,
}: TransportServicePopupProps) {
  const { t, i18n } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  const locale = useLocale();
  const [previewImages, setPreviewImages] = useState<
    { url: string; alt?: string }[]
  >([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch schedules for all routes (fetch all and filter client-side since API only supports single routeId)
  const routeIds = routes.map((r) => r.id);
  const { data: schedulesData } = useFetchBusSchedules({
    page: 1,
    limit: 1000,
  });

  const schedules = useMemo(() => {
    if (!schedulesData?.items) return [];
    // Filter schedules to only include those for routes in this service
    return schedulesData.items.filter((schedule) =>
      routeIds.includes(schedule.routeId)
    );
  }, [schedulesData?.items, routeIds]);

  // Group schedules by route and stop
  const schedulesByRoute = useMemo(() => {
    const grouped = new Map<string, typeof schedules>();
    schedules.forEach((schedule) => {
      if (!grouped.has(schedule.routeId)) {
        grouped.set(schedule.routeId, []);
      }
      grouped.get(schedule.routeId)!.push(schedule);
    });
    return grouped;
  }, [schedules]);

  // Fetch full lane details with images
  const laneIds = lanes.map((l) => l.id);
  const { data: lanesData } = useFetchBusLanes({
    page: 1,
    limit: 1000,
  });

  // Collect all images from lanes
  const allImages = useMemo(() => {
    const images: { url: string; alt?: string }[] = [];
    if (!lanesData?.items) return images;

    // Filter lanes to only include those in this service
    const serviceLanes = lanesData.items.filter((lane) =>
      laneIds.includes(lane.id)
    );

    serviceLanes.forEach((lane) => {
      if (lane.images && lane.images.length > 0) {
        lane.images.forEach((image) => {
          images.push({
            url: image.url,
            alt: image.name || lane.name?.en || lane.id,
          });
        });
      }
    });
    return images;
  }, [lanesData?.items, laneIds]);

  const serviceName = useMemo(
    () =>
      getLocalizedValue(service?.name, locale) || service?.type || serviceId,
    [service?.name, service?.type, locale, serviceId]
  );
  const serviceDescription =
    service && "description" in service
      ? getLocalizedValue(
          (
            service as MapTransportService & {
              description?: LanguageContent | null;
            }
          ).description,
          locale
        )
      : undefined;

  const handleImageClick = (
    images: { url: string; alt?: string }[],
    index: number
  ) => {
    setPreviewImages(images);
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  };

  const SectionHeader = ({
    icon: Icon,
    label,
    count,
  }: {
    icon: typeof Layers;
    label: string;
    count?: number;
  }) => (
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
      {typeof count === "number" && (
        <Badge variant="outline" className="text-[10px]">
          {count}
        </Badge>
      )}
    </div>
  );

  const Pill = ({ color, label }: { color?: string; label: string }) => (
    <span className="inline-flex min-h-[32px] items-center gap-2 rounded-full border border-border/50 px-3 text-xs font-medium">
      {color && (
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </span>
  );

  return (
    <>
      <div
        className="w-[min(90vw,380px)] space-y-4 text-sm text-card-foreground sm:w-[360px]"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="rounded-3xl border border-border/60 bg-card/95 p-4 shadow-2xl ring-1 ring-border/30 backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full border border-border/40"
                  style={{ backgroundColor: service?.color || "#f97316" }}
                />
                <p className="text-lg font-semibold leading-tight">
                  {serviceName}
                </p>
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {t(`TransportServiceType.${service?.type ?? "UNKNOWN"}`)}
                </Badge>
              </div>
              {serviceDescription && (
                <p className="text-xs text-muted-foreground">
                  {serviceDescription}
                </p>
              )}
            </div>
            {service?.icon?.fileUrl && (
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-border/40 bg-background/80 p-2">
                <Image
                  src={service.icon.fileUrl}
                  alt={serviceName}
                  fill
                  sizes="56px"
                  className="object-contain"
                />
              </div>
            )}
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 gap-3 text-xs uppercase text-muted-foreground">
            <div className="rounded-2xl border border-border/50 bg-background/40 p-3">
              <p className="text-[11px] font-semibold">{t("Lanes")}</p>
              <p className="text-xl font-semibold text-foreground">
                {lanes.length}
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/40 p-3">
              <p className="text-[11px] font-semibold">{t("Routes")}</p>
              <p className="text-xl font-semibold text-foreground">
                {routes.length}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {/* Lanes */}
            <div className="space-y-2">
              <SectionHeader
                icon={Layers}
                label={t("Lanes")}
                count={lanes.length}
              />
              {lanes.length === 0 ? (
                <p className="rounded-2xl bg-muted/40 p-3 text-xs text-muted-foreground">
                  {t("NoLanesAssigned")}
                </p>
              ) : (
                <ScrollArea className="max-h-32">
                  <div className="flex flex-wrap gap-2 pr-1">
                    {lanes.map((lane) => (
                      <Pill
                        key={lane.id}
                        color={lane.color || lane.service?.color || undefined}
                        label={getLocalizedValue(lane.name, locale) || lane.id}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            <Separator />

            {/* Routes */}
            <div className="space-y-2">
              <SectionHeader
                icon={RouteIcon}
                label={t("Routes")}
                count={routes.length}
              />
              {routes.length === 0 ? (
                <p className="rounded-2xl bg-muted/40 p-3 text-xs text-muted-foreground">
                  {t("NoRoutesAssigned")}
                </p>
              ) : (
                <div className="space-y-2">
                  {routes.map((route) => (
                    <div
                      key={route.id}
                      className="flex items-center justify-between rounded-2xl border border-border/40 bg-background/60 px-3 py-2 text-xs"
                    >
                      <div className="flex flex-1 items-center gap-2">
                        {route.color && (
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: route.color }}
                          />
                        )}
                        <span className="font-medium">
                          {route.routeNumber
                            ? `${route.routeNumber} • ${
                                getLocalizedValue(route.name, locale) ||
                                route.id
                              }`
                            : getLocalizedValue(route.name, locale) || route.id}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {t("Schedules")}:{" "}
                        {schedulesByRoute.get(route.id)?.length ?? 0}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Stops */}
            <div className="space-y-2">
              <SectionHeader
                icon={MapPin}
                label={t("Stops")}
                count={stops.length}
              />
              {stops.length === 0 ? (
                <p className="rounded-2xl bg-muted/40 p-3 text-xs text-muted-foreground">
                  {t("NoStopsAssigned")}
                </p>
              ) : (
                <ScrollArea className="max-h-32">
                  <div className="space-y-1 pr-1">
                    {stops.slice(0, 8).map((stop) => (
                      <div
                        key={stop.id}
                        className="rounded-xl border border-border/40 bg-background/60 px-3 py-2 text-xs"
                      >
                        {getLocalizedValue(stop.name, locale) || stop.id}
                      </div>
                    ))}
                    {stops.length > 8 && (
                      <p className="py-1 text-center text-[11px] text-muted-foreground">
                        +{stops.length - 8} {t("MoreStops") || "more stops"}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Schedules */}
            {schedules.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <SectionHeader
                    icon={Clock}
                    label={t("Schedules")}
                    count={schedules.length}
                  />
                  <ScrollArea className="max-h-32">
                    <div className="space-y-2 pr-1">
                      {Array.from(schedulesByRoute.entries()).map(
                        ([routeId, routeSchedules]) => {
                          const route = routes.find((r) => r.id === routeId);
                          return (
                            <div
                              key={routeId}
                              className="rounded-2xl border border-border/40 bg-background/60 p-3 text-xs"
                            >
                              <p className="font-semibold">
                                {route?.routeNumber ||
                                  getLocalizedValue(route?.name, locale) ||
                                  routeId}
                              </p>
                              <div className="mt-1 space-y-0.5 text-muted-foreground">
                                {routeSchedules.slice(0, 3).map((schedule) => (
                                  <div key={schedule.id}>
                                    {schedule.departureTime} ·{" "}
                                    {t(`DayOfWeek.${schedule.dayOfWeek}`)}
                                  </div>
                                ))}
                                {routeSchedules.length > 3 && (
                                  <p>
                                    +{routeSchedules.length - 3}{" "}
                                    {t("More") || "more"}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}

            {/* Images */}
            {allImages.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <SectionHeader
                    icon={ImageIcon}
                    label={t("Images") || "Images"}
                    count={allImages.length}
                  />
                  <ScrollArea className="h-32 rounded-2xl border border-border/50 bg-background/60">
                    <div className="grid grid-cols-2 gap-2 p-2">
                      {allImages.slice(0, 4).map((image, index) => (
                        <button
                          key={image.url}
                          onClick={() => handleImageClick(allImages, index)}
                          className="relative h-24 w-full overflow-hidden rounded-xl border border-border/40 bg-muted/40 transition hover:opacity-80"
                        >
                          <Image
                            src={image.url}
                            alt={image.alt || serviceName}
                            fill
                            sizes="150px"
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}

            {lanes.length === 0 &&
              routes.length === 0 &&
              stops.length === 0 &&
              schedules.length === 0 &&
              allImages.length === 0 && (
                <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <Info className="h-4 w-4" />
                  {t("TapARouteOrLanePillToFilterTheMap")}
                </div>
              )}
          </div>
        </div>
      </div>

      <ImagePreviewer
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        images={previewImages}
        initialImageIndex={previewIndex}
      />
    </>
  );
}
