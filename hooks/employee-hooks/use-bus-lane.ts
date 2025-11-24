"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  BusLaneFilterParams,
  BusLaneWithRelations,
  busLaneFieldConfigs,
  CreateBusLaneData,
  UpdateBusLaneData,
  DeleteBusLaneData,
  CreateBusLanesMapEditorData,
  UpdateBusLanesMapEditorData,
} from "@/types/models/bus-lane";
import { createQueryHook, createMutationHook } from "@/utils/createHook";
import { ApiResponse, PaginatedResponse } from "@/types/models/common";

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

const baseCreateBusLanesMapEditor = createMutationHook<
  ApiResponse<BusLaneWithRelations[]>,
  CreateBusLanesMapEditorData
>({
  method: "POST",
  url: "/api/employee/bus-lane/map-editor",
});

export const useCreateBusLanesMapEditor = () => {
  const queryClient = useQueryClient();
  const baseHook = baseCreateBusLanesMapEditor();

  return {
    ...baseHook,
    mutateAsync: async (variables: CreateBusLanesMapEditorData) => {
      const result = await baseHook.mutateAsync(variables);
      // Invalidate map data and bus lanes queries
      await queryClient.invalidateQueries({ queryKey: ["employee-map-data"] });
      await queryClient.invalidateQueries({ queryKey: ["employee-bus-lanes"] });
      return result;
    },
    mutate: (
      variables: CreateBusLanesMapEditorData,
      options?: Parameters<typeof baseHook.mutate>[1]
    ) => {
      baseHook.mutate(variables, {
        ...options,
        onSuccess: async (data, variables, context) => {
          await queryClient.invalidateQueries({
            queryKey: ["employee-map-data"],
          });
          await queryClient.invalidateQueries({
            queryKey: ["employee-bus-lanes"],
          });
          options?.onSuccess?.(data, variables, context);
        },
      });
    },
  };
};

const baseUpdateBusLanesMapEditor = createMutationHook<
  ApiResponse<BusLaneWithRelations[]>,
  UpdateBusLanesMapEditorData
>({
  method: "PUT",
  url: "/api/employee/bus-lane/map-editor",
});

export const useUpdateBusLanesMapEditor = () => {
  const queryClient = useQueryClient();
  const baseHook = baseUpdateBusLanesMapEditor();

  return {
    ...baseHook,
    mutateAsync: async (variables: UpdateBusLanesMapEditorData) => {
      const result = await baseHook.mutateAsync(variables);
      await queryClient.invalidateQueries({ queryKey: ["employee-map-data"] });
      await queryClient.invalidateQueries({ queryKey: ["employee-bus-lanes"] });
      return result;
    },
    mutate: (
      variables: UpdateBusLanesMapEditorData,
      options?: Parameters<typeof baseHook.mutate>[1]
    ) => {
      baseHook.mutate(variables, {
        ...options,
        onSuccess: async (data, variables, context) => {
          await queryClient.invalidateQueries({
            queryKey: ["employee-map-data"],
          });
          await queryClient.invalidateQueries({
            queryKey: ["employee-bus-lanes"],
          });
          options?.onSuccess?.(data, variables, context);
        },
      });
    },
  };
};

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
