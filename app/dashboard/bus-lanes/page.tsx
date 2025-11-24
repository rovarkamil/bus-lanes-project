"use client";

import { useState, useMemo } from "react";
import { Permission } from "@prisma/client";
import {
  BusLaneWithRelations,
  busLaneSchema,
  BusLaneFilterParams,
  CreateBusLaneData,
  UpdateBusLaneData,
  busLaneFieldConfigs,
} from "@/types/models/bus-lane";
import {
  useFetchBusLanes,
  useCreateBusLane,
  useUpdateBusLane,
  useDeleteBusLane,
} from "@/hooks/employee-hooks/use-bus-lane";
import { CreateBusLaneDialog } from "@/components/dialogs/bus-lane/create-bus-lane-dialog";
import { UpdateBusLaneDialog } from "@/components/dialogs/bus-lane/update-bus-lane-dialog";
import { ViewBusLaneDialog } from "@/components/dialogs/bus-lane/view-bus-lane-dialog";
import { BusLaneFilterDialog } from "@/components/dialogs/bus-lane/filter-bus-lane-dialog";
import { busLaneColumns } from "@/components/columns/bus-lane-table-columns";
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

const BusLanesPage = () => {
  const { t, i18n } = useTranslation("BusLanes");
  const isRTL = i18n.language !== "en";
  const { data: session } = useSession();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedBusLane, setSelectedBusLane] =
    useState<BusLaneWithRelations | null>(null);

  const {
    items: busLanes,
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
    typeof busLaneSchema,
    // @ts-expect-error - Table rendering requires relation fields not present in the base schema
    BusLaneWithRelations,
    CreateBusLaneData,
    UpdateBusLaneData,
    BusLaneFilterParams
  >({
    options: {
      modelName: "BusLane",
      schema: busLaneSchema,
      apiPath: "/api/employee/bus-lane",
      queryKey: ["employee-bus-lanes"],
      fieldConfigs: busLaneFieldConfigs,
    },
    initialSearchParams: {},
    useFetch: (params) =>
      useFetchBusLanes(params as BusLaneFilterParams & Record<string, unknown>),
    useCreate: useCreateBusLane,
    useUpdate: useUpdateBusLane,
    useDelete: useDeleteBusLane,
  });

  const columns = useMemo(() => {
    return ensureIndexColumn(busLaneColumns(t));
  }, [t]);

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    refetch();
  };

  const handleUpdateSuccess = () => {
    setIsUpdateDialogOpen(false);
    setSelectedBusLane(null);
    refetch();
  };

  const handleCloseUpdateDialog = (open: boolean) => {
    setIsUpdateDialogOpen(open);
    if (!open) {
      setSelectedBusLane(null);
    }
  };

  const handleCloseViewDialog = (open: boolean) => {
    setIsViewDialogOpen(open);
    if (!open) {
      setSelectedBusLane(null);
    }
  };

  return (
    <main className="space-y-4">
      <PageHeader
        title={t("BusLanesTitle")}
        description={t("ManageBusLanes")}
        primaryAction={{
          label: t("CreateBusLane"),
          onClick: () => setIsCreateDialogOpen(true),
          disabled: !hasPermission(session, Permission.CREATE_BUS_LANE),
        }}
        translationNamespace="BusLanesTitle"
      />

      <TableFilters
        totalItems={totalItems}
        limit={limit}
        onLimitChange={handleLimitChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        filterDialog={
          <BusLaneFilterDialog
            currentInputs={filters as BusLaneFilterParams}
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
        {isLoading || !busLanes || busLanes.length === 0 ? (
          <TableDataState
            isLoading={isLoading}
            loadingMessage={t("LoadingBusLanes")}
            noDataMessage={t("NoBusLanesFound")}
          />
        ) : (
          <div className="rounded-xl overflow-hidden border border-border/10">
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
                    {busLanes.map((lane, index) => (
                      <TableRow
                        key={lane.id}
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
                              column.render(lane, {
                                index,
                                t,
                                session,
                                isDeleting,
                                handlers: {
                                  setSelectedItem: (item) =>
                                    setSelectedBusLane(item),
                                  setIsViewDialogOpen: (isOpen: boolean) => {
                                    if (isOpen) setIsViewDialogOpen(true);
                                  },
                                  handleOpenUpdateDialog: (item) => {
                                    if (
                                      hasPermission(
                                        session,
                                        Permission.UPDATE_BUS_LANE
                                      )
                                    ) {
                                      setSelectedBusLane(item);
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
                                  lane[
                                    column.key as keyof BusLaneWithRelations
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

      <CreateBusLaneDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedBusLane && (
        <>
          <UpdateBusLaneDialog
            data={selectedBusLane}
            isOpen={isUpdateDialogOpen}
            onOpenChange={handleCloseUpdateDialog}
            onSuccess={handleUpdateSuccess}
          />
          <ViewBusLaneDialog
            data={selectedBusLane}
            isOpen={isViewDialogOpen}
            onOpenChange={handleCloseViewDialog}
          />
        </>
      )}
    </main>
  );
};

export default BusLanesPage;
