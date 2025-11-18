"use client";

import {
  BusStopFilterParams,
  BusStopWithRelations,
  busStopFieldConfigs,
  CreateBusStopData,
  UpdateBusStopData,
  DeleteBusStopData,
} from "@/types/models/bus-stop";
import { createQueryHook, createMutationHook } from "@/utils/createHook";
import {
  ApiResponse,
  PaginatedResponse,
} from "@/types/models/common";

type FetchBusStopsParams = Record<string, unknown> & {
  page?: number;
  limit?: number;
  search?: string;
} & BusStopFilterParams;

export const useFetchBusStops = createQueryHook<
  PaginatedResponse<BusStopWithRelations>,
  FetchBusStopsParams
>({
  queryKey: ["employee-bus-stops"],
  url: "/api/employee/bus-stop",
  options: {
    fieldConfigs: busStopFieldConfigs,
  },
});

export const useCreateBusStop = createMutationHook<
  ApiResponse<BusStopWithRelations>,
  CreateBusStopData
>({
  method: "POST",
  url: "/api/employee/bus-stop",
});

export const useUpdateBusStop = createMutationHook<
  ApiResponse<BusStopWithRelations>,
  UpdateBusStopData
>({
  method: "PUT",
  url: "/api/employee/bus-stop",
});

export const useDeleteBusStop = createMutationHook<
  ApiResponse<BusStopWithRelations>,
  DeleteBusStopData
>({
  method: "DELETE",
  url: "/api/employee/bus-stop",
});


