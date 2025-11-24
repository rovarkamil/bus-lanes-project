"use client";

import {
  BusStopFilterParams,
  BusStopWithRelations,
  busStopFieldConfigs,
} from "@/types/models/bus-stop";
import { createQueryHook } from "@/utils/createHook";
import { PaginatedResponse } from "@/types/models/common";

type FetchBusStopsParams = Record<string, unknown> & {
  page?: number;
  limit?: number;
  search?: string;
} & BusStopFilterParams;

export const useFetchBusStops = createQueryHook<
  PaginatedResponse<BusStopWithRelations>,
  FetchBusStopsParams
>({
  queryKey: ["client-bus-stops"],
  url: "/api/client/bus-stop",
  options: {
    fieldConfigs: busStopFieldConfigs,
  },
});
