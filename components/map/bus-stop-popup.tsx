"use client";

import Image from "next/image";
import { memo, useMemo, useState } from "react";
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
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

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
    const isMobile = useIsMobile();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
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

    const SectionHeader = ({
      icon: Icon,
      label,
      count,
    }: {
      icon: typeof Layers | typeof RouteIcon | typeof CheckSquare;
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

    const renderPopupContent = () => (
      <div
        className="w-[min(90vw,360px)] space-y-4 text-sm text-card-foreground sm:w-[320px]"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="rounded-3xl border border-border/60 bg-card/95 p-4 shadow-xl ring-1 ring-border/30 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-lg font-semibold leading-tight">{stopName}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {stop.latitude.toFixed(5)}, {stop.longitude.toFixed(5)}
              </p>
            </div>
            {stop.zone && (
              <Badge
                variant="secondary"
                className="text-[10px] uppercase"
                style={
                  stop.zone.color
                    ? {
                        backgroundColor: `${stop.zone.color}22`,
                        color: stop.zone.color,
                      }
                    : undefined
                }
              >
                {zoneName ?? stop.zone.id}
              </Badge>
            )}
          </div>

          {description && (
            <p className="mt-2 text-xs text-muted-foreground">{description}</p>
          )}

          {stop.images?.length ? (
            <ScrollArea className="mt-4 h-32 rounded-2xl border border-border/40 bg-background/60">
              <div className="grid grid-cols-2 gap-2 p-2">
                {stop.images.slice(0, 4).map((image) => (
                  <div
                    key={image.id}
                    className="relative h-24 w-full overflow-hidden rounded-xl border border-border/30 bg-muted/30"
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

          <div className="mt-4 space-y-4">
            <div>
              <SectionHeader
                icon={CheckSquare}
                label={t("Amenities")}
                count={enabledAmenities.length}
              />
              {enabledAmenities.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {enabledAmenities.map((amenity) => (
                    <Badge key={amenity.key} variant="outline">
                      {amenity.label}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-2 rounded-2xl bg-muted/30 p-3 text-xs text-muted-foreground">
                  {t("NoAmenitiesData")}
                </p>
              )}
            </div>

            <div>
              <SectionHeader
                icon={Layers}
                label={t("Lanes")}
                count={stop.lanes?.length}
              />
              <div className="mt-2">
                <RelationPills
                  items={stop.lanes}
                  emptyLabel={t("NoLanesAssigned")}
                  icon={Layers}
                  colorFn={(lane) =>
                    lane.color ?? lane.service?.color ?? undefined
                  }
                  getLabel={(lane) =>
                    getLocalizedValue(lane.name, locale) ?? lane.id
                  }
                  onSelect={(lane) => onLaneSelect?.(lane.id)}
                />
              </div>
            </div>

            <div>
              <SectionHeader
                icon={RouteIcon}
                label={t("Routes")}
                count={stop.routes?.length}
              />
              <div className="mt-2">
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
          </div>

          <Separator className="my-4" />

          <p className="flex items-center gap-2 rounded-2xl border border-border/40 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            {t("TapARouteOrLanePillToFilterTheMap")}
          </p>
        </div>
      </div>
    );

    if (isMobile) {
      return (
        <>
          <Button
            variant="secondary"
            size="sm"
            className="mb-3 w-full rounded-full"
            onClick={() => setIsSheetOpen(true)}
          >
            {t("ViewStopDetails")}
          </Button>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent
              side={isRTL ? "right" : "left"}
              className="w-full overflow-y-auto border-border/60 bg-background"
            >
              <SheetHeader>
                <p className="text-base font-semibold">{stopName}</p>
              </SheetHeader>
              <div className="pt-4">{renderPopupContent()}</div>
            </SheetContent>
          </Sheet>
        </>
      );
    }

    return renderPopupContent();
  }
);

BusStopPopup.displayName = "BusStopPopup";
