"use client";

import { useState, useMemo } from "react";
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
import { Filter, X } from "lucide-react";
import { useTranslation } from "@/i18n/client";
import { useFetchTransportServices } from "@/hooks/public-hooks/use-transport-service";
import { useFetchBusLanes } from "@/hooks/public-hooks/use-bus-lane";
import { cn } from "@/lib/utils";

interface MapFilterPopoverProps {
  selectedServices?: string[];
  selectedLanes?: string[];
  showStops?: boolean;
  onServicesChange?: (serviceIds: string[]) => void;
  onLanesChange?: (laneIds: string[]) => void;
  onStopsChange?: (show: boolean) => void;
}

export function MapFilterPopover({
  selectedServices = [],
  selectedLanes = [],
  showStops = true,
  onServicesChange,
  onLanesChange,
  onStopsChange,
}: MapFilterPopoverProps) {
  const { t, i18n } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  const [isOpen, setIsOpen] = useState(false);

  // Fetch services and lanes for filter list
  const { data: servicesData } = useFetchTransportServices({
    page: 1,
    limit: 100,
  });

  const { data: lanesData } = useFetchBusLanes({
    page: 1,
    limit: 1000,
  });

  const services = servicesData?.items || [];
  const lanes = lanesData?.items || [];

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedServices.length > 0) count += selectedServices.length;
    if (selectedLanes.length > 0) count += selectedLanes.length;
    if (!showStops) count += 1; // Count stops as active if hidden
    return count;
  }, [selectedServices.length, selectedLanes.length, showStops]);

  const handleServiceToggle = (serviceId: string) => {
    const newServices = selectedServices.includes(serviceId)
      ? selectedServices.filter((id) => id !== serviceId)
      : [...selectedServices, serviceId];
    onServicesChange?.(newServices);
  };

  const handleLaneToggle = (laneId: string) => {
    const newLanes = selectedLanes.includes(laneId)
      ? selectedLanes.filter((id) => id !== laneId)
      : [...selectedLanes, laneId];
    onLanesChange?.(newLanes);
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
      onServicesChange?.(services.map((s) => s.id));
    }
  };

  const handleSelectAllLanes = () => {
    if (selectedLanes.length === lanes.length) {
      onLanesChange?.([]);
    } else {
      onLanesChange?.(lanes.map((l) => l.id));
    }
  };

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
              className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[90vw] max-w-md max-h-[70vh] p-0 z-[2000]",
          isRTL && "rtl"
        )}
        align="end"
        side="top"
        dir={isRTL ? "rtl" : "ltr"}
        style={{ zIndex: 2000 }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-lg">{t("Filters")}</h3>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-8 text-xs"
                >
                  {t("ClearAll")}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Transport Services */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    {t("TransportServices")}
                  </Label>
                  {services.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAllServices}
                      className="h-7 text-xs"
                    >
                      {selectedServices.length === services.length
                        ? t("ClearAll")
                        : t("ShowAll")}
                    </Button>
                  )}
                </div>
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("NoServices")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center space-x-2 space-x-reverse"
                      >
                        <Checkbox
                          id={`service-${service.id}`}
                          checked={selectedServices.includes(service.id)}
                          onCheckedChange={() =>
                            handleServiceToggle(service.id)
                          }
                        />
                        <Label
                          htmlFor={`service-${service.id}`}
                          className="flex-1 cursor-pointer flex items-center gap-2"
                        >
                          {service.color && (
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: service.color }}
                            />
                          )}
                          <span className="text-sm">
                            {service.name?.en || service.id}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Bus Lanes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    {t("BusLanes")}
                  </Label>
                  {lanes.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAllLanes}
                      className="h-7 text-xs"
                    >
                      {selectedLanes.length === lanes.length
                        ? t("ClearAll")
                        : t("ShowAll")}
                    </Button>
                  )}
                </div>
                {lanes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("NoLanes")}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {lanes.map((lane) => (
                      <div
                        key={lane.id}
                        className="flex items-center space-x-2 space-x-reverse"
                      >
                        <Checkbox
                          id={`lane-${lane.id}`}
                          checked={selectedLanes.includes(lane.id)}
                          onCheckedChange={() => handleLaneToggle(lane.id)}
                        />
                        <Label
                          htmlFor={`lane-${lane.id}`}
                          className="flex-1 cursor-pointer flex items-center gap-2"
                        >
                          {lane.color && (
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: lane.color }}
                            />
                          )}
                          <span className="text-sm">
                            {lane.name?.en || lane.id}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Stops Toggle */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">{t("Stops")}</Label>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="stops-toggle"
                    checked={showStops}
                    onCheckedChange={(checked) =>
                      onStopsChange?.(checked === true)
                    }
                  />
                  <Label
                    htmlFor="stops-toggle"
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {t("Stops")}
                  </Label>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
