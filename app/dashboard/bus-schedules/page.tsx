"use client";

import { useMemo, useState } from "react";
import { Permission } from "@prisma/client";
import {
  BusScheduleWithRelations,
  busScheduleSchema,
  BusScheduleFilterParams,
  CreateBusScheduleData,
  UpdateBusScheduleData,
  busScheduleFieldConfigs,
} from "@/types/models/bus-schedule";
import {
  useFetchBusSchedules,
  useCreateBusSchedule,
  useUpdateBusSchedule,
  useDeleteBusSchedule,
} from "@/hooks/employee-hooks/use-bus-schedule";
import { CreateBusScheduleDialog } from "@/components/dialogs/bus-schedule/create-bus-schedule-dialog";
import { UpdateBusScheduleDialog } from "@/components/dialogs/bus-schedule/update-bus-schedule-dialog";
import { ViewBusScheduleDialog } from "@/components/dialogs/bus-schedule/view-bus-schedule-dialog";
import { BusScheduleFilterDialog } from "@/components/dialogs/bus-schedule/filter-bus-schedule-dialog";
import { busScheduleColumns } from "@/components/columns/bus-schedule-table-columns";
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
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfirmationDialog } from "@/components/data-table/confirmation-dialog";
import { cn, hasPermission } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/i18n/client";
import { useModelOperations } from "@/hooks/use-model-operations";
import { Column, ensureIndexColumn } from "@/types/data-table";
import { Eye, Pencil, Trash2 } from "lucide-react";

const BusSchedulesPage = () => {
  const { t, i18n } = useTranslation("BusSchedules");
  const isRTL = i18n.language !== "en";
  const { data: session } = useSession();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] =
    useState<BusScheduleWithRelations | null>(null);

  const {
    items: schedules,
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
    typeof busScheduleSchema,
    // @ts-expect-error - include relations for table rendering
    BusScheduleWithRelations,
    CreateBusScheduleData,
    UpdateBusScheduleData,
    BusScheduleFilterParams
  >({
    options: {
      modelName: "BusSchedules",
      schema: busScheduleSchema,
      apiPath: "/api/employee/bus-schedule",
      queryKey: ["employee-bus-schedules"],
      fieldConfigs: busScheduleFieldConfigs,
    },
    initialSearchParams: {},
    useFetch: (params) =>
      useFetchBusSchedules(
        params as BusScheduleFilterParams & Record<string, unknown>
      ),
    useCreate: useCreateBusSchedule,
    useUpdate: useUpdateBusSchedule,
    useDelete: useDeleteBusSchedule,
  });

  const columns = useMemo(() => {
    const actionColumn: Column<BusScheduleWithRelations> = {
      key: "actions",
      label: "Actions",
      sortable: false,
      className: "w-[120px]",
      render: (schedule) => {
        const canView = hasPermission(session, Permission.VIEW_BUS_SCHEDULES);
        const canEdit = hasPermission(session, Permission.UPDATE_BUS_SCHEDULE);
        const canDelete = hasPermission(
          session,
          Permission.DELETE_BUS_SCHEDULE
        );

        return (
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedSchedule(schedule);
                      setIsViewDialogOpen(true);
                    }}
                    disabled={!canView}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedSchedule(schedule);
                      setIsUpdateDialogOpen(true);
                    }}
                    disabled={!canEdit}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <ConfirmationDialog
              title="Are you sure?"
              message="This action cannot be undone."
              onConfirm={() => handleDelete(schedule.id)}
              confirmLabel={isDeleting ? "Deleting..." : "Delete"}
              cancelLabel="Cancel"
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
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </ConfirmationDialog>
          </div>
        );
      },
    };

    return ensureIndexColumn([...busScheduleColumns, actionColumn]);
  }, [session, isDeleting, isRTL, handleDelete]);

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    refetch();
  };

  const handleUpdateSuccess = () => {
    setIsUpdateDialogOpen(false);
    setSelectedSchedule(null);
    refetch();
  };

  const handleCloseUpdateDialog = (open: boolean) => {
    setIsUpdateDialogOpen(open);
    if (!open) {
      setSelectedSchedule(null);
    }
  };

  const handleCloseViewDialog = (open: boolean) => {
    setIsViewDialogOpen(open);
    if (!open) {
      setSelectedSchedule(null);
    }
  };

  return (
    <main className="space-y-4">
      <PageHeader
        title={t("BusSchedulesTitle")}
        description={t("ManageBusSchedules")}
        primaryAction={{
          label: t("CreateBusSchedule"),
          onClick: () => setIsCreateDialogOpen(true),
          disabled: !hasPermission(session, Permission.CREATE_BUS_SCHEDULE),
        }}
        translationNamespace="BusSchedulesTitle"
      />

      <TableFilters
        totalItems={totalItems}
        limit={limit}
        onLimitChange={handleLimitChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        filterDialog={
          <BusScheduleFilterDialog
            currentInputs={filters as BusScheduleFilterParams}
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
        {isLoading || !schedules || schedules.length === 0 ? (
          <TableDataState
            isLoading={isLoading}
            loadingMessage={t("LoadingBusSchedules")}
            noDataMessage={t("NoBusSchedulesFound")}
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
                    {schedules.map((schedule, index) => (
                      <TableRow
                        key={schedule.id}
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
                              column.render(schedule, {
                                index,
                                t,
                                session,
                                isDeleting,
                                handlers: {
                                  setSelectedItem: (item) =>
                                    setSelectedSchedule(item),
                                  setIsViewDialogOpen: setIsViewDialogOpen,
                                  handleOpenUpdateDialog: (item) => {
                                    setSelectedSchedule(item);
                                    setIsUpdateDialogOpen(true);
                                  },
                                  handleDelete,
                                  isRtl: isRTL,
                                },
                              })
                            ) : (
                              <span>
                                {String(
                                  schedule[
                                    column.key as keyof BusScheduleWithRelations
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

      <CreateBusScheduleDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedSchedule && (
        <>
          <UpdateBusScheduleDialog
            data={selectedSchedule}
            isOpen={isUpdateDialogOpen}
            onOpenChange={handleCloseUpdateDialog}
            onSuccess={handleUpdateSuccess}
          />
          <ViewBusScheduleDialog
            data={selectedSchedule}
            isOpen={isViewDialogOpen}
            onOpenChange={handleCloseViewDialog}
          />
        </>
      )}
    </main>
  );
};

export default BusSchedulesPage;
