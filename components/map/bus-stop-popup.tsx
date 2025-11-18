"use client";

import Image from "next/image";
import { memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provder";
import { useTranslation } from "@/i18n/client";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Layers,
  Route as RouteIcon,
  Info,
  CheckSquare,
} from "lucide-react";
import { MapStop, MapLaneSummary, MapRouteSummary } from "@/types/map";
import { getLocalizedValue } from "@/lib/i18n/get-localized-value";

interface BusStopPopupProps {
  stop: MapStop;
  onLaneSelect?: (laneId: string) => void;
  onRouteSelect?: (routeId: string) => void;
}

const RelationPills = <T extends MapLaneSummary | MapRouteSummary>({
  items,
  emptyLabel,
  colorFn,
  getLabel,
  icon: Icon,
  onSelect,
}: {
  items?: T[];
  emptyLabel: string;
  colorFn?: (item: T) => string | undefined;
  getLabel: (item: T) => string;
  icon: typeof Layers | typeof RouteIcon;
  onSelect?: (item: T) => void;
}) => {
  const { i18n } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  if (!items?.length) {
    return <p className="text-xs text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2" dir={isRTL ? "rtl" : "ltr"}>
      {items.map((item) => {
        const label = getLabel(item);
        const backgroundColor = colorFn?.(item);
        return (
          <Button
            key={item.id}
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-7 rounded-full border px-3 py-0 text-xs",
              !onSelect && "pointer-events-none opacity-90"
            )}
            style={
              backgroundColor
                ? { backgroundColor: `${backgroundColor}22` }
                : undefined
            }
            onClick={() => onSelect?.(item)}
          >
            <Icon className="mr-1 h-3.5 w-3.5" />
            {label}
          </Button>
        );
      })}
    </div>
  );
};

export const BusStopPopup = memo(
  ({ stop, onLaneSelect, onRouteSelect }: BusStopPopupProps) => {
    const { t, i18n } = useTranslation("Map");
    const isRTL = i18n.language !== "en";
    const locale = useLocale();
    const stopName = useMemo(
      () => getLocalizedValue(stop.name, locale) ?? stop.id,
      [stop.name, locale, stop.id]
    );
    const description = useMemo(
      () => getLocalizedValue(stop.description, locale),
      [stop.description, locale]
    );
    const zoneName = useMemo(
      () => getLocalizedValue(stop.zone?.name, locale),
      [stop.zone?.name, locale]
    );
    const enabledAmenities = useMemo(() => {
      const config = [
        { key: "hasShelter" as const, label: t("Shelter") },
        { key: "hasBench" as const, label: t("Bench") },
        { key: "hasLighting" as const, label: t("Lighting") },
        { key: "isAccessible" as const, label: t("Accessible") },
        { key: "hasRealTimeInfo" as const, label: t("RealtimeInfo") },
      ];

      return config.filter((item) => stop.amenities?.[item.key]);
    }, [stop.amenities, t]);

    return (
      <div
        className="w-[320px] max-w-full space-y-4 text-sm"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="space-y-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold leading-tight">
                {stopName}
              </p>
              {stop.zone && (
                <Badge
                  variant="secondary"
                  className="text-[10px] uppercase tracking-wide"
                  style={
                    stop.zone.color
                      ? {
                          backgroundColor: `${stop.zone.color}1a`,
                          color: stop.zone.color,
                        }
                      : undefined
                  }
                >
                  {zoneName ?? stop.zone.id}
                </Badge>
              )}
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {stop.latitude.toFixed(5)}, {stop.longitude.toFixed(5)}
            </p>
          </div>

          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        {stop.images?.length ? (
          <ScrollArea className="h-32 w-full rounded-md border">
            <div className="grid grid-cols-2 gap-2 p-2">
              {stop.images.slice(0, 4).map((image) => (
                <div
                  key={image.id}
                  className="relative h-24 w-full overflow-hidden rounded-md border bg-muted"
                >
                  <Image
                    src={image.url}
                    alt={image.name ?? stopName}
                    fill
                    sizes="150px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : null}

        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <CheckSquare className="h-3.5 w-3.5" />
              {t("Amenities")}
            </div>
            {enabledAmenities.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {enabledAmenities.map((amenity) => (
                  <Badge key={amenity.key} variant="outline">
                    {amenity.label}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("NoAmenitiesData")}
              </p>
            )}
          </div>

          <Separator />

          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              {t("Lanes")}
            </div>
            <RelationPills
              items={stop.lanes}
              emptyLabel={t("NoLanesAssigned")}
              icon={Layers}
              colorFn={(lane) => lane.color ?? lane.service?.color ?? undefined}
              getLabel={(lane) =>
                getLocalizedValue(lane.name, locale) ?? lane.id
              }
              onSelect={(lane) => onLaneSelect?.(lane.id)}
            />
          </div>

          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <RouteIcon className="h-3.5 w-3.5" />
              {t("Routes")}
            </div>
            <RelationPills
              items={stop.routes}
              emptyLabel={t("NoRoutesAssigned")}
              icon={RouteIcon}
              colorFn={(route) =>
                route.color ?? route.service?.color ?? undefined
              }
              getLabel={(route) => {
                const localized =
                  getLocalizedValue(route.name, locale) ?? route.id;
                return route.routeNumber
                  ? `${route.routeNumber} • ${localized}`
                  : localized;
              }}
              onSelect={(route) => onRouteSelect?.(route.id)}
            />
          </div>
        </div>

        <Separator />

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          {t("TapARouteOrLanePillToFilterTheMap")}
        </p>
      </div>
    );
  }
);

BusStopPopup.displayName = "BusStopPopup";
