"use client";

import {
  BusRouteFilterParams,
  BusRouteWithRelations,
  busRouteFieldConfigs,
  CreateBusRouteData,
  UpdateBusRouteData,
  DeleteBusRouteData,
} from "@/types/models/bus-route";
import { createQueryHook, createMutationHook } from "@/utils/createHook";
import {
  ApiResponse,
  PaginatedResponse,
} from "@/types/models/common";

type FetchBusRoutesParams = Record<string, unknown> & {
  page?: number;
  limit?: number;
  search?: string;
} & BusRouteFilterParams;

export const useFetchBusRoutes = createQueryHook<
  PaginatedResponse<BusRouteWithRelations>,
  FetchBusRoutesParams
>({
  queryKey: ["employee-bus-routes"],
  url: "/api/employee/bus-route",
  options: {
    fieldConfigs: busRouteFieldConfigs,
  },
});

export const useCreateBusRoute = createMutationHook<
  ApiResponse<BusRouteWithRelations>,
  CreateBusRouteData
>({
  method: "POST",
  url: "/api/employee/bus-route",
});

export const useUpdateBusRoute = createMutationHook<
  ApiResponse<BusRouteWithRelations>,
  UpdateBusRouteData
>({
  method: "PUT",
  url: "/api/employee/bus-route",
});

export const useDeleteBusRoute = createMutationHook<
  ApiResponse<BusRouteWithRelations>,
  DeleteBusRouteData
>({
  method: "DELETE",
  url: "/api/employee/bus-route",
});


