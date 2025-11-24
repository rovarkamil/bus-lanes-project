"use client";

import {
  BusScheduleFilterParams,
  BusScheduleWithRelations,
  busScheduleFieldConfigs,
} from "@/types/models/bus-schedule";
import { createQueryHook } from "@/utils/createHook";
import { PaginatedResponse } from "@/types/models/common";

type FetchBusSchedulesParams = Record<string, unknown> & {
  page?: number;
  limit?: number;
  search?: string;
} & BusScheduleFilterParams;

export const useFetchBusSchedules = createQueryHook<
  PaginatedResponse<BusScheduleWithRelations>,
  FetchBusSchedulesParams
>({
  queryKey: ["client-bus-schedules"],
  url: "/api/client/bus-schedule",
  options: {
    fieldConfigs: busScheduleFieldConfigs,
  },
});
