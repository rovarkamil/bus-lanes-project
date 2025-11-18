"use client";

import {
  MapIconFilterParams,
  MapIconWithRelations,
  mapIconFieldConfigs,
  CreateMapIconData,
  UpdateMapIconData,
  DeleteMapIconData,
} from "@/types/models/map-icon";
import { createQueryHook, createMutationHook } from "@/utils/createHook";
import {
  ApiResponse,
  PaginatedResponse,
} from "@/types/models/common";

type FetchMapIconsParams = Record<string, unknown> & {
  page?: number;
  limit?: number;
  search?: string;
} & MapIconFilterParams;

export const useFetchMapIcons = createQueryHook<
  PaginatedResponse<MapIconWithRelations>,
  FetchMapIconsParams
>({
  queryKey: ["employee-map-icons"],
  url: "/api/employee/map-icon",
  options: {
    fieldConfigs: mapIconFieldConfigs,
  },
});

export const useCreateMapIcon = createMutationHook<
  ApiResponse<MapIconWithRelations>,
  CreateMapIconData
>({
  method: "POST",
  url: "/api/employee/map-icon",
});

export const useUpdateMapIcon = createMutationHook<
  ApiResponse<MapIconWithRelations>,
  UpdateMapIconData
>({
  method: "PUT",
  url: "/api/employee/map-icon",
});

export const useDeleteMapIcon = createMutationHook<
  ApiResponse<MapIconWithRelations>,
  DeleteMapIconData
>({
  method: "DELETE",
  url: "/api/employee/map-icon",
});


