"use client";

import {
  BusScheduleFilterParams,
  BusScheduleWithRelations,
  busScheduleFieldConfigs,
  CreateBusScheduleData,
  UpdateBusScheduleData,
  DeleteBusScheduleData,
} from "@/types/models/bus-schedule";
import { createQueryHook, createMutationHook } from "@/utils/createHook";
import {
  ApiResponse,
  PaginatedResponse,
} from "@/types/models/common";

type FetchBusSchedulesParams = Record<string, unknown> & {
  page?: number;
  limit?: number;
  search?: string;
} & BusScheduleFilterParams;

export const useFetchBusSchedules = createQueryHook<
  PaginatedResponse<BusScheduleWithRelations>,
  FetchBusSchedulesParams
>({
  queryKey: ["employee-bus-schedules"],
  url: "/api/employee/bus-schedule",
  options: {
    fieldConfigs: busScheduleFieldConfigs,
  },
});

export const useCreateBusSchedule = createMutationHook<
  ApiResponse<BusScheduleWithRelations>,
  CreateBusScheduleData
>({
  method: "POST",
  url: "/api/employee/bus-schedule",
});

export const useUpdateBusSchedule = createMutationHook<
  ApiResponse<BusScheduleWithRelations>,
  UpdateBusScheduleData
>({
  method: "PUT",
  url: "/api/employee/bus-schedule",
});

export const useDeleteBusSchedule = createMutationHook<
  ApiResponse<BusScheduleWithRelations>,
  DeleteBusScheduleData
>({
  method: "DELETE",
  url: "/api/employee/bus-schedule",
});


