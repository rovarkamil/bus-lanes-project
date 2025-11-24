/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { useTranslation } from "@/i18n/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Activity,
  BusFront,
  Layers,
  Map as MapIcon,
  MapPin,
  MapPinned,
  Route as RouteIcon,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import { useFetchDashboard } from "@/hooks/employee-hooks/use-dashboard";
import { subMonths, format, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { UserType } from "@prisma/client";

type DistributionDatum = {
  label: string;
  count: number;
  color?: string | null;
};

export default function DashboardPage() {
  const { t, i18n } = useTranslation("Dashboard");
  const isRTL = i18n.language !== "en";
  const router = useRouter();
  const { data: session, status } = useSession();

  const endDate = new Date();
  const startDate = subMonths(endDate, 3);

  const { data: dashboardResponse, isLoading } = useFetchDashboard({
    startDate: format(startDate, "yyyy-MM-dd"),
    endDate: format(endDate, "yyyy-MM-dd"),
  });
  const data = dashboardResponse?.data;

  const quickAccessRoutes = [
    {
      title: t("Routes.TransportServices"),
      description: t("QuickAccess.TransportServicesDesc"),
      icon: <BusFront className="h-6 w-6 text-primary" />,
      path: "/dashboard/transport-services",
      color: "bg-primary/10",
    },
    {
      title: t("Routes.BusRoutes"),
      description: t("QuickAccess.BusRoutesDesc"),
      icon: <RouteIcon className="h-6 w-6 text-primary" />,
      path: "/dashboard/bus-routes",
      color: "bg-primary/10",
    },
    {
      title: t("Routes.BusStops"),
      description: t("QuickAccess.BusStopsDesc"),
      icon: <MapPin className="h-6 w-6 text-primary" />,
      path: "/dashboard/bus-stops",
      color: "bg-primary/10",
    },
    {
      title: t("Routes.BusLanes"),
      description: t("QuickAccess.BusLanesDesc"),
      icon: <MapPinned className="h-6 w-6 text-primary" />,
      path: "/dashboard/bus-lanes",
      color: "bg-primary/10",
    },
    {
      title: t("Routes.MapIcons"),
      description: t("QuickAccess.MapIconsDesc"),
      icon: <MapIcon className="h-6 w-6 text-primary" />,
      path: "/dashboard/map-icons",
      color: "bg-primary/10",
    },
    {
      title: t("Routes.MapEditor"),
      description: t("QuickAccess.MapEditorDesc"),
      icon: <Layers className="h-6 w-6 text-primary" />,
      path: "/dashboard/map-editor",
      color: "bg-primary/10",
    },
  ];

  const statsCards = [
    {
      key: "transportServices",
      title: t("Stats.TransportServices"),
      description: t("Stats.TransportServicesDesc"),
      value: data?.totals.transportServices ?? 0,
      trend: data?.trends.transportServices ?? 0,
      icon: <BusFront className="h-4 w-4 text-primary" />,
    },
    {
      key: "busRoutes",
      title: t("Stats.BusRoutes"),
      description: t("Stats.BusRoutesDesc"),
      value: data?.totals.busRoutes ?? 0,
      trend: data?.trends.busRoutes ?? 0,
      icon: <RouteIcon className="h-4 w-4 text-primary" />,
    },
    {
      key: "busStops",
      title: t("Stats.BusStops"),
      description: t("Stats.BusStopsDesc"),
      value: data?.totals.busStops ?? 0,
      trend: data?.trends.busStops ?? 0,
      icon: <MapPin className="h-4 w-4 text-primary" />,
    },
    {
      key: "busLanes",
      title: t("Stats.BusLanes"),
      description: t("Stats.BusLanesDesc"),
      value: data?.totals.busLanes ?? 0,
      trend: data?.trends.busLanes ?? 0,
      icon: <MapPinned className="h-4 w-4 text-primary" />,
    },
  ];

  const serviceTypeChartData: DistributionDatum[] =
    data?.serviceTypeDistribution.map((item) => ({
      label: t(`ServiceTypes.${item.type}`),
      count: item.count,
    })) ?? [];

  const zoneStopChartData: DistributionDatum[] =
    data?.zoneStopDistribution.map((item) => ({
      label: item.zoneName ?? t("Transit.UnassignedZone"),
      count: item.count,
      color: item.color,
    })) ?? [];

  const laneServiceChartData: DistributionDatum[] =
    data?.laneServiceDistribution.map((item) => ({
      label: item.serviceType
        ? t(`ServiceTypes.${item.serviceType}`)
        : t("Transit.UnassignedService"),
      count: item.count,
      color: item.color,
    })) ?? [];

  const recentActivity = data?.recentActivity ?? [];

  useEffect(() => {
    if (
      status === "authenticated" &&
      session?.user?.userType === UserType.CLIENT
    ) {
      router.replace("/");
    }
  }, [router, session?.user?.userType, status]);

  if (
    status === "authenticated" &&
    session?.user?.userType === UserType.CLIENT
  ) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-8" dir={isRTL ? "rtl" : "ltr"}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((key) => (
            <Card key={key} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-2 h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((key) => (
            <Card key={key}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[220px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatNumber = (value: number) =>
    value.toLocaleString(i18n.language, {
      maximumFractionDigits: 0,
    });

  const formatTrend = (value?: number) => {
    if (value === undefined || Number.isNaN(value)) return "0%";
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const trendClass = (value?: number) => {
    if (!value) return "text-muted-foreground";
    return value >= 0 ? "text-emerald-600" : "text-rose-600";
  };

  return (
    <div className="space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          {t("Welcome.Title")}
        </h1>
        <p className="text-muted-foreground">{t("Welcome.Subtitle")}</p>
        <p className="text-sm text-muted-foreground">
          {t("Stats.DateRange")}: {format(startDate, "MMMM d, yyyy")} -{" "}
          {format(endDate, "MMMM d, yyyy")}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-primary">
          {t("QuickAccess.Title")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickAccessRoutes.map((item) => (
            <Card key={item.path} className="overflow-hidden">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg p-2 ${item.color}`}>
                    {item.icon}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:bg-primary/10"
                    onClick={() => router.push(item.path)}
                  >
                    {t("Common.Open")} {isRTL ? "←" : "→"}
                  </Button>
                </div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-primary">
          {t("Transit.Overview")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => (
            <Card key={stat.key}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stat.value)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <div
                  className={`mt-2 flex items-center gap-1 text-xs ${trendClass(
                    stat.trend
                  )}`}
                >
                  <Activity className="h-3 w-3" />
                  {formatTrend(stat.trend)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-primary">
          {t("Transit.Distributions")}
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <DistributionCard
            title={t("Transit.ServiceTypeDistribution")}
            description={t("Transit.ServiceTypeDistributionDesc")}
            data={serviceTypeChartData}
            noDataLabel={t("Transit.NoData")}
          />
          <DistributionCard
            title={t("Transit.ZoneStopDistribution")}
            description={t("Transit.ZoneStopDistributionDesc")}
            data={zoneStopChartData}
            noDataLabel={t("Transit.NoData")}
          />
          <DistributionCard
            title={t("Transit.LaneServiceDistribution")}
            description={t("Transit.LaneServiceDistributionDesc")}
            data={laneServiceChartData}
            noDataLabel={t("Transit.NoData")}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-primary">
          {t("Transit.RecentActivity")}
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>{t("Transit.RecentActivity")}</CardTitle>
            <CardDescription>{t("Transit.RecentActivityDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length ? (
              <div className="space-y-4">
                {recentActivity.map((item) => (
                  <div
                    key={`${item.entity}-${item.id}`}
                    className="flex flex-col gap-1 border-b pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-semibold uppercase tracking-wide">
                        {t(`Transit.Activity.${item.entity}`)}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.detail && (
                      <p className="text-xs text-muted-foreground">
                        {item.detail}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("Transit.NoActivity")}
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

const DistributionCard = ({
  title,
  description,
  data,
  noDataLabel,
}: {
  title: string;
  description: string;
  data: DistributionDatum[];
  noDataLabel: string;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      {data.length ? (
        <ChartContainer className="h-[260px]" config={{}}>
          <BarChart data={data}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              interval={0}
              height={60}
              angle={-10}
            />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count">
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color ?? "hsl(var(--primary))"}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      ) : (
        <p className="text-sm text-muted-foreground">{noDataLabel}</p>
      )}
    </CardContent>
  </Card>
);
