"use client";

import {
  SettingFilterParams,
  SettingWithRelations,
  settingFieldConfigs,
  CreateSettingData,
  UpdateSettingData,
  DeleteSettingData,
} from "@/types/models/setting";
import { createQueryHook, createMutationHook } from "@/utils/createHook";
import { ApiResponse, PaginatedResponse } from "@/types/models/common";

type FetchSettingsParams = Record<string, unknown> & {
  page?: number;
  limit?: number;
  search?: string;
} & SettingFilterParams;

export const useFetchSettings = createQueryHook<
  PaginatedResponse<SettingWithRelations>,
  FetchSettingsParams
>({
  queryKey: ["employee-settings"],
  url: "/api/employee/setting",
  options: {
    fieldConfigs: settingFieldConfigs,
  },
});

export const useCreateSetting = createMutationHook<
  ApiResponse<SettingWithRelations>,
  CreateSettingData
>({
  method: "POST",
  url: "/api/employee/setting",
});

export const useUpdateSetting = createMutationHook<
  ApiResponse<SettingWithRelations>,
  UpdateSettingData
>({
  method: "PUT",
  url: "/api/employee/setting",
});

export const useDeleteSetting = createMutationHook<
  ApiResponse<SettingWithRelations>,
  DeleteSettingData
>({
  method: "DELETE",
  url: "/api/employee/setting",
});
