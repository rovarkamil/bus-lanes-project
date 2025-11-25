"use client";

import { useMemo, useState } from "react";
import { Permission } from "@prisma/client";
import {
  MapIconWithRelations,
  mapIconSchema,
  MapIconFilterParams,
  CreateMapIconData,
  UpdateMapIconData,
  mapIconFieldConfigs,
} from "@/types/models/map-icon";
import {
  useFetchMapIcons,
  useCreateMapIcon,
  useUpdateMapIcon,
  useDeleteMapIcon,
} from "@/hooks/employee-hooks/use-map-icon";
import { CreateMapIconDialog } from "@/components/dialogs/map-icon/create-map-icon-dialog";
import { UpdateMapIconDialog } from "@/components/dialogs/map-icon/update-map-icon-dialog";
import { ViewMapIconDialog } from "@/components/dialogs/map-icon/view-map-icon-dialog";
import { MapIconFilterDialog } from "@/components/dialogs/map-icon/filter-map-icon-dialog";
import { mapIconColumns } from "@/components/columns/map-icon-table-columns";
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

const MapIconsPage = () => {
  const { t, i18n } = useTranslation("MapIcons");
  const isRTL = i18n.language !== "en";
  const { data: session } = useSession();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<MapIconWithRelations | null>(
    null
  );

  const {
    items: icons,
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
    typeof mapIconSchema,
    // @ts-expect-error map needs relation fields
    MapIconWithRelations,
    CreateMapIconData,
    UpdateMapIconData,
    MapIconFilterParams
  >({
    options: {
      modelName: "MapIcons",
      schema: mapIconSchema,
      apiPath: "/api/employee/map-icon",
      queryKey: ["employee-map-icons"],
      fieldConfigs: mapIconFieldConfigs,
    },
    initialSearchParams: {},
    useFetch: (params) =>
      useFetchMapIcons(params as MapIconFilterParams & Record<string, unknown>),
    useCreate: useCreateMapIcon,
    useUpdate: useUpdateMapIcon,
    useDelete: useDeleteMapIcon,
  });

  const columns = useMemo(() => {
    return ensureIndexColumn(mapIconColumns(t));
  }, [t]);

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    refetch();
  };

  const handleUpdateSuccess = () => {
    setIsUpdateDialogOpen(false);
    setSelectedIcon(null);
    refetch();
  };

  const handleCloseUpdateDialog = (open: boolean) => {
    setIsUpdateDialogOpen(open);
    if (!open) {
      setSelectedIcon(null);
    }
  };

  const handleCloseViewDialog = (open: boolean) => {
    setIsViewDialogOpen(open);
    if (!open) {
      setSelectedIcon(null);
    }
  };

  return (
    <main className="space-y-4">
      <PageHeader
        title={t("MapIconsTitle")}
        description={t("ManageMapIcons")}
        primaryAction={{
          label: t("CreateMapIcon"),
          onClick: () => setIsCreateDialogOpen(true),
          disabled: !hasPermission(session, Permission.CREATE_MAP_ICON),
        }}
        translationNamespace="MapIconsTitle"
      />

      <TableFilters
        totalItems={totalItems}
        limit={limit}
        onLimitChange={handleLimitChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        filterDialog={
          <MapIconFilterDialog
            currentInputs={filters as MapIconFilterParams}
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
        {isLoading || !icons || icons.length === 0 ? (
          <TableDataState
            isLoading={isLoading}
            loadingMessage={t("LoadingMapIcons")}
            noDataMessage={t("NoMapIconsFound")}
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
                    {icons.map((icon, index) => (
                      <TableRow
                        key={icon.id}
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
                              column.render(icon, {
                                index,
                                t,
                                session,
                                isDeleting,
                                handlers: {
                                  setSelectedItem: (item) =>
                                    setSelectedIcon(item),
                                  setIsViewDialogOpen: (isOpen: boolean) => {
                                    if (isOpen) setIsViewDialogOpen(true);
                                  },
                                  handleOpenUpdateDialog: (item) => {
                                    if (
                                      hasPermission(
                                        session,
                                        Permission.UPDATE_MAP_ICON
                                      )
                                    ) {
                                      setSelectedIcon(item);
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
                                  icon[
                                    column.key as keyof MapIconWithRelations
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

      <CreateMapIconDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedIcon && (
        <>
          <UpdateMapIconDialog
            data={selectedIcon}
            isOpen={isUpdateDialogOpen}
            onOpenChange={handleCloseUpdateDialog}
            onSuccess={handleUpdateSuccess}
          />
          <ViewMapIconDialog
            data={selectedIcon}
            isOpen={isViewDialogOpen}
            onOpenChange={handleCloseViewDialog}
          />
        </>
      )}
    </main>
  );
};

export default MapIconsPage;
