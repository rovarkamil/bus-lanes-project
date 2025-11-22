"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  BusStopFilterParams,
  BusStopWithRelations,
  busStopFieldConfigs,
  CreateBusStopData,
  UpdateBusStopData,
  DeleteBusStopData,
  CreateBusStopsMapEditorData,
  UpdateBusStopsMapEditorData,
} from "@/types/models/bus-stop";
import { createQueryHook, createMutationHook } from "@/utils/createHook";
import { ApiResponse, PaginatedResponse } from "@/types/models/common";

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

const baseCreateBusStop = createMutationHook<
  ApiResponse<BusStopWithRelations>,
  CreateBusStopData
>({
  method: "POST",
  url: "/api/employee/bus-stop",
});

const baseUpdateBusStop = createMutationHook<
  ApiResponse<BusStopWithRelations>,
  UpdateBusStopData
>({
  method: "PUT",
  url: "/api/employee/bus-stop",
});

const baseDeleteBusStop = createMutationHook<
  ApiResponse<BusStopWithRelations>,
  DeleteBusStopData
>({
  method: "DELETE",
  url: "/api/employee/bus-stop",
});

export const useCreateBusStop = () => {
  const queryClient = useQueryClient();
  const baseHook = baseCreateBusStop();

  return {
    ...baseHook,
    mutateAsync: async (variables: CreateBusStopData) => {
      const result = await baseHook.mutateAsync(variables);
      // Invalidate map data and bus stops queries
      await queryClient.invalidateQueries({ queryKey: ["employee-map-data"] });
      await queryClient.invalidateQueries({ queryKey: ["employee-bus-stops"] });
      return result;
    },
    mutate: (
      variables: CreateBusStopData,
      options?: Parameters<typeof baseHook.mutate>[1]
    ) => {
      baseHook.mutate(variables, {
        ...options,
        onSuccess: async (data, variables, context) => {
          // Invalidate map data and bus stops queries
          await queryClient.invalidateQueries({
            queryKey: ["employee-map-data"],
          });
          await queryClient.invalidateQueries({
            queryKey: ["employee-bus-stops"],
          });
          options?.onSuccess?.(data, variables, context);
        },
      });
    },
  };
};

export const useUpdateBusStop = () => {
  const queryClient = useQueryClient();
  const baseHook = baseUpdateBusStop();

  return {
    ...baseHook,
    mutateAsync: async (variables: UpdateBusStopData) => {
      const result = await baseHook.mutateAsync(variables);
      // Invalidate map data and bus stops queries
      await queryClient.invalidateQueries({ queryKey: ["employee-map-data"] });
      await queryClient.invalidateQueries({ queryKey: ["employee-bus-stops"] });
      return result;
    },
    mutate: (
      variables: UpdateBusStopData,
      options?: Parameters<typeof baseHook.mutate>[1]
    ) => {
      baseHook.mutate(variables, {
        ...options,
        onSuccess: async (data, variables, context) => {
          // Invalidate map data and bus stops queries
          await queryClient.invalidateQueries({
            queryKey: ["employee-map-data"],
          });
          await queryClient.invalidateQueries({
            queryKey: ["employee-bus-stops"],
          });
          options?.onSuccess?.(data, variables, context);
        },
      });
    },
  };
};

export const useDeleteBusStop = () => {
  const queryClient = useQueryClient();
  const baseHook = baseDeleteBusStop();

  return {
    ...baseHook,
    mutateAsync: async (variables: DeleteBusStopData) => {
      const result = await baseHook.mutateAsync(variables);
      // Invalidate map data and bus stops queries
      await queryClient.invalidateQueries({ queryKey: ["employee-map-data"] });
      await queryClient.invalidateQueries({ queryKey: ["employee-bus-stops"] });
      return result;
    },
    mutate: (
      variables: DeleteBusStopData,
      options?: Parameters<typeof baseHook.mutate>[1]
    ) => {
      baseHook.mutate(variables, {
        ...options,
        onSuccess: async (data, variables, context) => {
          // Invalidate map data and bus stops queries
          await queryClient.invalidateQueries({
            queryKey: ["employee-map-data"],
          });
          await queryClient.invalidateQueries({
            queryKey: ["employee-bus-stops"],
          });
          options?.onSuccess?.(data, variables, context);
        },
      });
    },
  };
};

const baseCreateBusStopsMapEditor = createMutationHook<
  ApiResponse<BusStopWithRelations[]>,
  CreateBusStopsMapEditorData
>({
  method: "POST",
  url: "/api/employee/bus-stop/map-editor",
});

export const useCreateBusStopsMapEditor = () => {
  const queryClient = useQueryClient();
  const baseHook = baseCreateBusStopsMapEditor();

  return {
    ...baseHook,
    mutateAsync: async (variables: CreateBusStopsMapEditorData) => {
      const result = await baseHook.mutateAsync(variables);
      // Invalidate map data and bus stops queries
      await queryClient.invalidateQueries({ queryKey: ["employee-map-data"] });
      await queryClient.invalidateQueries({ queryKey: ["employee-bus-stops"] });
      return result;
    },
    mutate: (
      variables: CreateBusStopsMapEditorData,
      options?: Parameters<typeof baseHook.mutate>[1]
    ) => {
      baseHook.mutate(variables, {
        ...options,
        onSuccess: async (data, variables, context) => {
          await queryClient.invalidateQueries({
            queryKey: ["employee-map-data"],
          });
          await queryClient.invalidateQueries({
            queryKey: ["employee-bus-stops"],
          });
          options?.onSuccess?.(data, variables, context);
        },
      });
    },
  };
};

const baseUpdateBusStopsMapEditor = createMutationHook<
  ApiResponse<BusStopWithRelations[]>,
  UpdateBusStopsMapEditorData
>({
  method: "PUT",
  url: "/api/employee/bus-stop/map-editor",
});

export const useUpdateBusStopsMapEditor = () => {
  const queryClient = useQueryClient();
  const baseHook = baseUpdateBusStopsMapEditor();

  return {
    ...baseHook,
    mutateAsync: async (variables: UpdateBusStopsMapEditorData) => {
      const result = await baseHook.mutateAsync(variables);
      await queryClient.invalidateQueries({ queryKey: ["employee-map-data"] });
      await queryClient.invalidateQueries({ queryKey: ["employee-bus-stops"] });
      return result;
    },
    mutate: (
      variables: UpdateBusStopsMapEditorData,
      options?: Parameters<typeof baseHook.mutate>[1]
    ) => {
      baseHook.mutate(variables, {
        ...options,
        onSuccess: async (data, variables, context) => {
          await queryClient.invalidateQueries({
            queryKey: ["employee-map-data"],
          });
          await queryClient.invalidateQueries({
            queryKey: ["employee-bus-stops"],
          });
          options?.onSuccess?.(data, variables, context);
        },
      });
    },
  };
};
