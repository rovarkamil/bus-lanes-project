"use client";

import {
  AuditLogWithRelations,
  auditLogSchema,
  AuditLogFilterParams,
} from "@/types/models/audit-log";
import { useFetchAuditLogs } from "@/hooks/employee-hooks/use-audit-logs";
import { ViewAuditLogDetailsDialog } from "@/components/dialogs/audit-log/view-audit-log-details-dialog";
import { AuditLogFilterDialog } from "@/components/dialogs/audit-log/filter-audit-log-dialog";
import { getAuditLogColumns } from "@/components/columns/audit-log-table-columns";
import { PageHeader } from "@/components/page-header";
import { TableFilters } from "@/components/data-table/table-filters";
import { TableDataState } from "@/components/data-table/table-data-state";
import { DataTableHeader } from "@/components/data-table/data-table-header";
import { Pagination } from "@/components/pagination";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/i18n/client";
import { useModelOperations } from "@/hooks/use-model-operations";
import { useState } from "react";
import { KeyboardEvent } from "react";

const AuditLogsPage = () => {
  const { t } = useTranslation("AuditLogs");
  const { data: session } = useSession();
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] =
    useState<AuditLogWithRelations | null>(null);

  const {
    items: auditLogs,
    totalItems,
    isLoading,
    isDeleting,
    currentPage,
    totalPages,
    limit,
    handlePageChange,
    handleLimitChange,
    sortBy,
    sortOrder,
    handleSort,
    filters,
    hasActiveFilters,
    handleClearFilters,
    handleFilterChange,
    applyFilters,
  } = useModelOperations<
    typeof auditLogSchema,
    AuditLogWithRelations,
    AuditLogWithRelations,
    AuditLogWithRelations,
    AuditLogFilterParams
  >({
    options: {
      modelName: "AuditLogs",
      schema: auditLogSchema,
      apiPath: "/api/employee/audit-log",
      queryKey: ["employee-audit-logs"],
    },
    initialSearchParams: {},
    useFetch: (params) => useFetchAuditLogs(params as AuditLogFilterParams),
    useCreate: () => ({ mutate: () => {}, isPending: false }), // No-op for read-only
    useUpdate: () => ({ mutate: () => {}, isPending: false }), // No-op for read-only
    useDelete: () => ({ mutate: () => {}, isPending: false }), // No-op for read-only
  });

  const columns = getAuditLogColumns(t);

  return (
    <main className="space-y-4">
      <PageHeader
        title={t("AuditLogs")}
        description={t("ViewSystemAuditLogs")}
        primaryAction={undefined} // No create action for audit logs
        translationNamespace="AuditLogs"
      />

      <TableFilters
        totalItems={totalItems}
        limit={limit}
        onLimitChange={handleLimitChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        isRtl={false}
        filterDialog={
          <AuditLogFilterDialog
            currentInputs={filters}
            onSearch={applyFilters}
            onInputChange={handleFilterChange}
            onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") applyFilters();
            }}
            isOpen={isFilterDialogOpen}
            onOpenChange={setIsFilterDialogOpen}
          />
        }
        t={t}
      />

      <div className="bg-background rounded-xl">
        {isLoading || !auditLogs || auditLogs.length === 0 ? (
          <TableDataState
            isLoading={isLoading}
            loadingMessage={t("LoadingAuditLogs")}
            noDataMessage={t("NoAuditLogsFound")}
          />
        ) : (
          <div className="rounded-xl overflow-hidden">
            <ScrollArea>
              <div className="min-w-[900px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      {columns.map((column) => (
                        <TableHead
                          key={column.key.toString()}
                          className={cn(
                            column.className,
                            column.showInMobile === false &&
                              "hidden md:table-cell"
                          )}
                        >
                          {column.sortable ? (
                            <DataTableHeader
                              column={column.key.toString()}
                              label={t(column.label)}
                              sortBy={sortBy}
                              sortOrder={sortOrder}
                              onSort={handleSort}
                            />
                          ) : (
                            t(column.label)
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((auditLog, index) => (
                      <TableRow
                        key={auditLog.id}
                        className="group hover:bg-muted/30 transition-all duration-200 cursor-default"
                      >
                        {columns.map((column) => (
                          <TableCell
                            key={column.key.toString()}
                            className={cn(
                              column.className,
                              column.showInMobile === false &&
                                "hidden md:table-cell"
                            )}
                          >
                            {column.render ? (
                              column.render(auditLog, {
                                index,
                                t,
                                session,
                                isDeleting,
                                handlers: {
                                  setSelectedItem: setSelectedAuditLog,
                                  setIsViewDialogOpen: (isOpen) => {
                                    if (isOpen) setIsViewDialogOpen(true);
                                  },
                                  handleOpenUpdateDialog: () => {}, // No-op for read-only
                                  handleDelete: () => {}, // No-op for read-only
                                  isRtl: false,
                                },
                              })
                            ) : (
                              <span>
                                {String(
                                  (auditLog as Record<string, unknown>)[
                                    column.key.toString()
                                  ] ?? ""
                                )}
                              </span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />

      {selectedAuditLog && (
        <ViewAuditLogDetailsDialog
          auditLog={selectedAuditLog}
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          onSuccess={() => setIsViewDialogOpen(false)}
        />
      )}
    </main>
  );
};

export default AuditLogsPage;
