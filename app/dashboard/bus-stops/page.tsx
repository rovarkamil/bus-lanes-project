"use client";

import { useMemo, useState } from "react";
import { Permission } from "@prisma/client";
import {
  BusStopWithRelations,
  busStopSchema,
  BusStopFilterParams,
  CreateBusStopData,
  UpdateBusStopData,
  busStopFieldConfigs,
} from "@/types/models/bus-stop";
import {
  useFetchBusStops,
  useCreateBusStop,
  useUpdateBusStop,
  useDeleteBusStop,
} from "@/hooks/employee-hooks/use-bus-stop";
import { CreateBusStopDialog } from "@/components/dialogs/bus-stop/create-bus-stop-dialog";
import { UpdateBusStopDialog } from "@/components/dialogs/bus-stop/update-bus-stop-dialog";
import { ViewBusStopDialog } from "@/components/dialogs/bus-stop/view-bus-stop-dialog";
import { BusStopFilterDialog } from "@/components/dialogs/bus-stop/filter-bus-stop-dialog";
import { busStopColumns } from "@/components/columns/bus-stop-table-columns";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/data-table/confirmation-dialog";
import { cn, hasPermission } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/i18n/client";
import { useModelOperations } from "@/hooks/use-model-operations";
import { Column, ensureIndexColumn } from "@/types/data-table";
import { Eye, Pencil, Trash2 } from "lucide-react";

const BusStopsPage = () => {
  const { t, i18n } = useTranslation("BusStops");
  const isRTL = i18n.language !== "en";
  const { data: session } = useSession();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedStop, setSelectedStop] = useState<BusStopWithRelations | null>(
    null
  );

  const {
    items: stops,
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
    typeof busStopSchema,
    // @ts-expect-error - table view needs relations not contained in base schema
    BusStopWithRelations,
    CreateBusStopData,
    UpdateBusStopData,
    BusStopFilterParams
  >({
    options: {
      modelName: "BusStops",
      schema: busStopSchema,
      apiPath: "/api/employee/bus-stop",
      queryKey: ["employee-bus-stops"],
      fieldConfigs: busStopFieldConfigs,
    },
    initialSearchParams: {},
    useFetch: (params) =>
      useFetchBusStops(params as BusStopFilterParams & Record<string, unknown>),
    useCreate: useCreateBusStop,
    useUpdate: useUpdateBusStop,
    useDelete: useDeleteBusStop,
  });

  const columns = useMemo(() => {
    const actionColumn: Column<BusStopWithRelations> = {
      key: "actions",
      label: t("Table.Actions"),
      sortable: false,
      className: "w-[120px]",
      render: (stop) => {
        const canView = hasPermission(session, Permission.VIEW_BUS_STOPS);
        const canEdit = hasPermission(session, Permission.UPDATE_BUS_STOP);
        const canDelete = hasPermission(session, Permission.DELETE_BUS_STOP);

        return (
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedStop(stop);
                      setIsViewDialogOpen(true);
                    }}
                    disabled={!canView}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("Actions.View")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedStop(stop);
                      setIsUpdateDialogOpen(true);
                    }}
                    disabled={!canEdit}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("Actions.Edit")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <ConfirmationDialog
              title={t("Actions.DeleteConfirmTitle")}
              message={t("Actions.DeleteConfirmMessage")}
              onConfirm={() => handleDelete(stop.id)}
              confirmLabel={
                isDeleting ? t("Actions.Deleting") : t("Actions.Delete")
              }
              cancelLabel={t("Common.Cancel")}
              variant="destructive"
              disabled={!canDelete || isDeleting}
              isRtl={isRTL}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      disabled={!canDelete}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("Actions.Delete")}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </ConfirmationDialog>
          </div>
        );
      },
    };

    return ensureIndexColumn([...busStopColumns(t), actionColumn]);
  }, [session, isDeleting, isRTL, handleDelete, t]);

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    refetch();
  };

  const handleUpdateSuccess = () => {
    setIsUpdateDialogOpen(false);
    setSelectedStop(null);
    refetch();
  };

  const handleCloseUpdateDialog = (open: boolean) => {
    setIsUpdateDialogOpen(open);
    if (!open) {
      setSelectedStop(null);
    }
  };

  const handleCloseViewDialog = (open: boolean) => {
    setIsViewDialogOpen(open);
    if (!open) {
      setSelectedStop(null);
    }
  };

  return (
    <main className="space-y-4">
      <PageHeader
        title={t("BusStopsTitle")}
        description={t("ManageBusStops")}
        primaryAction={{
          label: t("CreateBusStop"),
          onClick: () => setIsCreateDialogOpen(true),
          disabled: !hasPermission(session, Permission.CREATE_BUS_STOP),
        }}
        translationNamespace="BusStopsTitle"
      />

      <TableFilters
        totalItems={totalItems}
        limit={limit}
        onLimitChange={handleLimitChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        filterDialog={
          <BusStopFilterDialog
            currentInputs={filters as BusStopFilterParams}
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
        {isLoading || !stops || stops.length === 0 ? (
          <TableDataState
            isLoading={isLoading}
            loadingMessage={t("LoadingBusStops")}
            noDataMessage={t("NoBusStopsFound")}
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
                    {stops.map((stop, index) => (
                      <TableRow
                        key={stop.id}
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
                              column.render(stop, {
                                index,
                                t,
                                session,
                                isDeleting,
                                handlers: {
                                  setSelectedItem: (
                                    item: BusStopWithRelations | null
                                  ) => setSelectedStop(item),
                                  setIsViewDialogOpen: setIsViewDialogOpen,
                                  handleOpenUpdateDialog: (
                                    item: BusStopWithRelations
                                  ) => {
                                    setSelectedStop(item);
                                    setIsUpdateDialogOpen(true);
                                  },
                                  handleDelete,
                                  isRtl: isRTL,
                                },
                              })
                            ) : (
                              <span>
                                {String(
                                  stop[
                                    column.key as keyof BusStopWithRelations
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

      <CreateBusStopDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedStop && (
        <>
          <UpdateBusStopDialog
            data={selectedStop}
            isOpen={isUpdateDialogOpen}
            onOpenChange={handleCloseUpdateDialog}
            onSuccess={handleUpdateSuccess}
          />
          <ViewBusStopDialog
            data={selectedStop}
            isOpen={isViewDialogOpen}
            onOpenChange={handleCloseViewDialog}
          />
        </>
      )}
    </main>
  );
};

export default BusStopsPage;
