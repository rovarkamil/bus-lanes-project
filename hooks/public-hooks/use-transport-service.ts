"use client";

import {
  TransportServiceFilterParams,
  TransportServiceWithRelations,
  transportServiceFieldConfigs,
} from "@/types/models/transport-service";
import { createQueryHook } from "@/utils/createHook";
import { PaginatedResponse } from "@/types/models/common";

type FetchTransportServicesParams = Record<string, unknown> & {
  page?: number;
  limit?: number;
  search?: string;
} & TransportServiceFilterParams;

export const useFetchTransportServices = createQueryHook<
  PaginatedResponse<TransportServiceWithRelations>,
  FetchTransportServicesParams
>({
  queryKey: ["client-transport-services"],
  url: "/api/client/transport-service",
  options: {
    fieldConfigs: transportServiceFieldConfigs,
  },
});
