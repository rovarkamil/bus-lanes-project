"use client";

import { useMemo, useState } from "react";
import { Permission } from "@prisma/client";
import {
  TransportServiceWithRelations,
  transportServiceSchema,
  TransportServiceFilterParams,
  CreateTransportServiceData,
  UpdateTransportServiceData,
  transportServiceFieldConfigs,
} from "@/types/models/transport-service";
import {
  useFetchTransportServices,
  useCreateTransportService,
  useUpdateTransportService,
  useDeleteTransportService,
} from "@/hooks/employee-hooks/use-transport-service";
import { CreateTransportServiceDialog } from "@/components/dialogs/transport-service/create-transport-service-dialog";
import { UpdateTransportServiceDialog } from "@/components/dialogs/transport-service/update-transport-service-dialog";
import { ViewTransportServiceDialog } from "@/components/dialogs/transport-service/view-transport-service-dialog";
import { TransportServiceFilterDialog } from "@/components/dialogs/transport-service/filter-transport-service-dialog";
import { transportServiceColumns } from "@/components/columns/transport-service-table-columns";
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

const TransportServicesPage = () => {
  const { t, i18n } = useTranslation("TransportServices");
  const isRTL = i18n.language !== "en";
  const { data: session } = useSession();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedService, setSelectedService] =
    useState<TransportServiceWithRelations | null>(null);

  const {
    items: services,
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
    typeof transportServiceSchema,
    // @ts-expect-error - table needs relations
    TransportServiceWithRelations,
    CreateTransportServiceData,
    UpdateTransportServiceData,
    TransportServiceFilterParams
  >({
    options: {
      modelName: "TransportServices",
      schema: transportServiceSchema,
      apiPath: "/api/employee/transport-service",
      queryKey: ["employee-transport-services"],
      fieldConfigs: transportServiceFieldConfigs,
    },
    initialSearchParams: {},
    useFetch: (params) =>
      useFetchTransportServices(
        params as TransportServiceFilterParams & Record<string, unknown>
      ),
    useCreate: useCreateTransportService,
    useUpdate: useUpdateTransportService,
    useDelete: useDeleteTransportService,
  });

  const columns = useMemo(() => {
    const actionColumn: Column<TransportServiceWithRelations> = {
      key: "actions",
      label: t("Table.Actions"),
      sortable: false,
      className: "w-[120px]",
      render: (service) => {
        const canView = hasPermission(
          session,
          Permission.VIEW_TRANSPORT_SERVICES
        );
        const canEdit = hasPermission(
          session,
          Permission.UPDATE_TRANSPORT_SERVICE
        );
        const canDelete = hasPermission(
          session,
          Permission.DELETE_TRANSPORT_SERVICE
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
                      setSelectedService(service);
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
                      setSelectedService(service);
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
              onConfirm={() => handleDelete(service.id)}
              confirmLabel={
                isDeleting ? t("Actions.Deleting") : t("Actions.Delete")
              }
              cancelLabel={t("Cancel")}
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

    return ensureIndexColumn([...transportServiceColumns(t), actionColumn]);
  }, [session, isDeleting, isRTL, handleDelete, t]);

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    refetch();
  };

  const handleUpdateSuccess = () => {
    setIsUpdateDialogOpen(false);
    setSelectedService(null);
    refetch();
  };

  const handleCloseUpdateDialog = (open: boolean) => {
    setIsUpdateDialogOpen(open);
    if (!open) {
      setSelectedService(null);
    }
  };

  const handleCloseViewDialog = (open: boolean) => {
    setIsViewDialogOpen(open);
    if (!open) {
      setSelectedService(null);
    }
  };

  return (
    <main className="space-y-4">
      <PageHeader
        title={t("TransportServicesTitle")}
        description={t("ManageTransportServices")}
        primaryAction={{
          label: t("CreateTransportService"),
          onClick: () => setIsCreateDialogOpen(true),
          disabled: !hasPermission(
            session,
            Permission.CREATE_TRANSPORT_SERVICE
          ),
        }}
        translationNamespace="TransportServicesTitle"
      />

      <TableFilters
        totalItems={totalItems}
        limit={limit}
        onLimitChange={handleLimitChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        filterDialog={
          <TransportServiceFilterDialog
            currentInputs={filters as TransportServiceFilterParams}
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
        {isLoading || !services || services.length === 0 ? (
          <TableDataState
            isLoading={isLoading}
            loadingMessage={t("LoadingTransportServices")}
            noDataMessage={t("NoTransportServicesFound")}
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
                    {services.map((service, index) => (
                      <TableRow
                        key={service.id}
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
                              column.render(service, {
                                index,
                                t,
                                session,
                                isDeleting,
                                handlers: {
                                  setSelectedItem: (item) =>
                                    setSelectedService(item),
                                  setIsViewDialogOpen: setIsViewDialogOpen,
                                  handleOpenUpdateDialog: (item) => {
                                    setSelectedService(item);
                                    setIsUpdateDialogOpen(true);
                                  },
                                  handleDelete,
                                  isRtl: isRTL,
                                },
                              })
                            ) : (
                              <span>
                                {String(
                                  service[
                                    column.key as keyof TransportServiceWithRelations
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

      <CreateTransportServiceDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedService && (
        <>
          <UpdateTransportServiceDialog
            data={selectedService}
            isOpen={isUpdateDialogOpen}
            onOpenChange={handleCloseUpdateDialog}
            onSuccess={handleUpdateSuccess}
          />
          <ViewTransportServiceDialog
            data={selectedService}
            isOpen={isViewDialogOpen}
            onOpenChange={handleCloseViewDialog}
          />
        </>
      )}
    </main>
  );
};

export default TransportServicesPage;
