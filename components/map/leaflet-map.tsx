"use client";

import dynamic from "next/dynamic";
import { ReactNode, useMemo } from "react";
import type { LatLngExpression, IconOptions } from "leaflet";
import type { MapContainerProps } from "react-leaflet";
import { cn } from "@/lib/utils";
import { DEFAULT_MAP_STYLE, MAP_TILE_STYLES } from "@/lib/map/tile-styles";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
) as unknown as typeof import("react-leaflet").MapContainer;

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
) as unknown as typeof import("react-leaflet").TileLayer;

let hasConfiguredDefaultIcon = false;

let configureIconPromise: Promise<void> | null = null;

const ensureDefaultIcon = () => {
  if (hasConfiguredDefaultIcon || typeof window === "undefined") {
    return;
  }

  if (!configureIconPromise) {
    const iconOptions: IconOptions = {
      iconUrl,
      iconRetinaUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    };

    configureIconPromise = import("leaflet")
      .then((Leaflet) => {
        Leaflet.Icon.Default.mergeOptions(iconOptions);
        hasConfiguredDefaultIcon = true;
      })
      .catch(() => {
        configureIconPromise = null;
      });
  }
};

type LeafletMapProps = {
  center?: LatLngExpression;
  zoom?: number;
  children?: ReactNode;
  className?: string;
  tileUrl?: string;
  tileAttribution?: string;
} & Omit<MapContainerProps, "center" | "zoom" | "className">;

export function LeafletMap({
  center = [36.1911, 44.0092],
  zoom = 13,
  className,
  children,
  tileUrl,
  tileAttribution,
  ...containerProps
}: LeafletMapProps) {
  ensureDefaultIcon();

  const memoizedCenter = useMemo(() => center, [center]);
  const resolvedTileStyle =
    tileUrl && tileAttribution
      ? { url: tileUrl, attribution: tileAttribution }
      : MAP_TILE_STYLES[DEFAULT_MAP_STYLE];

  return (
    <MapContainer
      center={memoizedCenter}
      zoom={zoom}
      scrollWheelZoom={true}
      zoomControl={false}
      className={cn("relative w-full", className || "h-full")}
      {...containerProps}
    >
      <TileLayer
        attribution={resolvedTileStyle.attribution}
        url={resolvedTileStyle.url}
      />
      {children}
    </MapContainer>
  );
}

export default LeafletMap;
