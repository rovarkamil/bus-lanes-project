import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Permission, UserType } from "@prisma/client";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { createError } from "@/lib/custom-error-handler";

const DAYS_RANGE = 30;

const calculateTrend = (current: number, previous: number) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const hasPermission =
      session.user.userType === UserType.SUPER_ADMIN ||
      session.user.role?.permissions.includes(Permission.VIEW_DASHBOARD);

    if (!hasPermission) {
      throw createError(
        "Dashboard",
        "Dashboard",
        "NoPermissionToViewDashboard",
        403
      );
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - DAYS_RANGE);
    const sixtyDaysAgo = new Date(thirtyDaysAgo);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - DAYS_RANGE);

    const [
      transportServicesTotal,
      busRoutesTotal,
      busStopsTotal,
      busLanesTotal,
      transportServicesCurrent,
      transportServicesPrevious,
      busRoutesCurrent,
      busRoutesPrevious,
      busStopsCurrent,
      busStopsPrevious,
      busLanesCurrent,
      busLanesPrevious,
      serviceTypeGroups,
      zoneStopGroups,
      laneServiceGroups,
    ] = await Promise.all([
      prisma.transportService.count({ where: { deletedAt: null } }),
      prisma.busRoute.count({ where: { deletedAt: null } }),
      prisma.busStop.count({ where: { deletedAt: null } }),
      prisma.busLane.count({ where: { deletedAt: null } }),
      prisma.transportService.count({
        where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.transportService.count({
        where: {
          deletedAt: null,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
      prisma.busRoute.count({
        where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.busRoute.count({
        where: {
          deletedAt: null,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
      prisma.busStop.count({
        where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.busStop.count({
        where: {
          deletedAt: null,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
      prisma.busLane.count({
        where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.busLane.count({
        where: {
          deletedAt: null,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
      prisma.transportService.groupBy({
        by: ["type"],
        _count: { _all: true },
        where: { deletedAt: null },
      }),
      prisma.busStop.groupBy({
        by: ["zoneId"],
        _count: { _all: true },
        where: { deletedAt: null },
      }),
      prisma.busLane.groupBy({
        by: ["serviceId"],
        _count: { _all: true },
        where: { deletedAt: null },
      }),
    ]);

    const totals = {
      transportServices: transportServicesTotal,
      busRoutes: busRoutesTotal,
      busStops: busStopsTotal,
      busLanes: busLanesTotal,
    };

    const trends = {
      transportServices: calculateTrend(
        transportServicesCurrent,
        transportServicesPrevious
      ),
      busRoutes: calculateTrend(busRoutesCurrent, busRoutesPrevious),
      busStops: calculateTrend(busStopsCurrent, busStopsPrevious),
      busLanes: calculateTrend(busLanesCurrent, busLanesPrevious),
    };

    const serviceTypeDistribution = serviceTypeGroups.map((group) => ({
      type: group.type,
      count: group._count._all,
    }));

    const zoneIds = zoneStopGroups
      .map((group) => group.zoneId)
      .filter((id): id is string => Boolean(id));

    const zones = await prisma.zone.findMany({
      where: { id: { in: zoneIds } },
      include: { name: true },
    });
    const zoneMap = new Map(zones.map((zone) => [zone.id, zone]));

    const zoneStopDistribution = zoneStopGroups.map((group) => {
      const zoneRecord = group.zoneId ? zoneMap.get(group.zoneId) : null;
      return {
        zoneId: group.zoneId,
        zoneName: zoneRecord?.name?.en ?? null,
        color: zoneRecord?.color ?? null,
        count: group._count._all,
      };
    });

    const laneServiceIds = laneServiceGroups
      .map((group) => group.serviceId)
      .filter((id): id is string => Boolean(id));

    const laneServices = await prisma.transportService.findMany({
      where: { id: { in: laneServiceIds } },
      select: { id: true, type: true, color: true },
    });
    const laneServiceMap = new Map(
      laneServices.map((service) => [service.id, service])
    );

    const laneServiceDistribution = laneServiceGroups.map((group) => {
      const service = group.serviceId
        ? laneServiceMap.get(group.serviceId)
        : null;
      return {
        serviceId: group.serviceId,
        serviceType: service?.type ?? null,
        color: service?.color ?? null,
        count: group._count._all,
      };
    });

    const recentActivity = await getRecentActivity();

    return NextResponse.json({
      success: true,
      data: {
        totals,
        trends,
        serviceTypeDistribution,
        zoneStopDistribution,
        laneServiceDistribution,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

async function getRecentActivity() {
  const [services, routes, lanes, stops] = await Promise.all([
    prisma.transportService.findMany({
      where: { deletedAt: null },
      include: { name: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.busRoute.findMany({
      where: { deletedAt: null },
      include: { name: true, service: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.busLane.findMany({
      where: { deletedAt: null },
      include: { name: true, service: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.busStop.findMany({
      where: { deletedAt: null },
      include: { name: true, zone: { include: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const activity = [
    ...services.map((service) => ({
      id: service.id,
      entity: "transportService" as const,
      name: service.name?.en ?? service.type,
      detail: service.type,
      createdAt: service.createdAt.toISOString(),
    })),
    ...routes.map((route) => ({
      id: route.id,
      entity: "busRoute" as const,
      name: route.name?.en ?? route.routeNumber ?? route.id,
      detail: route.service?.type ?? undefined,
      createdAt: route.createdAt.toISOString(),
    })),
    ...lanes.map((lane) => ({
      id: lane.id,
      entity: "busLane" as const,
      name: lane.name?.en ?? lane.id,
      detail: lane.service?.type ?? undefined,
      createdAt: lane.createdAt.toISOString(),
    })),
    ...stops.map((stop) => ({
      id: stop.id,
      entity: "busStop" as const,
      name: stop.name?.en ?? stop.id,
      detail: stop.zone?.name?.en ?? undefined,
      createdAt: stop.createdAt.toISOString(),
    })),
  ];

  return activity
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 10);
}
