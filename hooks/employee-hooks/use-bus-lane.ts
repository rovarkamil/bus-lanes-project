"use client";

import {
  BusLaneFilterParams,
  BusLaneWithRelations,
  busLaneFieldConfigs,
  CreateBusLaneData,
  UpdateBusLaneData,
  DeleteBusLaneData,
} from "@/types/models/bus-lane";
import { createQueryHook, createMutationHook } from "@/utils/createHook";
import {
  ApiResponse,
  PaginatedResponse,
} from "@/types/models/common";

type FetchBusLanesParams = Record<string, unknown> & {
  page?: number;
  limit?: number;
  search?: string;
} & BusLaneFilterParams;

export const useFetchBusLanes = createQueryHook<
  PaginatedResponse<BusLaneWithRelations>,
  FetchBusLanesParams
>({
  queryKey: ["employee-bus-lanes"],
  url: "/api/employee/bus-lane",
  options: {
    fieldConfigs: busLaneFieldConfigs,
  },
});

export const useCreateBusLane = createMutationHook<
  ApiResponse<BusLaneWithRelations>,
  CreateBusLaneData
>({
  method: "POST",
  url: "/api/employee/bus-lane",
});

export const useUpdateBusLane = createMutationHook<
  ApiResponse<BusLaneWithRelations>,
  UpdateBusLaneData
>({
  method: "PUT",
  url: "/api/employee/bus-lane",
});

export const useDeleteBusLane = createMutationHook<
  ApiResponse<BusLaneWithRelations>,
  DeleteBusLaneData
>({
  method: "DELETE",
  url: "/api/employee/bus-lane",
});


