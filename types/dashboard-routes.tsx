/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import {
  Users,
  ShieldCheck,
  History,
  Home,
  BarChart2,
} from "lucide-react";
import { useTranslation } from "@/i18n/client";
import { Permission, UserType } from "@prisma/client";
import { useSession } from "next-auth/react";

export type DashboardRouteGroup = {
  label: string;
  routes: DashboardRoute[];
};

export type DashboardRoute = {
  path: string;
  label: string;
  icon: JSX.Element;
  disabled?: boolean;
  permission?: Permission;
  completed?: boolean;
  hiddenInSidebar?: boolean;
};

export type DashboardRoutesResult = {
  groups: DashboardRouteGroup[];
  getAllRoutes: () => DashboardRoute[];
};

export const useDashboardRoutes = (): DashboardRoutesResult => {
  const { t } = useTranslation("Dashboard");
  const { data: session } = useSession();

  const hasPermission = (permission?: Permission) => {
    if (!permission) return true;
    if (!session?.user) return false;
    if (session.user.userType === UserType.SUPER_ADMIN) return true;
    return session.user.role?.permissions.includes(permission);
  };

  const allRouteGroups: DashboardRouteGroup[] = [
    {
      label: t("Groups.Management"),
      routes: [
        {
          path: "/dashboard",
          label: t("Routes.Dashboard"),
          icon: <Home className="h-4 w-4" />,
          permission: Permission.VIEW_DASHBOARD,
        },
        {
          path: "/dashboard/users",
          label: t("Routes.Users"),
          icon: <Users className="h-4 w-4" />,
          permission: Permission.VIEW_USERS,
        },
        {
          path: "/dashboard/roles",
          label: t("Routes.Roles"),
          icon: <ShieldCheck className="h-4 w-4" />,
          permission: Permission.VIEW_ROLES,
        },
        {
          path: "/dashboard/reports",
          label: t("Routes.Reports"),
          icon: <BarChart2 className="h-4 w-4" />,
          permission: Permission.VIEW_REPORTS,
        },
        {
          path: "/dashboard/audit-logs",
          label: t("Routes.AuditLogs"),
          icon: <History className="h-4 w-4" />,
          permission: Permission.VIEW_AUDIT_LOGS,
        },
      ],
    },
  ];

  const filteredRouteGroups = allRouteGroups
    .map((group) => ({
      ...group,
      routes: group.routes.filter(
        (route) => hasPermission(route.permission) && !route.hiddenInSidebar
      ),
    }))
    .filter((group) => group.routes.length > 0);

  const getAllRoutes = () => allRouteGroups.flatMap((group) => group.routes);

  return {
    groups: filteredRouteGroups,
    getAllRoutes,
  };
};
