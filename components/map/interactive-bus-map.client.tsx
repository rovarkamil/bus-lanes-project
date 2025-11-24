"use client";

import { ReactNode, useCallback, useMemo, useState, useEffect } from "react";
import {
  Marker,
  Popup,
  Tooltip,
  Polyline,
  Polygon,
  useMap,
} from "react-leaflet";
import L, { Icon, LatLngExpression, LatLngBoundsExpression } from "leaflet";
import { LeafletMap } from "@/components/map/leaflet-map";
import { BusStopPopup } from "@/components/map/bus-stop-popup";
import { TransportServicePopup } from "@/components/map/public/transport-service-popup";
import {
  MapStop,
  MapLane,
  MapRoute,
  MapZone,
  MapTransportService,
  MapIconData,
  CoordinateTuple,
} from "@/types/map";
import { useLocale } from "@/components/locale-provder";
import { getLocalizedValue } from "@/lib/i18n/get-localized-value";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/client";
import {
  createDefaultMarkerIcon,
  createStopMarkerIcon,
} from "@/lib/map/marker-icons";

const DEFAULT_CENTER: LatLngExpression = [36.1911, 44.0092];
const DEFAULT_ZOOM = 13;
const DEFAULT_ZOOM_WITH_POSITION = 15; // Higher zoom when position is set

const MapAutoFit = ({ bounds }: { bounds: LatLngBoundsExpression | null }) => {
  const map = useMap();

  useEffect(() => {
    if (!bounds) return;
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 17 });
  }, [bounds, map]);

  return null;
};

const createCustomIcon = (icon?: MapIconData | null): Icon | undefined => {
  if (!icon?.fileUrl || typeof window === "undefined") return undefined;
  const size = icon.iconSize ?? 32;
  return L.icon({
    iconUrl: icon.fileUrl,
    iconSize: [size, size],
    iconAnchor: [icon.iconAnchorX ?? size / 2, icon.iconAnchorY ?? size],
    popupAnchor: [icon.popupAnchorX ?? 0, icon.popupAnchorY ?? -size / 2],
  });
};

const collectPoints = (
  coords: CoordinateTuple[] | undefined,
  accumulator: CoordinateTuple[]
) => {
  if (!coords?.length) return;
  accumulator.push(...coords);
};

export interface InteractiveBusMapProps {
  stops?: MapStop[];
  lanes?: MapLane[];
  routes?: MapRoute[];
  zones?: MapZone[];
  services?: MapTransportService[];
  initialCenter?: LatLngExpression;
  initialZoom?: number;
  className?: string;
  onLaneSelect?: (laneId: string) => void;
  onRouteSelect?: (routeId: string) => void;
  onStopSelect?: (stopId: string) => void;
  selectedServices?: string[];
  selectedLanes?: string[];
  showStops?: boolean;
}

export const InteractiveBusMap = ({
  stops = [],
  lanes = [],
  routes = [],
  zones = [],
  services = [],
  initialCenter = DEFAULT_CENTER,
  initialZoom,
  className,
  onLaneSelect,
  onRouteSelect,
  onStopSelect,
  selectedServices = [],
  selectedLanes = [],
  showStops = true,
}: InteractiveBusMapProps) => {
  // Use higher zoom if initialCenter is provided (from settings)
  const effectiveZoom = useMemo(() => {
    if (initialZoom !== undefined) return initialZoom;
    // If center is provided and not default, use higher zoom
    // Check if center is different from default by comparing string representation
    if (initialCenter) {
      const centerStr = JSON.stringify(initialCenter);
      const defaultStr = JSON.stringify(DEFAULT_CENTER);
      if (centerStr !== defaultStr) {
        return DEFAULT_ZOOM_WITH_POSITION;
      }
    }
    return DEFAULT_ZOOM;
  }, [initialCenter, initialZoom]);
  const { t, i18n } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  const locale = useLocale();
  const stopMarkerIcon = useMemo(() => createStopMarkerIcon(), []);
  const defaultMarkerIcon = useMemo(() => createDefaultMarkerIcon(), []);

  // Progressive lane disclosure: track which services/lanes are expanded
  const [expandedServices, setExpandedServices] = useState<Set<string>>(
    new Set()
  );

  const filteredStops = useMemo(() => {
    if (!showStops) return [];

    return stops.filter((stop) => {
      if (stop.isActive === false) return false;

      // Filter by selected services
      if (selectedServices.length > 0) {
        const serviceIds = new Set([
          ...(stop.serviceIds ?? []),
          ...(stop.services?.map((service) => service.id) ?? []),
          ...(stop.routes
            ?.map((route) => route.serviceId)
            .filter(Boolean) as string[]),
          ...(stop.lanes
            ?.map((lane) => lane.serviceId)
            .filter(Boolean) as string[]),
        ]);
        if (serviceIds.size === 0) return false;
        const hasMatch = Array.from(serviceIds).some((id) =>
          selectedServices.includes(id)
        );
        if (!hasMatch) return false;
      }

      return true;
    });
  }, [stops, selectedServices, showStops]);

  const filteredLanes = useMemo(
    () =>
      lanes.filter((lane) => {
        if (lane.isActive === false) return false;

        // Filter by selected services
        if (selectedServices.length > 0) {
          const laneServiceId = lane.serviceId ?? lane.service?.id;
          if (!laneServiceId || !selectedServices.includes(laneServiceId)) {
            return false;
          }
        }

        // Filter by selected lanes
        if (selectedLanes.length > 0) {
          if (!selectedLanes.includes(lane.id)) {
            return false;
          }
        }

        return true;
      }),
    [lanes, selectedServices, selectedLanes]
  );

  const filteredRoutes = useMemo(
    () =>
      routes.filter((route) => {
        if (route.isActive === false) return false;

        // Filter by selected services
        if (selectedServices.length > 0) {
          const routeServiceId = route.serviceId ?? route.service?.id;
          if (!routeServiceId || !selectedServices.includes(routeServiceId)) {
            return false;
          }
        }

        return true;
      }),
    [routes, selectedServices]
  );

  const activeZones = useMemo(
    () => zones.filter((zone) => zone.isActive ?? true),
    [zones]
  );

  const bounds = useMemo(() => {
    const points: CoordinateTuple[] = [];

    filteredStops.forEach((stop) =>
      points.push([stop.latitude, stop.longitude])
    );
    filteredLanes.forEach((lane) => collectPoints(lane.path, points));
    filteredRoutes.forEach((route) => collectPoints(route.path, points));
    activeZones.forEach((zone) => collectPoints(zone.polygon, points));

    if (!points.length) return null;
    return L.latLngBounds(points as LatLngExpression[]);
  }, [filteredStops, filteredLanes, filteredRoutes, activeZones]);

  const renderStopMarkers = () => {
    return filteredStops.map((stop) => {
      const localizedName =
        getLocalizedValue(stop.name, locale) ?? `Stop ${stop.id}`;
      const icon =
        createCustomIcon(stop.icon) ??
        stopMarkerIcon ??
        defaultMarkerIcon ??
        new L.Icon.Default();
      return (
        <Marker
          key={stop.id}
          position={[stop.latitude, stop.longitude]}
          icon={icon}
          eventHandlers={{
            click: () => onStopSelect?.(stop.id),
          }}
        >
          <Tooltip direction="top" offset={[0, -10]} sticky>
            {localizedName}
          </Tooltip>
          <Popup minWidth={320} maxWidth={360}>
            <BusStopPopup
              stop={stop}
              onLaneSelect={onLaneSelect}
              onRouteSelect={onRouteSelect}
            />
          </Popup>
        </Marker>
      );
    });
  };

  // Handle starting point click to expand service
  const handleStartingPointClick = useCallback((serviceId: string) => {
    setExpandedServices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  }, []);

  // Group lanes by service for progressive disclosure
  // Use all lanes (not filtered) for starting points so they're always visible
  const lanesByService = useMemo(() => {
    const grouped = new Map<string, MapLane[]>();
    lanes.forEach((lane) => {
      if (lane.isActive === false) return;
      const serviceId = lane.serviceId ?? lane.service?.id ?? "unknown";
      if (!grouped.has(serviceId)) {
        grouped.set(serviceId, []);
      }
      grouped.get(serviceId)!.push(lane);
    });
    return grouped;
  }, [lanes]);

  // Render starting point markers (always show, even when service is filtered or expanded)
  const renderStartingPointMarkers = () => {
    const markers: ReactNode[] = [];

    lanesByService.forEach((serviceLanes, serviceId) => {
      // Always show starting points, even if service is expanded (for collapse functionality)

      serviceLanes.forEach((lane) => {
        if (!lane.path?.length) return;
        const startPoint = lane.path[0];
        const service = services.find((s) => s.id === serviceId);

        // Create icon from service or use default
        let icon = defaultMarkerIcon;
        if (service?.icon?.fileUrl) {
          try {
            const size = service.icon.iconSize ?? 32;
            icon = L.icon({
              iconUrl: service.icon.fileUrl,
              iconSize: [size, size],
              iconAnchor: [
                service.icon.iconAnchorX ?? size / 2,
                service.icon.iconAnchorY ?? size,
              ],
              popupAnchor: [
                service.icon.popupAnchorX ?? 0,
                service.icon.popupAnchorY ?? -size / 2,
              ],
            });
          } catch {
            // Fallback to default
          }
        } else if (typeof window !== "undefined") {
          // Use default starting marker
          try {
            icon = L.icon({
              iconUrl: "/markers/starting.png",
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32],
            });
          } catch {
            // Fallback
          }
        }

        const isExpanded = expandedServices.has(serviceId);
        markers.push(
          <Marker
            key={`start-${lane.id}`}
            position={startPoint}
            icon={icon}
            eventHandlers={{
              click: () => handleStartingPointClick(serviceId),
            }}
          >
            <Tooltip sticky>
              {isExpanded
                ? `${t("ClickToCollapseLanes") || "Click to collapse lanes"} - `
                : `${t("ClickToShowLanes") || "Click to show lanes"} - `}
              {getLocalizedValue(service?.name, locale) || serviceId}
            </Tooltip>
            <Popup minWidth={320} maxWidth={360}>
              <TransportServicePopup
                service={service}
                serviceId={serviceId}
                lanes={filteredLanes.filter(
                  (l) => (l.serviceId ?? l.service?.id) === serviceId
                )}
                routes={filteredRoutes.filter(
                  (r) => (r.serviceId ?? r.service?.id) === serviceId
                )}
                stops={filteredStops.filter((stop) => {
                  const stopServiceIds = new Set([
                    ...(stop.serviceIds ?? []),
                    ...(stop.services?.map((s) => s.id) ?? []),
                    ...(stop.routes
                      ?.map((route) => route.serviceId)
                      .filter(Boolean) as string[]),
                    ...(stop.lanes
                      ?.map((lane) => lane.serviceId)
                      .filter(Boolean) as string[]),
                  ]);
                  return stopServiceIds.has(serviceId);
                })}
              />
            </Popup>
          </Marker>
        );
      });
    });

    return markers;
  };

  const renderLanePolylines = () => {
    const polylines: ReactNode[] = [];

    filteredLanes.forEach((lane) => {
      if (!lane.path?.length) return;

      const serviceId = lane.serviceId ?? lane.service?.id;
      const shouldShowLane = !serviceId || expandedServices.has(serviceId);

      if (!shouldShowLane) return; // Only show if service is expanded

      const color = lane.color ?? lane.service?.color ?? "#2563eb";

      // Render polyline
      polylines.push(
        <Polyline
          key={lane.id}
          positions={lane.path}
          pathOptions={{
            color,
            weight: lane.weight ?? 5,
            opacity: lane.opacity ?? 0.85,
          }}
        >
          <Tooltip sticky>
            {getLocalizedValue(lane.name, locale) ?? lane.id}
          </Tooltip>
        </Polyline>
      );

      // Render end point marker if expanded
      if (shouldShowLane && lane.path.length > 1) {
        const endPoint = lane.path[lane.path.length - 1];
        const startPoint = lane.path[0];

        // Only show end marker if different from start
        if (startPoint[0] !== endPoint[0] || startPoint[1] !== endPoint[1]) {
          let endIcon = defaultMarkerIcon;
          const service = services.find((s) => s.id === serviceId);

          if (service?.icon?.fileUrl) {
            try {
              const size = service.icon.iconSize ?? 32;
              endIcon = L.icon({
                iconUrl: service.icon.fileUrl,
                iconSize: [size, size],
                iconAnchor: [
                  service.icon.iconAnchorX ?? size / 2,
                  service.icon.iconAnchorY ?? size,
                ],
                popupAnchor: [
                  service.icon.popupAnchorX ?? 0,
                  service.icon.popupAnchorY ?? -size / 2,
                ],
              });
            } catch {
              // Fallback
            }
          } else if (typeof window !== "undefined") {
            try {
              endIcon = L.icon({
                iconUrl: "/markers/end.png",
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32],
              });
            } catch {
              // Fallback
            }
          }

          polylines.push(
            <Marker key={`end-${lane.id}`} position={endPoint} icon={endIcon}>
              <Tooltip sticky>
                End: {getLocalizedValue(lane.name, locale) ?? lane.id}
              </Tooltip>
            </Marker>
          );
        }
      }
    });

    return polylines;
  };

  const renderRoutePolylines = () => {
    return filteredRoutes.map((route) => {
      if (!route.path?.length) return null;
      const color = route.color ?? route.service?.color ?? "#f97316";
      return (
        <Polyline
          key={route.id}
          positions={route.path}
          pathOptions={{
            color,
            weight: 3,
            opacity: 0.9,
            dashArray: "6 6",
          }}
        >
          <Tooltip sticky>
            {route.routeNumber
              ? `${route.routeNumber} • ${
                  getLocalizedValue(route.name, locale) ?? route.id
                }`
              : (getLocalizedValue(route.name, locale) ?? route.id)}
          </Tooltip>
        </Polyline>
      );
    });
  };

  const renderZonePolygons = () => {
    return activeZones
      .filter((zone) => zone.polygon?.length)
      .map((zone) => (
        <Polygon
          key={zone.id}
          positions={zone.polygon as LatLngExpression[]}
          pathOptions={{
            color: zone.color ?? "#0f172a",
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.1,
          }}
        >
          <Tooltip sticky>
            {getLocalizedValue(zone.name, locale) ?? zone.id}
          </Tooltip>
        </Polygon>
      ));
  };

  return (
    <div
      className={cn("w-full h-full relative overflow-hidden", className)}
      dir={isRTL ? "rtl" : "ltr"}
      style={{ height: "100%", width: "100%", overflow: "hidden" }}
    >
      <LeafletMap
        center={initialCenter}
        zoom={effectiveZoom}
        className="h-full w-full"
      >
        {/* Only auto-fit if no initial center is provided */}
        {bounds && !initialCenter && <MapAutoFit bounds={bounds} />}
        {renderZonePolygons()}
        {renderStartingPointMarkers()}
        {renderLanePolylines()}
        {renderRoutePolylines()}
        {renderStopMarkers()}
      </LeafletMap>
    </div>
  );
};

export default InteractiveBusMap;
