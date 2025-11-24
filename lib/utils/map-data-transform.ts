import {
  MapDataPayload,
  MapLane,
  MapLaneSummary,
  MapRoute,
  MapRouteSummary,
  MapStop,
  MapTransportService,
  MapZone,
  MapIconData,
  LanguageContent,
  CoordinateTuple,
} from "@/types/map";
import { BusLaneWithRelations } from "@/types/models/bus-lane";
import { BusRouteWithRelations } from "@/types/models/bus-route";
import { BusStopWithRelations } from "@/types/models/bus-stop";
import { TransportServiceWithRelations } from "@/types/models/transport-service";
import { ZoneWithRelations } from "@/types/models/zone";
import { MapIconWithRelations } from "@/types/models/map-icon";
import { Prisma } from "@prisma/client";

const toLanguageContent = (
  language?: { en: string; ar?: string | null; ckb?: string | null } | null
): LanguageContent | undefined => {
  if (!language) return undefined;
  return {
    en: language.en ?? null,
    ar: language.ar ?? null,
    ckb: language.ckb ?? null,
  };
};

const toMapIconData = (
  icon?: MapIconWithRelations | null
): MapIconData | undefined => {
  if (!icon?.file?.url) return undefined;

  return {
    id: icon.id,
    fileUrl: icon.file.url,
    iconSize: icon.iconSize ?? undefined,
    iconAnchorX: icon.iconAnchorX ?? undefined,
    iconAnchorY: icon.iconAnchorY ?? undefined,
    popupAnchorX: icon.popupAnchorX ?? undefined,
    popupAnchorY: icon.popupAnchorY ?? undefined,
  };
};

const parsePath = (path: Prisma.JsonValue): CoordinateTuple[] => {
  if (!Array.isArray(path)) return [];

  const result: CoordinateTuple[] = [];
  path.forEach((point) => {
    if (
      Array.isArray(point) &&
      point.length === 2 &&
      typeof point[0] === "number" &&
      typeof point[1] === "number"
    ) {
      result.push([point[0], point[1]]);
    }
  });
  return result;
};

export const mapTransportService = (
  service?: TransportServiceWithRelations | null
): MapTransportService | undefined => {
  if (!service) return undefined;

  return {
    id: service.id,
    type: service.type,
    color: service.color ?? undefined,
    name: toLanguageContent(service.name),
    isActive: service.isActive ?? undefined,
    icon: toMapIconData(service.icon as MapIconWithRelations | null),
  };
};

export const mapLaneSummary = (lane: BusLaneWithRelations): MapLaneSummary => ({
  id: lane.id,
  name: toLanguageContent(lane.name),
  color: lane.color ?? undefined,
  serviceId: lane.serviceId ?? undefined,
  service: mapTransportService(
    lane.service as TransportServiceWithRelations | null
  ),
});

export const mapLane = (lane: BusLaneWithRelations): MapLane => ({
  ...mapLaneSummary(lane),
  path: parsePath(lane.path as Prisma.JsonValue),
  weight: lane.weight ?? undefined,
  opacity: lane.opacity ?? undefined,
  isActive: lane.isActive ?? undefined,
});

export const mapRouteSummary = (
  route: BusRouteWithRelations
): MapRouteSummary => ({
  id: route.id,
  name: toLanguageContent(route.name),
  routeNumber: route.routeNumber ?? undefined,
  direction: route.direction ?? undefined,
  color: route.service?.color ?? undefined,
  serviceId: route.serviceId ?? undefined,
  service: mapTransportService(
    route.service as TransportServiceWithRelations | null
  ),
});

export const mapRoute = (route: BusRouteWithRelations): MapRoute => ({
  ...mapRouteSummary(route),
  laneIds: route.lanes?.map((lane) => lane.id) ?? [],
  stopIds: route.stops?.map((stop) => stop.id) ?? [],
  isActive: route.isActive ?? undefined,
});

export const mapZone = (zone: ZoneWithRelations): MapZone => ({
  id: zone.id,
  name: toLanguageContent(zone.name),
  color: zone.color ?? undefined,
  isActive: zone.isActive ?? undefined,
});

export const mapStop = (
  stop: BusStopWithRelations,
  allLanes: BusLaneWithRelations[],
  allRoutes: BusRouteWithRelations[]
): MapStop => {
  // Get lanes and routes connected to this stop
  const stopLanes = allLanes.filter((lane) =>
    lane.stops?.some((s) => s.id === stop.id)
  );
  const stopRoutes = allRoutes.filter((route) =>
    route.stops?.some((s) => s.id === stop.id)
  );

  const laneSummaries = stopLanes.map(mapLaneSummary);
  const routeSummaries = stopRoutes.map(mapRouteSummary);

  // Collect unique services from lanes and routes
  const serviceMap = new Map<string, MapTransportService>();
  laneSummaries.forEach((lane) => {
    if (lane.service) {
      serviceMap.set(lane.service.id, lane.service);
    }
  });
  routeSummaries.forEach((route) => {
    if (route.service) {
      serviceMap.set(route.service.id, route.service);
    }
  });

  const amenities = {
    hasShelter: stop.hasShelter ?? false,
    hasBench: stop.hasBench ?? false,
    hasLighting: stop.hasLighting ?? false,
    isAccessible: stop.isAccessible ?? false,
    hasRealTimeInfo: stop.hasRealTimeInfo ?? false,
  };

  return {
    id: stop.id,
    latitude: stop.latitude,
    longitude: stop.longitude,
    name: toLanguageContent(stop.name),
    description: toLanguageContent(stop.description),
    images:
      stop.images?.map((image) => ({
        id: image.id,
        url: image.url,
        name: image.name ?? undefined,
        type: image.type ?? undefined,
        size: image.size ?? undefined,
      })) ?? [],
    icon: toMapIconData(stop.icon as MapIconWithRelations | null),
    zone: stop.zone
      ? {
          id: stop.zone.id,
          name: toLanguageContent(stop.zone.name),
          color: stop.zone.color ?? undefined,
          isActive: stop.zone.isActive ?? undefined,
        }
      : undefined,
    services: Array.from(serviceMap.values()),
    serviceIds: Array.from(serviceMap.keys()),
    lanes: laneSummaries,
    routes: routeSummaries,
    amenities,
    isActive: stop.deletedAt ? false : true,
  };
};

export const transformToMapDataPayload = (
  lanes: BusLaneWithRelations[],
  stops: BusStopWithRelations[],
  routes: BusRouteWithRelations[],
  services: TransportServiceWithRelations[],
  zones: ZoneWithRelations[]
): MapDataPayload => {
  const mapServices = services
    .map(mapTransportService)
    .filter(Boolean) as MapTransportService[];

  return {
    services: mapServices,
    stops: stops.map((stop) => mapStop(stop, lanes, routes)),
    lanes: lanes.map(mapLane),
    routes: routes.map(mapRoute),
    zones: zones.map(mapZone),
  };
};
