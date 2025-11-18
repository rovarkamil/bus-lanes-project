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
  ShoppingBag,
  Package,
  DollarSign,
  Activity,
  Truck,
  Users,
  FileBox,
  BarChart as BarChartIcon,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, Legend } from "recharts";
import { Currency } from "@prisma/client";
import { useFetchDashboard } from "@/hooks/employee-hooks/use-dashboard";
import { subMonths, format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
// import { Loader } from "@/components/loader";
import { useState } from "react";

export default function DashboardPage() {
  const { t, i18n } = useTranslation("Dashboard");
  const isRTL = i18n.language !== "en";
  const router = useRouter();
  const [timePeriod, setTimePeriod] = useState<"daily" | "monthly">("daily");

  // Calculate date range - last 3 months
  const endDate = new Date();
  const startDate = subMonths(endDate, 3);

  const { data: dashboardData, isLoading } = useFetchDashboard({
    startDate: format(startDate, "yyyy-MM-dd"),
    endDate: format(endDate, "yyyy-MM-dd"),
  });
  const data = dashboardData?.data;

  // Quick access routes based on available routes
  const quickAccessRoutes = [
    {
      title: t("Routes.Orders"),
      description: t("QuickAccess.OrdersDesc"),
      icon: <ShoppingBag className="h-6 w-6 text-primary" />,
      path: "/dashboard/orders",
      color: "bg-primary/10",
    },
    {
      title: t("Routes.Items"),
      description: t("QuickAccess.ItemsDesc"),
      icon: <Package className="h-6 w-6 text-primary" />,
      path: "/dashboard/items",
      color: "bg-primary/10",
    },
    {
      title: t("Routes.Suppliers"),
      description: t("QuickAccess.SuppliersDesc"),
      icon: <Truck className="h-6 w-6 text-primary" />,
      path: "/dashboard/suppliers",
      color: "bg-primary/10",
    },
    {
      title: t("Routes.SupplierOrders"),
      description: t("QuickAccess.SupplierOrdersDesc"),
      icon: <FileBox className="h-6 w-6 text-primary" />,
      path: "/dashboard/supplier-orders",
      color: "bg-primary/10",
    },
    {
      title: t("Routes.Reports"),
      description: t("QuickAccess.ReportsDesc"),
      icon: <BarChartIcon className="h-6 w-6 text-primary" />,
      path: "/dashboard/reports",
      color: "bg-primary/10",
    },
    {
      title: t("Routes.Users"),
      description: t("QuickAccess.UsersDesc"),
      icon: <Users className="h-6 w-6 text-primary" />,
      path: "/dashboard/users",
      color: "bg-primary/10",
    },
  ];

  // Stats cards data
  const statsCards = [
    {
      title: t("Stats.Revenue"),
      value:
        data?.revenue.total.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) || "0.00",
      description: t("Stats.RevenueDesc"),
      trend: data?.revenue.trend || "0%",
      icon: <DollarSign className="h-4 w-4 text-primary" />,
    },
    {
      title: t("Stats.Orders"),
      value: data?.orders.total.toLocaleString() || "0",
      description: t("Stats.OrdersDesc"),
      trend: data?.orders.trend || "0%",
      icon: <ShoppingBag className="h-4 w-4 text-primary" />,
    },
    {
      title: t("Stats.Items"),
      value: data?.items.total.toLocaleString() || "0",
      description: t("Stats.ItemsDesc"),
      trend: data?.items.trend || "N/A",
      icon: <Package className="h-4 w-4 text-primary" />,
    },
    {
      title: t("Stats.Suppliers"),
      value: data?.suppliers.total.toLocaleString() || "0",
      description: t("Stats.SuppliersDesc"),
      trend: data?.suppliers.trend || "N/A",
      icon: <Truck className="h-4 w-4 text-primary" />,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8" dir={isRTL ? "rtl" : "ltr"}>
        {/* <div className="flex items-center justify-center h-20">
          <Loader />
        </div> */}

        {/* Loading skeletons for stats cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading skeletons for charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-3 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* Welcome Section */}
      <section className="flex w-full justify-between">
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
      </section>

      {/* Quick Access Section */}
      <section className="space-y-6">
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
                    className="hover:bg-primary/10 text-primary"
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

      {/* Stats Section */}
      <section className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <h2 className="text-xl font-semibold tracking-tight text-primary">
          {t("Stats.Title")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.value} {stat.title === t("Stats.Revenue") ? "IQD" : ""}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                  <Activity className="h-3 w-3" />
                  {stat.trend}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Charts Section */}
      <section className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <h2 className="text-xl font-semibold tracking-tight text-primary">
          {t("Charts.Title")}
        </h2>

        {/* Mobile message */}
        <div
          className="flex items-center justify-center p-6 md:hidden"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <p className="text-center text-sm text-muted-foreground">
            {t("Charts.MobileMessage")}
          </p>
        </div>

        {/* Charts grid - hidden on mobile */}
        <div
          className="hidden md:grid gap-6 2xl:grid-cols-2"
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* Revenue Analysis */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("Charts.RevenueAnalysis")}</CardTitle>
                  <CardDescription>
                    {t("Charts.RevenueAnalysisDesc")}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={timePeriod === "daily" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimePeriod("daily")}
                  >
                    {t("Charts.Daily")}
                  </Button>
                  <Button
                    variant={timePeriod === "monthly" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimePeriod("monthly")}
                  >
                    {t("Charts.Monthly")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent dir={"ltr"}>
              <ChartContainer className="h-[300px]" config={{}} dir={"ltr"}>
                <LineChart
                  data={
                    data?.salesData?.[timePeriod as "daily" | "monthly"] || []
                  }
                >
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="revenue" orientation="left" />
                  <YAxis yAxisId="orders" orientation="right" />
                  <Legend />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name={t("Stats.Revenue")}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    yAxisId="revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    name={t("Stats.Orders")}
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    yAxisId="orders"
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Inventory Status Distribution */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader>
              <CardTitle>{t("Charts.InventoryStatus")}</CardTitle>
              <CardDescription>
                {t("Charts.InventoryStatusDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent dir={"ltr"}>
              <ChartContainer className="h-[300px]" config={{}}>
                <BarChart data={data?.inventoryStatus || []}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Top Selling Items */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader>
              <CardTitle>{t("Charts.TopSellingItems")}</CardTitle>
              <CardDescription>
                {t("Charts.TopSellingItemsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent dir={"ltr"}>
              <ChartContainer className="h-[300px]" config={{}}>
                <BarChart data={data?.topSellingItems || []} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="quantity" fill="hsl(var(--primary))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Top Revenue Items */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader>
              <CardTitle>{t("Charts.TopRevenueItems")}</CardTitle>
              <CardDescription>
                {t("Charts.TopRevenueItemsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent dir={"ltr"}>
              <ChartContainer className="h-[300px]" config={{}}>
                <BarChart data={data?.topRevenueItems || []} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader>
              <CardTitle>{t("Charts.RecentOrders")}</CardTitle>
              <CardDescription>{t("Charts.RecentOrdersDesc")}</CardDescription>
            </CardHeader>
            <CardContent dir={isRTL ? "rtl" : "ltr"}>
              <div className="space-y-4">
                {data?.recentOrders?.length ? (
                  data.recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Intl.NumberFormat(i18n.language, {
                              style: "currency",
                              currency:
                                order.currency === Currency.USD ? "USD" : "IQD",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(order.totalAmount)}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">
                    {t("Charts.NoRecentOrders")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader>
              <CardTitle>{t("Charts.CategoryDistribution")}</CardTitle>
              <CardDescription>
                {t("Charts.CategoryDistributionDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent dir={"ltr"}>
              <ChartContainer className="h-[300px]" config={{}}>
                <BarChart data={data?.categoryStats || []}>
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="items" orientation="left" />
                  <YAxis yAxisId="stock" orientation="right" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="itemCount"
                    name={t("Charts.ItemCount")}
                    fill="hsl(var(--primary))"
                    yAxisId="items"
                  />
                  <Bar
                    dataKey="stockCount"
                    name={t("Charts.StockCount")}
                    fill="hsl(var(--destructive))"
                    yAxisId="stock"
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Payment Type Distribution */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader>
              <CardTitle>{t("Charts.PaymentDistribution")}</CardTitle>
              <CardDescription>
                {t("Charts.PaymentDistributionDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent dir={"ltr"}>
              <ChartContainer className="h-[300px]" config={{}}>
                <BarChart data={data?.paymentStats || []}>
                  <XAxis dataKey="type" />
                  <YAxis yAxisId="count" orientation="left" />
                  <YAxis yAxisId="amount" orientation="right" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    name={t("Charts.OrderCount")}
                    fill="hsl(var(--primary))"
                    yAxisId="count"
                  />
                  <Bar
                    dataKey="amount"
                    name={t("Charts.TotalAmount")}
                    fill="hsl(var(--destructive))"
                    yAxisId="amount"
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Supplier Balances */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader>
              <CardTitle>{t("Charts.SupplierBalances")}</CardTitle>
              <CardDescription>
                {t("Charts.SupplierBalancesDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent dir={"ltr"}>
              <ChartContainer className="h-[300px]" config={{}}>
                <BarChart data={data?.supplierBalances || []} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="iqdBalance"
                    name="IQD Balance"
                    fill="hsl(var(--primary))"
                  />
                  <Bar
                    dataKey="usdBalance"
                    name="USD Balance"
                    fill="hsl(var(--destructive))"
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
