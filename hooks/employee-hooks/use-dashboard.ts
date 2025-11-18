import { createQueryHook } from "@/utils/createHook";
import { ApiResponse } from "@/types/models/common";
import { DashboardData } from "@/types/dashboard";

export interface FetchDashboardParams extends Record<string, unknown> {
  startDate?: string;
  endDate?: string;
}

export const useFetchDashboard = createQueryHook<
  ApiResponse<DashboardData>,
  FetchDashboardParams
>({
  queryKey: ["employee-dashboard"],
  url: "/api/employee/dashboard",
});
