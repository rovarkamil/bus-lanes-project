import { TransportServiceType } from "@prisma/client";

export interface DashboardTotals {
  transportServices: number;
  busRoutes: number;
  busStops: number;
  busLanes: number;
}

export interface DashboardTrends {
  transportServices: number;
  busRoutes: number;
  busStops: number;
  busLanes: number;
}

export interface ServiceTypeDistributionItem {
  type: TransportServiceType;
  count: number;
}

export interface ZoneStopDistributionItem {
  zoneId: string | null;
  zoneName: string | null;
  color?: string | null;
  count: number;
}

export interface LaneServiceDistributionItem {
  serviceId: string | null;
  serviceType: TransportServiceType | null;
  color?: string | null;
  count: number;
}

export type ActivityEntity =
  | "transportService"
  | "busRoute"
  | "busLane"
  | "busStop";

export interface RecentActivityItem {
  id: string;
  entity: ActivityEntity;
  name: string;
  createdAt: string;
  detail?: string;
}

export interface DashboardData {
  totals: DashboardTotals;
  trends: DashboardTrends;
  serviceTypeDistribution: ServiceTypeDistributionItem[];
  zoneStopDistribution: ZoneStopDistributionItem[];
  laneServiceDistribution: LaneServiceDistributionItem[];
  recentActivity: RecentActivityItem[];
}
