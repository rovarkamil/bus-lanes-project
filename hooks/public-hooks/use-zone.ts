"use client";

import {
  ZoneFilterParams,
  ZoneWithRelations,
  zoneFieldConfigs,
} from "@/types/models/zone";
import { createQueryHook } from "@/utils/createHook";
import { PaginatedResponse } from "@/types/models/common";

type FetchZonesParams = Record<string, unknown> & {
  page?: number;
  limit?: number;
  search?: string;
} & ZoneFilterParams;

export const useFetchZones = createQueryHook<
  PaginatedResponse<ZoneWithRelations>,
  FetchZonesParams
>({
  queryKey: ["client-zones"],
  url: "/api/client/zone",
  options: {
    fieldConfigs: zoneFieldConfigs,
  },
});
