/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import {
  AuditLogFilterParams,
  AuditLogWithRelations,
  auditLogFieldConfigs,
} from "@/types/models/audit-log";
import { createQueryHook } from "@/utils/createHook";
import { PaginatedResponse } from "@/types/models/common";

type FetchAuditLogsParams = Record<string, unknown> & {
  page?: number;
  limit?: number;
  search?: string;
} & AuditLogFilterParams;

export const useFetchAuditLogs = createQueryHook<
  PaginatedResponse<AuditLogWithRelations>,
  FetchAuditLogsParams
>({
  queryKey: ["employee-audit-logs"],
  url: "/api/employee/audit-log",
  options: {
    fieldConfigs: auditLogFieldConfigs,
  },
});
