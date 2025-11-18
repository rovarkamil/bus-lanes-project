"use client";

import {
  TransportServiceFilterParams,
  TransportServiceWithRelations,
  transportServiceFieldConfigs,
  CreateTransportServiceData,
  UpdateTransportServiceData,
  DeleteTransportServiceData,
} from "@/types/models/transport-service";
import { createQueryHook, createMutationHook } from "@/utils/createHook";
import { ApiResponse, PaginatedResponse } from "@/types/models/common";

type FetchTransportServicesParams = Record<string, unknown> & {
  page?: number;
  limit?: number;
  search?: string;
} & TransportServiceFilterParams;

export const useFetchTransportServices = createQueryHook<
  PaginatedResponse<TransportServiceWithRelations>,
  FetchTransportServicesParams
>({
  queryKey: ["employee-transport-services"],
  url: "/api/employee/transport-service",
  options: {
    fieldConfigs: transportServiceFieldConfigs,
  },
});

export const useCreateTransportService = createMutationHook<
  ApiResponse<TransportServiceWithRelations>,
  CreateTransportServiceData
>({
  method: "POST",
  url: "/api/employee/transport-service",
});

export const useUpdateTransportService = createMutationHook<
  ApiResponse<TransportServiceWithRelations>,
  UpdateTransportServiceData
>({
  method: "PUT",
  url: "/api/employee/transport-service",
});

export const useDeleteTransportService = createMutationHook<
  ApiResponse<TransportServiceWithRelations>,
  DeleteTransportServiceData
>({
  method: "DELETE",
  url: "/api/employee/transport-service",
});
