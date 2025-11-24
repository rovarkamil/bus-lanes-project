"use client";

import { useMemo, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useMapData } from "@/hooks/public-hooks/use-map";
import InteractiveBusMap from "@/components/map/interactive-bus-map";
import { useTranslation } from "@/i18n/client";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { settingsMap } from "@/lib/settings";
import { CoordinateTuple } from "@/types/map";
import { MapFilterPopover } from "@/components/map/public/map-filter-popover";

const STARTING_POSITION_CACHE_KEY = "map-starting-position";

const isValidCoordinate = (coord: { lat: number; lng: number }): boolean => {
  return (
    typeof coord.lat === "number" &&
    typeof coord.lng === "number" &&
    !isNaN(coord.lat) &&
    !isNaN(coord.lng) &&
    coord.lat >= -90 &&
    coord.lat <= 90 &&
    coord.lng >= -180 &&
    coord.lng <= 180
  );
};

const MapPage = () => {
  const { t, i18n } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  const { data, isPending, error } = useMapData();
  const payload = data?.data;
  const { getSetting } = useSettingsStore();

  // Filter state
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedLanes, setSelectedLanes] = useState<string[]>([]);
  const [showStops, setShowStops] = useState(true);

  // Get starting location from localStorage first, then settings
  const initialCenter = useMemo(() => {
    // Try to get from localStorage first (faster)
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(STARTING_POSITION_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as { lat: number; lng: number };
          if (isValidCoordinate(parsed)) {
            return [parsed.lat, parsed.lng] as CoordinateTuple;
          }
        }
      } catch {
        // Invalid cached data, continue to settings
      }
    }

    // Fallback to settings
    const value = getSetting(settingsMap.STARTING_POSITION);
    if (!value) return null;
    try {
      const parsed = JSON.parse(value) as { lat: number; lng: number };
      if (isValidCoordinate(parsed)) {
        // Save to localStorage for next time
        if (typeof window !== "undefined") {
          localStorage.setItem(
            STARTING_POSITION_CACHE_KEY,
            JSON.stringify(parsed)
          );
        }
        return [parsed.lat, parsed.lng] as CoordinateTuple;
      }
    } catch {
      // Invalid JSON
    }
    return null;
  }, [getSetting]);

  // Sync localStorage when settings change
  useEffect(() => {
    const value = getSetting(settingsMap.STARTING_POSITION);
    if (value && typeof window !== "undefined") {
      try {
        const parsed = JSON.parse(value) as { lat: number; lng: number };
        if (isValidCoordinate(parsed)) {
          localStorage.setItem(
            STARTING_POSITION_CACHE_KEY,
            JSON.stringify(parsed)
          );
        }
      } catch {
        // Invalid JSON, clear cache
        localStorage.removeItem(STARTING_POSITION_CACHE_KEY);
      }
    } else if (typeof window !== "undefined") {
      // Clear cache if setting is empty
      localStorage.removeItem(STARTING_POSITION_CACHE_KEY);
    }
  }, [getSetting]);

  // Prevent body scrolling
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalStyle;
      document.documentElement.style.overflow = originalStyle;
    };
  }, []);

  return (
    <main
      className="relative w-full overflow-hidden"
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        height: "100vh",
        width: "100vw",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
      }}
    >
      {isPending && !payload ? (
        <div className="flex h-full items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t("LoadingLiveMapData")}
        </div>
      ) : error ? (
        <div className="flex h-full items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-lg font-semibold text-destructive">
              {t("UnableToLoadMapData")}
            </p>
            <p className="text-sm text-destructive/80">
              {error.message || t("PleaseTryAgainInAMoment")}
            </p>
          </div>
        </div>
      ) : (
        <>
          <InteractiveBusMap
            stops={payload?.stops ?? []}
            lanes={payload?.lanes ?? []}
            routes={payload?.routes ?? []}
            zones={payload?.zones ?? []}
            services={payload?.services ?? []}
            initialCenter={initialCenter ?? undefined}
            selectedServices={selectedServices}
            selectedLanes={selectedLanes}
            showStops={showStops}
            className="h-full w-full"
          />
          <MapFilterPopover
            selectedServices={selectedServices}
            selectedLanes={selectedLanes}
            showStops={showStops}
            onServicesChange={setSelectedServices}
            onLanesChange={setSelectedLanes}
            onStopsChange={setShowStops}
          />
        </>
      )}
    </main>
  );
};

export default MapPage;
