"use client";

import {
  ZoneFilterParams,
  ZoneWithRelations,
  zoneFieldConfigs,
  CreateZoneData,
  UpdateZoneData,
  DeleteZoneData,
} from "@/types/models/zone";
import { createQueryHook, createMutationHook } from "@/utils/createHook";
import {
  ApiResponse,
  PaginatedResponse,
} from "@/types/models/common";

type FetchZonesParams = Record<string, unknown> & {
  page?: number;
  limit?: number;
  search?: string;
} & ZoneFilterParams;

export const useFetchZones = createQueryHook<
  PaginatedResponse<ZoneWithRelations>,
  FetchZonesParams
>({
  queryKey: ["employee-zones"],
  url: "/api/employee/zone",
  options: {
    fieldConfigs: zoneFieldConfigs,
  },
});

export const useCreateZone = createMutationHook<
  ApiResponse<ZoneWithRelations>,
  CreateZoneData
>({
  method: "POST",
  url: "/api/employee/zone",
});

export const useUpdateZone = createMutationHook<
  ApiResponse<ZoneWithRelations>,
  UpdateZoneData
>({
  method: "PUT",
  url: "/api/employee/zone",
});

export const useDeleteZone = createMutationHook<
  ApiResponse<ZoneWithRelations>,
  DeleteZoneData
>({
  method: "DELETE",
  url: "/api/employee/zone",
});


