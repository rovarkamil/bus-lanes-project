"use client";

import {
  BusLaneFilterParams,
  BusLaneWithRelations,
  busLaneFieldConfigs,
} from "@/types/models/bus-lane";
import { createQueryHook } from "@/utils/createHook";
import { PaginatedResponse } from "@/types/models/common";

type FetchBusLanesParams = Record<string, unknown> & {
  page?: number;
  limit?: number;
  search?: string;
} & BusLaneFilterParams;

export const useFetchBusLanes = createQueryHook<
  PaginatedResponse<BusLaneWithRelations>,
  FetchBusLanesParams
>({
  queryKey: ["client-bus-lanes"],
  url: "/api/client/bus-lane",
  options: {
    fieldConfigs: busLaneFieldConfigs,
  },
});
