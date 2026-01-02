"use server";

import { NextResponse } from "next/server";
import {
  Prisma,
  Language,
  MapIcon as PrismaMapIcon,
  File,
  RouteDirection,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  CoordinateTuple,
  MapDataPayload,
  MapIconData,
  MapLane,
  MapLaneSummary,
  MapRoute,
  MapRouteSummary,
  MapStop,
  MapTransportService,
  MapZone,
} from "@/types/map";

type ServiceWithName = Prisma.TransportServiceGetPayload<{
  include: {
    name: true;
    icon: {
      include: { file: true };
    };
  };
}>;

type MapIconWithFile = PrismaMapIcon & {
  file: File;
};

type BusLaneRecord = Prisma.BusLaneGetPayload<{
  include: {
    name: true;
    description: true;

    service: {
      include: {
        name: true;
        icon: {
          include: { file: true };
        };
      };
    };
  };
}>;

type BusRouteRecord = Prisma.BusRouteGetPayload<{
  include: {
    name: true;
    description: true;
    service: {
      include: {
        name: true;
        icon: {
          include: { file: true };
        };
      };
    };
    lanes: {
      include: {
        name: true;
        description: true;
      };
    };
    stops: {
      include: {
        name: true;
      };
    };
  };
}>;

type BusStopRecord = Prisma.BusStopGetPayload<{
  include: {
    name: true;
    description: true;
    images: true;
    icon: {
      include: { file: true };
    };
    zone: {
      include: { name: true };
    };
    lanes: {
      include: {
        name: true;
        description: true;
        service: {
          include: {
            name: true;
            icon: {
              include: { file: true };
            };
          };
        };
      };
    };
    routes: {
      include: {
        name: true;
        service: {
          include: {
            name: true;
            icon: {
              include: { file: true };
            };
          };
        };
      };
    };
  };
}>;

type ZoneRecord = Prisma.ZoneGetPayload<{
  include: {
    name: true;
  };
}>;

const toLanguageContent = (language?: Language | null) =>
  language
    ? {
        en: language.en ?? null,
        ar: language.ar ?? null,
        ckb: language.ckb ?? null,
      }
    : undefined;

const toMapIconData = (
  icon?: MapIconWithFile | null
): MapIconData | undefined => {
  if (!icon?.file) return undefined;

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

const mapTransportService = (
  service?: ServiceWithName | null
): MapTransportService | undefined => {
  if (!service) return undefined;

  return {
    id: service.id,
    type: service.type,
    color: service.color,
    name: toLanguageContent(service.name),
    isActive: service.isActive,
    icon: toMapIconData(service.icon as MapIconWithFile | null),
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

const mapLaneSummary = (lane: BusLaneRecord): MapLaneSummary => ({
  id: lane.id,
  name: toLanguageContent(lane.name),
  color: lane.color,
  serviceId: lane.serviceId ?? undefined,
  service: mapTransportService(lane.service),
});

type RouteSummarySource = {
  id: string;
  name: Language | null;
  serviceId: string | null;
  service: ServiceWithName | null;
  routeNumber: string | null;
  direction: RouteDirection;
};

const mapRouteSummary = (route: RouteSummarySource): MapRouteSummary => ({
  id: route.id,
  name: toLanguageContent(route.name),
  routeNumber: route.routeNumber ?? undefined,
  direction: route.direction,
  color: route.service?.color ?? undefined,
  serviceId: route.serviceId ?? undefined,
  service: mapTransportService(route.service),
});

const mapLane = (lane: BusLaneRecord): MapLane => ({
  ...mapLaneSummary(lane),
  path: parsePath(lane.path),
  weight: lane.weight ?? undefined,
  opacity: lane.opacity ?? undefined,
  isActive: lane.isActive ?? undefined,
});

const mapRoute = (route: BusRouteRecord): MapRoute => ({
  ...mapRouteSummary(route),
  laneIds: route.lanes?.map((lane) => lane.id) ?? [],
  stopIds: route.stops?.map((stop) => stop.id) ?? [],
  isActive: route.isActive ?? undefined,
});

const mapZone = (zone: ZoneRecord): MapZone => ({
  id: zone.id,
  name: toLanguageContent(zone.name),
  color: zone.color ?? undefined,
  isActive: zone.isActive ?? undefined,
});

const mapStop = (stop: BusStopRecord): MapStop => {
  const laneSummaries = stop.lanes?.map(mapLaneSummary) ?? [];
  const routeSummaries = stop.routes?.map(mapRouteSummary) ?? [];

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
    hasShelter: stop.hasShelter,
    hasBench: stop.hasBench,
    hasLighting: stop.hasLighting,
    isAccessible: stop.isAccessible,
    hasRealTimeInfo: stop.hasRealTimeInfo,
  };

  const stopIsActive = (stop as { isActive?: boolean }).isActive;

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
    icon: toMapIconData(stop.icon as MapIconWithFile | null),
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
    isActive: stopIsActive ?? true,
  };
};

export async function GET() {
  try {
    const [servicesRaw, stopsRaw, lanesRaw, routesRaw, zonesRaw] =
      await prisma.$transaction([
        prisma.transportService.findMany({
          where: {
            deletedAt: null,
            isActive: true,
          },
          include: {
            name: true,
            description: true,
            icon: {
              include: { file: true },
            },
          },
          orderBy: { createdAt: "asc" },
        }),
        prisma.busStop.findMany({
          where: {
            deletedAt: null,
          },
          include: {
            name: true,
            description: true,
            images: true,
            icon: {
              include: { file: true },
              where: {
                deletedAt: null,
                isActive: true,
              },
            },
            zone: {
              include: { name: true },
              where: {
                deletedAt: null,
                isActive: true,
              },
            },
            lanes: {
              include: {
                name: true,
                description: true,
                service: {
                  include: {
                    name: true,
                    icon: {
                      include: { file: true },
                    },
                  },
                  where: {
                    deletedAt: null,
                    isActive: true,
                  },
                },
              },
            },
            routes: {
              include: {
                name: true,
                service: {
                  include: {
                    name: true,
                    icon: {
                      include: { file: true },
                    },
                  },
                  where: {
                    deletedAt: null,
                    isActive: true,
                  },
                },
              },
              where: {
                deletedAt: null,
                isActive: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        }),
        prisma.busLane.findMany({
          where: {
            deletedAt: null,
            isActive: true,
          },
          include: {
            name: true,
            description: true,
            service: {
              include: {
                name: true,
                icon: {
                  include: { file: true },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        }),
        prisma.busRoute.findMany({
          where: {
            deletedAt: null,
            isActive: true,
          },
          include: {
            name: true,
            description: true,
            service: {
              include: {
                name: true,
                icon: {
                  include: { file: true },
                },
              },
            },
            lanes: {
              include: {
                name: true,
                description: true,
              },
            },
            stops: {
              include: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        }),
        prisma.zone.findMany({
          where: {
            deletedAt: null,
            isActive: true,
          },
          include: {
            name: true,
          },
          orderBy: { createdAt: "asc" },
        }),
      ]);

    const services = servicesRaw
      .map((service) => mapTransportService(service))
      .filter(Boolean) as MapTransportService[];

    const payload: MapDataPayload = {
      services,
      stops: stopsRaw.map(mapStop),
      lanes: lanesRaw.map(mapLane),
      routes: routesRaw.map(mapRoute),
      zones: zonesRaw.map(mapZone),
    };

    return NextResponse.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    console.error("Map data fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load map data",
      },
      { status: 500 }
    );
  }
}
