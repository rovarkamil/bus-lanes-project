/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import {
  RoleFilterParams,
  RoleWithPermissions,
  roleFieldConfigs,
  CreateRoleData,
  UpdateRoleData,
  DeleteRoleData,
} from "@/types/models/role";
import { createQueryHook, createMutationHook } from "@/utils/createHook";
import { ApiResponse, PaginatedResponse } from "@/types/models/common";

type FetchRolesParams = Record<string, unknown> & {
  page?: number;
  limit?: number;
  search?: string;
} & RoleFilterParams;

export const useFetchRoles = createQueryHook<
  PaginatedResponse<RoleWithPermissions>,
  FetchRolesParams
>({
  queryKey: ["employee-roles"],
  url: "/api/employee/role",
  options: {
    fieldConfigs: roleFieldConfigs,
  },
});

export const useCreateRole = createMutationHook<
  ApiResponse<RoleWithPermissions>,
  CreateRoleData
>({
  method: "POST",
  url: "/api/employee/role",
});

export const useUpdateRole = createMutationHook<
  ApiResponse<RoleWithPermissions>,
  UpdateRoleData
>({
  method: "PUT",
  url: "/api/employee/role",
});

export const useDeleteRole = createMutationHook<
  ApiResponse<RoleWithPermissions>,
  DeleteRoleData
>({
  method: "DELETE",
  url: "/api/employee/role",
});
