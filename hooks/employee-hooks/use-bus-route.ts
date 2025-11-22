"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  BusRouteFilterParams,
  BusRouteWithRelations,
  busRouteFieldConfigs,
  CreateBusRouteData,
  UpdateBusRouteData,
  DeleteBusRouteData,
  CreateBusRoutesMapEditorData,
  UpdateBusRoutesMapEditorData,
} from "@/types/models/bus-route";
import { createQueryHook, createMutationHook } from "@/utils/createHook";
import { ApiResponse, PaginatedResponse } from "@/types/models/common";

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

const baseCreateBusRoutesMapEditor = createMutationHook<
  ApiResponse<BusRouteWithRelations[]>,
  CreateBusRoutesMapEditorData
>({
  method: "POST",
  url: "/api/employee/bus-route/map-editor",
});

export const useCreateBusRoutesMapEditor = () => {
  const queryClient = useQueryClient();
  const baseHook = baseCreateBusRoutesMapEditor();

  return {
    ...baseHook,
    mutateAsync: async (variables: CreateBusRoutesMapEditorData) => {
      const result = await baseHook.mutateAsync(variables);
      // Invalidate map data and bus routes queries
      await queryClient.invalidateQueries({ queryKey: ["employee-map-data"] });
      await queryClient.invalidateQueries({
        queryKey: ["employee-bus-routes"],
      });
      return result;
    },
    mutate: (
      variables: CreateBusRoutesMapEditorData,
      options?: Parameters<typeof baseHook.mutate>[1]
    ) => {
      baseHook.mutate(variables, {
        ...options,
        onSuccess: async (data, variables, context) => {
          await queryClient.invalidateQueries({
            queryKey: ["employee-map-data"],
          });
          await queryClient.invalidateQueries({
            queryKey: ["employee-bus-routes"],
          });
          options?.onSuccess?.(data, variables, context);
        },
      });
    },
  };
};

const baseUpdateBusRoutesMapEditor = createMutationHook<
  ApiResponse<BusRouteWithRelations[]>,
  UpdateBusRoutesMapEditorData
>({
  method: "PUT",
  url: "/api/employee/bus-route/map-editor",
});

export const useUpdateBusRoutesMapEditor = () => {
  const queryClient = useQueryClient();
  const baseHook = baseUpdateBusRoutesMapEditor();

  return {
    ...baseHook,
    mutateAsync: async (variables: UpdateBusRoutesMapEditorData) => {
      const result = await baseHook.mutateAsync(variables);
      await queryClient.invalidateQueries({ queryKey: ["employee-map-data"] });
      await queryClient.invalidateQueries({
        queryKey: ["employee-bus-routes"],
      });
      return result;
    },
    mutate: (
      variables: UpdateBusRoutesMapEditorData,
      options?: Parameters<typeof baseHook.mutate>[1]
    ) => {
      baseHook.mutate(variables, {
        ...options,
        onSuccess: async (data, variables, context) => {
          await queryClient.invalidateQueries({
            queryKey: ["employee-map-data"],
          });
          await queryClient.invalidateQueries({
            queryKey: ["employee-bus-routes"],
          });
          options?.onSuccess?.(data, variables, context);
        },
      });
    },
  };
};

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
