"use client";

import { useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Filter, X, MapPin, Compass, Layers3, Eye } from "lucide-react";
import { useTranslation } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { MapLane, MapTransportService } from "@/types/map";
import Image from "next/image";

interface MapFilterPopoverProps {
  services: MapTransportService[];
  lanes: MapLane[];
  selectedServices?: string[];
  selectedLanes?: string[];
  showStops?: boolean;
  onServicesChange?: (serviceIds: string[]) => void;
  onLanesChange?: (laneIds: string[]) => void;
  onStopsChange?: (show: boolean) => void;
  onServiceFocus?: (serviceId: string) => void;
  onLaneFocus?: (laneId: string) => void;
}

const ServiceBadge = ({ service }: { service: MapTransportService }) => {
  if (service.icon?.fileUrl) {
    return (
      <div className="relative h-6 w-6 overflow-hidden rounded-full border border-border/40 bg-muted/50">
        <Image
          src={service.icon.fileUrl}
          alt={service.name?.en || service.type}
          fill
          sizes="24px"
          className="object-contain"
        />
      </div>
    );
  }
  return (
    <Image
      src="/markers/starting.png"
      alt="Default transport marker"
      width={24}
      height={24}
      className="h-6 w-6 rounded-full border border-border/40 object-contain bg-muted/30 p-0.5"
    />
  );
};

export function MapFilterPopover({
  services,
  lanes,
  selectedServices = [],
  selectedLanes = [],
  showStops = true,
  onServicesChange,
  onLanesChange,
  onStopsChange,
  onServiceFocus,
  onLaneFocus,
}: MapFilterPopoverProps) {
  const { t, i18n } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  const [isOpen, setIsOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    const servicesCount =
      selectedServices.length > 0 && selectedServices.length < services.length
        ? selectedServices.length
        : 0;
    const lanesCount =
      selectedLanes.length > 0 && selectedLanes.length < lanes.length
        ? selectedLanes.length
        : 0;
    const stopsCount = showStops ? 0 : 1;
    return servicesCount + lanesCount + stopsCount;
  }, [
    selectedServices,
    selectedLanes,
    showStops,
    services.length,
    lanes.length,
  ]);

  const handleServiceToggle = (serviceId: string) => {
    const updated = selectedServices.includes(serviceId)
      ? selectedServices.filter((id) => id !== serviceId)
      : [...selectedServices, serviceId];
    onServicesChange?.(updated);
  };

  const handleLaneToggle = (laneId: string) => {
    const updated = selectedLanes.includes(laneId)
      ? selectedLanes.filter((id) => id !== laneId)
      : [...selectedLanes, laneId];
    onLanesChange?.(updated);
  };

  const handleClearAll = () => {
    onServicesChange?.([]);
    onLanesChange?.([]);
    onStopsChange?.(true);
  };

  const handleSelectAllServices = () => {
    if (selectedServices.length === services.length) {
      onServicesChange?.([]);
    } else {
      onServicesChange?.(services.map((service) => service.id));
    }
  };

  const handleSelectAllLanes = () => {
    if (selectedLanes.length === lanes.length) {
      onLanesChange?.([]);
    } else {
      onLanesChange?.(lanes.map((lane) => lane.id));
    }
  };

  const renderServiceSection = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-semibold">
            {t("TransportServices")}
          </Label>
        </div>
        {services.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleSelectAllServices}
          >
            {selectedServices.length === services.length
              ? t("ClearAll")
              : t("ShowAll")}
          </Button>
        )}
      </div>
      {services.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("NoServices")}</p>
      ) : (
        <div className="space-y-2">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/70 px-3 py-2"
            >
              <div className="flex flex-1 items-center gap-3">
                <Checkbox
                  id={`service-${service.id}`}
                  checked={selectedServices.includes(service.id)}
                  onCheckedChange={() => handleServiceToggle(service.id)}
                />
                <Label
                  htmlFor={`service-${service.id}`}
                  className="flex flex-1 cursor-pointer items-center gap-3 text-sm"
                >
                  <ServiceBadge service={service} />
                  <div className="flex flex-col leading-tight">
                    <span className="font-medium">
                      {service.name?.[i18n.language] ||
                        service.name?.en ||
                        service.id}
                    </span>
                    <span className="text-[11px] uppercase text-muted-foreground">
                      {t("TransportServiceType.Label")}:{" "}
                      {t(`TransportServiceType.${service.type ?? "UNKNOWN"}`)}
                    </span>
                  </div>
                </Label>
              </div>
              {onServiceFocus && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={() => onServiceFocus(service.id)}
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">{t("FocusOnMap")}</span>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderLaneSection = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers3 className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-semibold">{t("BusLanes")}</Label>
          <Badge variant="outline" className="text-[10px]">
            {lanes.length}
          </Badge>
        </div>
        {lanes.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleSelectAllLanes}
          >
            {selectedLanes.length === lanes.length
              ? t("ClearAll")
              : t("ShowAll")}
          </Button>
        )}
      </div>
      {lanes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("NoLanes")}</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {lanes.map((lane) => (
            <div
              key={lane.id}
              className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/70 px-3 py-2"
            >
              <div className="flex flex-1 items-center gap-3">
                <Checkbox
                  id={`lane-${lane.id}`}
                  checked={selectedLanes.includes(lane.id)}
                  onCheckedChange={() => handleLaneToggle(lane.id)}
                />
                <Label
                  htmlFor={`lane-${lane.id}`}
                  className="flex flex-1 cursor-pointer items-center gap-3 text-sm"
                >
                  {lane.color ? (
                    <span
                      className="h-4 w-4 rounded-full border border-border/30"
                      style={{ backgroundColor: lane.color }}
                    />
                  ) : (
                    <Image
                      src="/markers/end.png"
                      alt="Default lane marker"
                      width={20}
                      height={20}
                      className="h-5 w-5 object-contain"
                    />
                  )}
                  <span>
                    {lane.name?.[i18n.language] || lane.name?.en || lane.id}
                  </span>
                </Label>
              </div>
              {onLaneFocus && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={() => onLaneFocus(lane.id)}
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">{t("FocusOnMap")}</span>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStopsSection = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-semibold">{t("Stops")}</Label>
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/70 px-3 py-2">
        <Checkbox
          id="stops-toggle"
          checked={showStops}
          onCheckedChange={(checked) => onStopsChange?.(checked === true)}
        />
        <Label htmlFor="stops-toggle" className="text-sm">
          {showStops
            ? t("ShowingStops") || "Showing all stops"
            : t("HideStops") || "Hide stops"}
        </Label>
      </div>
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className={cn(
            "fixed bottom-6 right-6 z-[1500] h-14 w-14 rounded-full shadow-lg",
            isRTL && "right-auto left-6"
          )}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <Filter className="h-5 w-5" />
          {activeFilterCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full p-0 text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[92vw] max-w-lg max-h-[75vh] p-0 z-[2000]",
          isRTL && "rtl"
        )}
        align="end"
        side="top"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b bg-background/95 px-4 py-3">
            <div>
              <h3 className="text-lg font-semibold">{t("Filters")}</h3>
              <p className="text-xs text-muted-foreground">
                {t("ActiveFilters")}: {activeFilterCount}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleClearAll}
                >
                  {t("ClearAll")}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-6 p-4">
              {renderServiceSection()}
              <Separator />
              {renderLaneSection()}
              <Separator />
              {renderStopsSection()}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
