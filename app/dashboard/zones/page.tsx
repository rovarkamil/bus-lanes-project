"use client";

import { useMemo, useState } from "react";
import { Permission } from "@prisma/client";
import {
  ZoneWithRelations,
  zoneSchema,
  ZoneFilterParams,
  CreateZoneData,
  UpdateZoneData,
  zoneFieldConfigs,
} from "@/types/models/zone";
import {
  useFetchZones,
  useCreateZone,
  useUpdateZone,
  useDeleteZone,
} from "@/hooks/employee-hooks/use-zone";
import { CreateZoneDialog } from "@/components/dialogs/zone/create-zone-dialog";
import { UpdateZoneDialog } from "@/components/dialogs/zone/update-zone-dialog";
import { ViewZoneDialog } from "@/components/dialogs/zone/view-zone-dialog";
import { ZoneFilterDialog } from "@/components/dialogs/zone/filter-zone-dialog";
import { zoneColumns } from "@/components/columns/zone-table-columns";
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
import { cn, hasPermission } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/i18n/client";
import { useModelOperations } from "@/hooks/use-model-operations";
import { ensureIndexColumn } from "@/types/data-table";

const ZonesPage = () => {
  const { t, i18n } = useTranslation("Zones");
  const isRTL = i18n.language !== "en";
  const { data: session } = useSession();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ZoneWithRelations | null>(
    null
  );

  const {
    items: zones,
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
    handleDelete,
    refetch,
  } = useModelOperations<
    typeof zoneSchema,
    // @ts-expect-error - include relations for table rendering
    ZoneWithRelations,
    CreateZoneData,
    UpdateZoneData,
    ZoneFilterParams
  >({
    options: {
      modelName: "Zones",
      schema: zoneSchema,
      apiPath: "/api/employee/zone",
      queryKey: ["employee-zones"],
      fieldConfigs: zoneFieldConfigs,
    },
    initialSearchParams: {},
    useFetch: (params) =>
      useFetchZones(params as ZoneFilterParams & Record<string, unknown>),
    useCreate: useCreateZone,
    useUpdate: useUpdateZone,
    useDelete: useDeleteZone,
  });

  const columns = useMemo(() => {
    return ensureIndexColumn(zoneColumns(t));
  }, [t]);

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    refetch();
  };

  const handleUpdateSuccess = () => {
    setIsUpdateDialogOpen(false);
    setSelectedZone(null);
    refetch();
  };

  const handleCloseUpdateDialog = (open: boolean) => {
    setIsUpdateDialogOpen(open);
    if (!open) {
      setSelectedZone(null);
    }
  };

  const handleCloseViewDialog = (open: boolean) => {
    setIsViewDialogOpen(open);
    if (!open) {
      setSelectedZone(null);
    }
  };

  return (
    <main className="space-y-4">
      <PageHeader
        title={t("ZonesTitle")}
        description={t("ManageZones")}
        primaryAction={{
          label: t("CreateZone"),
          onClick: () => setIsCreateDialogOpen(true),
          disabled: !hasPermission(session, Permission.CREATE_ZONE),
        }}
        translationNamespace="ZonesTitle"
      />

      <TableFilters
        totalItems={totalItems}
        limit={limit}
        onLimitChange={handleLimitChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        filterDialog={
          <ZoneFilterDialog
            currentInputs={filters as ZoneFilterParams}
            onSearch={applyFilters}
            onInputChange={handleFilterChange}
            isOpen={isFilterDialogOpen}
            onOpenChange={setIsFilterDialogOpen}
          />
        }
        t={t}
        isRtl={isRTL}
      />

      <div className="bg-background rounded-xl">
        {isLoading || !zones || zones.length === 0 ? (
          <TableDataState
            isLoading={isLoading}
            loadingMessage={t("LoadingZones")}
            noDataMessage={t("NoZonesFound")}
          />
        ) : (
          <div className="rounded-xl overflow-hidden border border-border/10">
            <ScrollArea>
              <div className="min-w-[700px]">
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
                              label={column.label}
                              sortBy={sortBy}
                              sortOrder={sortOrder}
                              onSort={handleSort}
                            />
                          ) : (
                            column.label
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zones.map((zone, index) => (
                      <TableRow
                        key={zone.id}
                        className="group hover:bg-muted/30 transition-all duration-200"
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
                              column.render(zone, {
                                index,
                                t,
                                session,
                                isDeleting,
                                handlers: {
                                  setSelectedItem: (item) =>
                                    setSelectedZone(item),
                                  setIsViewDialogOpen: (isOpen: boolean) => {
                                    if (isOpen) setIsViewDialogOpen(true);
                                  },
                                  handleOpenUpdateDialog: (item) => {
                                    if (
                                      hasPermission(
                                        session,
                                        Permission.UPDATE_ZONE
                                      )
                                    ) {
                                      setSelectedZone(item);
                                      setIsUpdateDialogOpen(true);
                                    }
                                  },
                                  handleDelete,
                                  isRtl: isRTL,
                                },
                              })
                            ) : (
                              <span>
                                {String(
                                  zone[column.key as keyof ZoneWithRelations] ??
                                    ""
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

      <CreateZoneDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedZone && (
        <>
          <UpdateZoneDialog
            data={selectedZone}
            isOpen={isUpdateDialogOpen}
            onOpenChange={handleCloseUpdateDialog}
            onSuccess={handleUpdateSuccess}
          />
          <ViewZoneDialog
            data={selectedZone}
            isOpen={isViewDialogOpen}
            onOpenChange={handleCloseViewDialog}
          />
        </>
      )}
    </main>
  );
};

export default ZonesPage;
