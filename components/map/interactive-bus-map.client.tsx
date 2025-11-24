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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LeafletMap } from "@/components/map/leaflet-map";
import { BusStopPopup } from "@/components/map/bus-stop-popup";
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
import {
  Search,
  MapPin,
  Layers,
  Route as RouteIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTranslation } from "@/i18n/client";
import {
  createDefaultMarkerIcon,
  createStopMarkerIcon,
} from "@/lib/map/marker-icons";

const DEFAULT_CENTER: LatLngExpression = [36.1911, 44.0092];
const DEFAULT_ZOOM = 13;

type LayerToggle = "stops" | "lanes" | "routes" | "zones";

const defaultLayerState: Record<LayerToggle, boolean> = {
  stops: true,
  lanes: true,
  routes: true,
  zones: false,
};

const MapAutoFit = ({ bounds }: { bounds: LatLngBoundsExpression | null }) => {
  const map = useMap();

  useEffect(() => {
    if (!bounds) return;
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 17 });
  }, [bounds, map]);

  return null;
};

const ServiceLegend = ({
  services,
  activeIds,
  onToggle,
}: {
  services: MapTransportService[];
  activeIds: string[];
  onToggle: (serviceId: string) => void;
}) => {
  const { t, i18n } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  if (!services.length) return null;

  return (
    <Card className="space-y-3 p-4 shadow-lg" dir={isRTL ? "rtl" : "ltr"}>
      <div className="text-sm font-semibold">{t("TransportServices")}</div>
      <div className="flex flex-wrap gap-2">
        {services.map((service) => {
          const isActive = activeIds.includes(service.id);
          return (
            <Button
              key={service.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="h-8 rounded-full px-3 text-xs"
              style={
                service.color
                  ? {
                      backgroundColor: isActive
                        ? service.color
                        : `${service.color}12`,
                      color: isActive ? "#fff" : service.color,
                    }
                  : undefined
              }
              onClick={() => onToggle(service.id)}
            >
              {service.type}
            </Button>
          );
        })}
      </div>
    </Card>
  );
};

const LayerToggleGroup = ({
  state,
  onChange,
}: {
  state: Record<LayerToggle, boolean>;
  onChange: (key: LayerToggle) => void;
}) => {
  const { t, i18n } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  const config: { key: LayerToggle; label: string; icon: ReactNode }[] = [
    {
      key: "stops",
      label: t("Stops"),
      icon: <MapPin className="h-3.5 w-3.5" />,
    },
    {
      key: "lanes",
      label: t("Lanes"),
      icon: <Layers className="h-3.5 w-3.5" />,
    },
    {
      key: "routes",
      label: t("Routes"),
      icon: <RouteIcon className="h-3.5 w-3.5" />,
    },
    {
      key: "zones",
      label: t("Zones"),
      icon: <Layers className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <Card className="p-3 shadow-lg" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-3 text-sm font-semibold">{t("Layers")}</div>
      <div className="grid grid-cols-2 gap-2">
        {config.map((layer) => {
          const isActive = state[layer.key];
          const IconComponent = isActive ? Eye : EyeOff;
          return (
            <Button
              key={layer.key}
              type="button"
              variant={isActive ? "default" : "outline"}
              className="flex items-center gap-2 text-xs"
              onClick={() => onChange(layer.key)}
            >
              {layer.icon}
              {layer.label}
              <IconComponent className="ml-auto h-4 w-4 opacity-80" />
            </Button>
          );
        })}
      </div>
    </Card>
  );
};

const SearchControl = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const { t, i18n } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  return (
    <div className="relative" dir={isRTL ? "rtl" : "ltr"}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("SearchStopsRoutes")}
        className="pl-10"
      />
    </div>
  );
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
}

export const InteractiveBusMap = ({
  stops = [],
  lanes = [],
  routes = [],
  zones = [],
  services = [],
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  className,
  onLaneSelect,
  onRouteSelect,
  onStopSelect,
}: InteractiveBusMapProps) => {
  const { t, i18n } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  const locale = useLocale();
  const stopMarkerIcon = useMemo(() => createStopMarkerIcon(), []);
  const defaultMarkerIcon = useMemo(() => createDefaultMarkerIcon(), []);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeServiceIds, setActiveServiceIds] = useState<string[]>([]);
  const [layers, setLayers] =
    useState<Record<LayerToggle, boolean>>(defaultLayerState);

  const serviceMap = useMemo(() => {
    const map = new Map<string, MapTransportService>();
    services.forEach((service) => {
      map.set(service.id, service);
    });
    return map;
  }, [services]);

  const toggleService = useCallback((serviceId: string) => {
    setActiveServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  }, []);

  const toggleLayer = useCallback((key: LayerToggle) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const matchesService = useCallback(
    (serviceId?: string | null) => {
      if (!activeServiceIds.length) return true;
      if (!serviceId) return false;
      return activeServiceIds.includes(serviceId);
    },
    [activeServiceIds]
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredStops = useMemo(() => {
    return stops.filter((stop) => {
      if (stop.isActive === false) return false;

      if (activeServiceIds.length) {
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
          activeServiceIds.includes(id)
        );
        if (!hasMatch) return false;
      }

      if (!normalizedSearch) return true;

      const tokens = [
        stop.id,
        getLocalizedValue(stop.name, locale),
        getLocalizedValue(stop.description, locale),
      ]
        .filter(Boolean)
        .map((value) => value!.toLowerCase());

      return tokens.some((token) => token.includes(normalizedSearch));
    });
  }, [stops, activeServiceIds, normalizedSearch, locale]);

  const filteredLanes = useMemo(
    () =>
      lanes.filter((lane) => {
        if (lane.isActive === false) return false;
        return matchesService(lane.serviceId ?? lane.service?.id ?? null);
      }),
    [lanes, matchesService]
  );

  const filteredRoutes = useMemo(
    () =>
      routes.filter((route) => {
        if (route.isActive === false) return false;
        return matchesService(route.serviceId ?? route.service?.id ?? null);
      }),
    [routes, matchesService]
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
    if (!layers.stops) return null;
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

  const renderLanePolylines = () => {
    if (!layers.lanes) return null;
    return filteredLanes.map((lane) => {
      if (!lane.path?.length) return null;
      const color = lane.color ?? lane.service?.color ?? "#2563eb";
      return (
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
    });
  };

  const renderRoutePolylines = () => {
    if (!layers.routes) return null;
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
    if (!layers.zones) return null;
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
      className={cn("w-full space-y-4", className)}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 space-y-4">
          <SearchControl value={searchTerm} onChange={setSearchTerm} />
          <LayerToggleGroup state={layers} onChange={toggleLayer} />
        </div>
        <ServiceLegend
          services={services}
          activeIds={activeServiceIds}
          onToggle={toggleService}
        />
      </div>

      <div className="relative">
        <LeafletMap
          center={initialCenter}
          zoom={initialZoom}
          className="h-[620px]"
        >
          {bounds && <MapAutoFit bounds={bounds} />}
          {renderZonePolygons()}
          {renderLanePolylines()}
          {renderRoutePolylines()}
          {renderStopMarkers()}
        </LeafletMap>

        <div className="pointer-events-none">
          <Card className="pointer-events-auto absolute bottom-6 left-6 max-w-xs space-y-2 p-4 shadow-2xl">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("ActiveFilters")}
            </div>
            {activeServiceIds.length ? (
              <div className="flex flex-wrap gap-2">
                {activeServiceIds.map((serviceId) => {
                  const service = serviceMap.get(serviceId);
                  return (
                    <Badge
                      key={serviceId}
                      variant="secondary"
                      className="flex items-center gap-1"
                      style={
                        service?.color
                          ? {
                              backgroundColor: `${service.color}1a`,
                              color: service.color,
                            }
                          : undefined
                      }
                    >
                      {service?.type ?? serviceId}
                      <button
                        type="button"
                        className="ml-1 text-xs"
                        onClick={() => toggleService(serviceId)}
                      >
                        ×
                      </button>
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("ShowingAllServices")}
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InteractiveBusMap;
