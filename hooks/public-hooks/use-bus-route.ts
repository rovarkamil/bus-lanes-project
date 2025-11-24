"use client";

import {
  BusRouteFilterParams,
  BusRouteWithRelations,
  busRouteFieldConfigs,
} from "@/types/models/bus-route";
import { createQueryHook } from "@/utils/createHook";
import { PaginatedResponse } from "@/types/models/common";

type FetchBusRoutesParams = Record<string, unknown> & {
  page?: number;
  limit?: number;
  search?: string;
} & BusRouteFilterParams;

export const useFetchBusRoutes = createQueryHook<
  PaginatedResponse<BusRouteWithRelations>,
  FetchBusRoutesParams
>({
  queryKey: ["client-bus-routes"],
  url: "/api/client/bus-route",
  options: {
    fieldConfigs: busRouteFieldConfigs,
  },
}); 
