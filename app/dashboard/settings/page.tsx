"use client";

import { Permission } from "@prisma/client";
import {
  SettingWithRelations,
  settingSchema,
  SettingFilterParams,
  CreateSettingData,
  UpdateSettingData,
} from "@/types/models/setting";
import {
  useDeleteSetting,
  useFetchSettings,
  useCreateSetting,
  useUpdateSetting,
} from "@/hooks/employee-hooks/use-settings";
import { CreateSettingDialog } from "@/components/dialogs/setting/create-setting-dialog";
import { UpdateSettingDialog } from "@/components/dialogs/setting/update-setting-dialog";
import { ViewSettingDetailsDialog } from "@/components/dialogs/setting/view-setting-details-dialog";
import { SettingFilterDialog } from "@/components/dialogs/setting/filter-setting-dialog";
import { getSettingColumns } from "@/components/columns/setting-table-columns";
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
import { useState } from "react";
import { Column } from "@/types/data-table";

const SettingsPage = () => {
  const { t, i18n } = useTranslation("Settings");
  const isRTL = i18n.language !== "en";
  const { data: session } = useSession();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] =
    useState<SettingWithRelations | null>(null);

  const {
    items: settings,
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
    typeof settingSchema,
    SettingWithRelations,
    CreateSettingData,
    UpdateSettingData,
    SettingFilterParams
  >({
    options: {
      modelName: "Settings",
      schema: settingSchema,
      apiPath: "/api/employee/setting",
      queryKey: ["employee-settings"],
    },
    initialSearchParams: {},
    useFetch: (params) => useFetchSettings(params as SettingFilterParams),
    useCreate: useCreateSetting,
    useUpdate: useUpdateSetting,
    useDelete: useDeleteSetting,
  });

  const columns = getSettingColumns(t);

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    refetch();
  };

  const handleUpdateSuccess = () => {
    setIsUpdateDialogOpen(false);
    setSelectedSetting(null);
    refetch();
  };

  return (
    <main className="space-y-4">
      <PageHeader
        title={t("SettingsTitle")}
        description={t("ManageSystemSettings")}
        primaryAction={{
          label: t("CreateSettings"),
          onClick: () => setIsCreateDialogOpen(true),
          disabled: !hasPermission(session, Permission.UPDATE_SETTINGS),
        }}
        translationNamespace="SettingsTitle"
      />

      <TableFilters
        totalItems={totalItems}
        limit={limit}
        onLimitChange={handleLimitChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        filterDialog={
          <SettingFilterDialog
            currentInputs={filters}
            onSearch={applyFilters}
            onInputChange={handleFilterChange}
            onKeyPress={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
            isOpen={isFilterDialogOpen}
            onOpenChange={setIsFilterDialogOpen}
          />
        }
        t={t}
        isRtl={isRTL}
      />

      <div className="bg-background rounded-xl">
        {isLoading || !settings || settings.length === 0 ? (
          <TableDataState
            isLoading={isLoading}
            loadingMessage={t("LoadingSettings")}
            noDataMessage={t("NoSettingsFound")}
          />
        ) : (
          <div className="rounded-xl overflow-hidden">
            <ScrollArea>
              <div className="min-w-[900px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      {columns.map((column: Column<SettingWithRelations>) => (
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
                    {settings.map((setting, index) => (
                      <TableRow
                        key={setting.id}
                        className="group hover:bg-muted/30 transition-all duration-200 cursor-default"
                      >
                        {columns.map((column: Column<SettingWithRelations>) => (
                          <TableCell
                            key={column.key.toString()}
                            className={cn(
                              column.className,
                              column.showInMobile === false &&
                                "hidden md:table-cell"
                            )}
                          >
                            {column.render ? (
                              column.render(setting, {
                                index,
                                t,
                                session,
                                isDeleting,
                                handlers: {
                                  setSelectedItem: setSelectedSetting,
                                  setIsViewDialogOpen: (isOpen: boolean) => {
                                    if (isOpen) setIsViewDialogOpen(true);
                                  },
                                  handleOpenUpdateDialog: (
                                    setting: SettingWithRelations
                                  ) => {
                                    if (
                                      hasPermission(
                                        session,
                                        Permission.UPDATE_SETTINGS
                                      )
                                    ) {
                                      setSelectedSetting(setting);
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
                                  setting[
                                    column.key.toString() as keyof SettingWithRelations
                                  ] || ""
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

      <CreateSettingDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedSetting && (
        <>
          <UpdateSettingDialog
            data={selectedSetting}
            isOpen={isUpdateDialogOpen}
            onOpenChange={setIsUpdateDialogOpen}
            onSuccess={handleUpdateSuccess}
          />

          <ViewSettingDetailsDialog
            setting={selectedSetting}
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            onSuccess={() => setIsViewDialogOpen(false)}
          />
        </>
      )}
    </main>
  );
};

export default SettingsPage;
