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
} from "lucide-react";
import { MapTransportService, MapLane, MapRoute, MapStop } from "@/types/map";
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

  const handleImageClick = (
    images: { url: string; alt?: string }[],
    index: number
  ) => {
    setPreviewImages(images);
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  };

  return (
    <>
      <div
        className="w-[320px] max-w-full space-y-4 text-sm"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {service?.color && (
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: service.color }}
              />
            )}
            <p className="text-base font-semibold leading-tight">
              {serviceName}
            </p>
            <Badge variant="secondary" className="text-[10px] uppercase">
              {t(`TransportServiceType.${service?.type ?? "UNKNOWN"}`)}
            </Badge>
          </div>
          {service?.icon?.fileUrl && (
            <div className="relative h-16 w-16 overflow-hidden rounded-md border">
              <Image
                src={service.icon.fileUrl}
                alt={serviceName}
                fill
                sizes="64px"
                className="object-contain"
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Lanes */}
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            {t("Lanes")} ({lanes.length})
          </div>
          {lanes.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {t("NoLanesAssigned")}
            </p>
          ) : (
            <ScrollArea className="max-h-32">
              <div className="space-y-1 pr-4">
                {lanes.map((lane) => (
                  <div
                    key={lane.id}
                    className="flex items-center gap-2 rounded border p-2 text-xs"
                  >
                    {lane.color && (
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: lane.color }}
                      />
                    )}
                    <span className="flex-1">
                      {getLocalizedValue(lane.name, locale) || lane.id}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <Separator />

        {/* Routes */}
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <RouteIcon className="h-3.5 w-3.5" />
            {t("Routes")} ({routes.length})
          </div>
          {routes.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {t("NoRoutesAssigned")}
            </p>
          ) : (
            <ScrollArea className="max-h-32">
              <div className="space-y-1 pr-4">
                {routes.map((route) => (
                  <div
                    key={route.id}
                    className="flex items-center gap-2 rounded border p-2 text-xs"
                  >
                    {route.color && (
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: route.color }}
                      />
                    )}
                    <span className="flex-1">
                      {route.routeNumber
                        ? `${route.routeNumber} • ${getLocalizedValue(route.name, locale) || route.id}`
                        : getLocalizedValue(route.name, locale) || route.id}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <Separator />

        {/* Stops */}
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {t("Stops")} ({stops.length})
          </div>
          {stops.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {t("NoStopsAssigned") || "No stops assigned"}
            </p>
          ) : (
            <ScrollArea className="max-h-32">
              <div className="space-y-1 pr-4">
                {stops.slice(0, 10).map((stop) => (
                  <div
                    key={stop.id}
                    className="flex items-center gap-2 rounded border p-2 text-xs"
                  >
                    <span className="flex-1">
                      {getLocalizedValue(stop.name, locale) || stop.id}
                    </span>
                  </div>
                ))}
                {stops.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    +{stops.length - 10} {t("MoreStops") || "more stops"}
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <Separator />

        {/* Schedules */}
        {schedules.length > 0 && (
          <>
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {t("Schedules") || "Schedules"} ({schedules.length})
              </div>
              <ScrollArea className="max-h-32">
                <div className="space-y-1 pr-4">
                  {Array.from(schedulesByRoute.entries()).map(
                    ([routeId, routeSchedules]) => {
                      const route = routes.find((r) => r.id === routeId);
                      return (
                        <div key={routeId} className="space-y-1">
                          <p className="text-xs font-medium">
                            {route?.routeNumber ||
                              getLocalizedValue(route?.name, locale) ||
                              routeId}
                          </p>
                          <div className="ml-2 space-y-0.5">
                            {routeSchedules.slice(0, 3).map((schedule) => (
                              <div
                                key={schedule.id}
                                className="text-xs text-muted-foreground"
                              >
                                {schedule.departureTime} -{" "}
                                {t(`DayOfWeek.${schedule.dayOfWeek}`)}
                              </div>
                            ))}
                            {routeSchedules.length > 3 && (
                              <p className="text-xs text-muted-foreground">
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
            <Separator />
          </>
        )}

        {/* Images */}
        {allImages.length > 0 && (
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ImageIcon className="h-3.5 w-3.5" />
              {t("Images") || "Images"} ({allImages.length})
            </div>
            <ScrollArea className="h-32 w-full rounded-md border">
              <div className="grid grid-cols-2 gap-2 p-2">
                {allImages.slice(0, 4).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => handleImageClick(allImages, index)}
                    className="relative h-24 w-full overflow-hidden rounded-md border bg-muted hover:opacity-80 transition-opacity"
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
        )}
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
