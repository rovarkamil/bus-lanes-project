"use client";

import { useMemo, useState } from "react";
import { Permission } from "@prisma/client";
import {
  BusRouteWithRelations,
  busRouteSchema,
  BusRouteFilterParams,
  CreateBusRouteData,
  UpdateBusRouteData,
  busRouteFieldConfigs,
} from "@/types/models/bus-route";
import {
  useFetchBusRoutes,
  useCreateBusRoute,
  useUpdateBusRoute,
  useDeleteBusRoute,
} from "@/hooks/employee-hooks/use-bus-route";
import { CreateBusRouteDialog } from "@/components/dialogs/bus-route/create-bus-route-dialog";
import { UpdateBusRouteDialog } from "@/components/dialogs/bus-route/update-bus-route-dialog";
import { ViewBusRouteDialog } from "@/components/dialogs/bus-route/view-bus-route-dialog";
import { BusRouteFilterDialog } from "@/components/dialogs/bus-route/filter-bus-route-dialog";
import { busRouteColumns } from "@/components/columns/bus-route-table-columns";
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

const BusRoutesPage = () => {
  const { t, i18n } = useTranslation("BusRoutes");
  const isRTL = i18n.language !== "en";
  const { data: session } = useSession();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] =
    useState<BusRouteWithRelations | null>(null);

  const {
    items: routes,
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
    typeof busRouteSchema,
    // @ts-expect-error - Table requires full relation payload
    BusRouteWithRelations,
    CreateBusRouteData,
    UpdateBusRouteData,
    BusRouteFilterParams
  >({
    options: {
      modelName: "BusRoutes",
      schema: busRouteSchema,
      apiPath: "/api/employee/bus-route",
      queryKey: ["employee-bus-routes"],
      fieldConfigs: busRouteFieldConfigs,
    },
    initialSearchParams: {},
    useFetch: (params) =>
      useFetchBusRoutes(
        params as BusRouteFilterParams & Record<string, unknown>
      ),
    useCreate: useCreateBusRoute,
    useUpdate: useUpdateBusRoute,
    useDelete: useDeleteBusRoute,
  });

  const columns = useMemo(() => {
    const actionColumn: Column<BusRouteWithRelations> = {
      key: "actions",
      label: "Actions",
      sortable: false,
      className: "w-[120px]",
      render: (route) => {
        const canView = hasPermission(session, Permission.VIEW_BUS_ROUTES);
        const canEdit = hasPermission(session, Permission.UPDATE_BUS_ROUTE);
        const canDelete = hasPermission(session, Permission.DELETE_BUS_ROUTE);

        return (
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedRoute(route);
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
                      setSelectedRoute(route);
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
              onConfirm={() => handleDelete(route.id)}
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

    return ensureIndexColumn([...busRouteColumns, actionColumn]);
  }, [session, isDeleting, isRTL, handleDelete]);

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    refetch();
  };

  const handleUpdateSuccess = () => {
    setIsUpdateDialogOpen(false);
    setSelectedRoute(null);
    refetch();
  };

  const handleCloseUpdateDialog = (open: boolean) => {
    setIsUpdateDialogOpen(open);
    if (!open) {
      setSelectedRoute(null);
    }
  };

  const handleCloseViewDialog = (open: boolean) => {
    setIsViewDialogOpen(open);
    if (!open) {
      setSelectedRoute(null);
    }
  };

  return (
    <main className="space-y-4">
      <PageHeader
        title={t("BusRoutesTitle")}
        description={t("ManageBusRoutes")}
        primaryAction={{
          label: t("CreateBusRoute"),
          onClick: () => setIsCreateDialogOpen(true),
          disabled: !hasPermission(session, Permission.CREATE_BUS_ROUTE),
        }}
        translationNamespace="BusRoutesTitle"
      />

      <TableFilters
        totalItems={totalItems}
        limit={limit}
        onLimitChange={handleLimitChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        filterDialog={
          <BusRouteFilterDialog
            currentInputs={filters as BusRouteFilterParams}
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
        {isLoading || !routes || routes.length === 0 ? (
          <TableDataState
            isLoading={isLoading}
            loadingMessage={t("LoadingBusRoutes")}
            noDataMessage={t("NoBusRoutesFound")}
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
                    {routes.map((route, index) => (
                      <TableRow
                        key={route.id}
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
                              column.render(route, {
                                index,
                                t,
                                session,
                                isDeleting,
                                handlers: {
                                  setSelectedItem: (item) =>
                                    setSelectedRoute(item),
                                  setIsViewDialogOpen: setIsViewDialogOpen,
                                  handleOpenUpdateDialog: (item) => {
                                    setSelectedRoute(item);
                                    setIsUpdateDialogOpen(true);
                                  },
                                  handleDelete,
                                  isRtl: isRTL,
                                },
                              })
                            ) : (
                              <span>
                                {String(
                                  route[
                                    column.key as keyof BusRouteWithRelations
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

      <CreateBusRouteDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedRoute && (
        <>
          <UpdateBusRouteDialog
            data={selectedRoute}
            isOpen={isUpdateDialogOpen}
            onOpenChange={handleCloseUpdateDialog}
            onSuccess={handleUpdateSuccess}
          />
          <ViewBusRouteDialog
            data={selectedRoute}
            isOpen={isViewDialogOpen}
            onOpenChange={handleCloseViewDialog}
          />
        </>
      )}
    </main>
  );
};

export default BusRoutesPage;
