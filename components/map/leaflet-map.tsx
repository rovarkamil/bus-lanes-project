"use client";

import { ReactNode, useMemo } from "react";
import { MapContainer, MapContainerProps, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import { cn } from "@/lib/utils";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// Ensure default marker assets load correctly when bundled by Next.js.
if (typeof window !== "undefined") {
  const iconOptions = {
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
  };

  L.Icon.Default.mergeOptions(iconOptions);
}

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
  tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  ...containerProps
}: LeafletMapProps) {
  const memoizedCenter = useMemo(() => center, [center]);

  return (
    <MapContainer
      center={memoizedCenter}
      zoom={zoom}
      scrollWheelZoom={true}
      className={cn("relative h-[420px] w-full rounded-lg", className)}
      {...containerProps}
    >
      <TileLayer attribution={tileAttribution} url={tileUrl} />
      {children}
    </MapContainer>
  );
}

export default LeafletMap;
