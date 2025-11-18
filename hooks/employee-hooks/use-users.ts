/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import {
  UserFilterParams,
  UserWithRelations,
  userFieldConfigs,
  CreateUserData,
  UpdateUserData,
  DeleteUserData,
} from "@/types/models/user";
import { createQueryHook, createMutationHook } from "@/utils/createHook";
import { ApiResponse, PaginatedResponse } from "@/types/models/common";

type FetchUsersParams = Record<string, unknown> & {
  page?: number;
  limit?: number;
  search?: string;
} & UserFilterParams;

type RefreshTokenData = {
  id: string;
};

type RefreshTokenResponse = {
  id: string;
  token: string | null;
};

export const useFetchUsers = createQueryHook<
  PaginatedResponse<UserWithRelations>,
  FetchUsersParams
>({
  queryKey: ["employee-users"],
  url: "/api/employee/user",
  options: {
    fieldConfigs: userFieldConfigs,
  },
});

export const useCreateUser = createMutationHook<
  ApiResponse<UserWithRelations>,
  CreateUserData
>({
  method: "POST",
  url: "/api/employee/user",
});

export const useUpdateUser = createMutationHook<
  ApiResponse<UserWithRelations>,
  UpdateUserData
>({
  method: "PUT",
  url: "/api/employee/user",
});

export const useDeleteUser = createMutationHook<
  ApiResponse<UserWithRelations>,
  DeleteUserData
>({
  method: "DELETE",
  url: "/api/employee/user",
});

export const useRefreshUserToken = createMutationHook<
  ApiResponse<RefreshTokenResponse>,
  RefreshTokenData
>({
  method: "POST",
  url: "/api/employee/user/refresh-token",
});
