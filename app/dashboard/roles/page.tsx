"use client";

import { Permission } from "@prisma/client";
import {
  RoleWithRelations,
  roleSchema,
  RoleFilterParams,
} from "@/types/models/role";
import {
  useDeleteRole,
  useFetchRoles,
  useCreateRole,
  useUpdateRole,
} from "@/hooks/employee-hooks/use-roles";
import { CreateRoleDialog } from "@/components/dialogs/role/create-role-dialog";
import { UpdateRoleDialog } from "@/components/dialogs/role/update-role-dialog";
import { ViewRoleDetailsDialog } from "@/components/dialogs/role/view-role-details-dialog";
import { RoleFilterDialog } from "@/components/dialogs/role/filter-role-dialog";
import { getRoleColumns } from "@/components/columns/role-table-columns";
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

const RolesPage = () => {
  const { t } = useTranslation("Roles");
  const { data: session } = useSession();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithRelations | null>(
    null
  );

  const {
    items: roles,
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
  } = useModelOperations({
    options: {
      modelName: "Roles",
      schema: roleSchema,
      apiPath: "/api/employee/role",
      queryKey: ["employee-roles"],
    },
    initialSearchParams: {},
    useFetch: (params) => useFetchRoles(params as RoleFilterParams),
    useCreate: useCreateRole,
    useUpdate: useUpdateRole,
    useDelete: useDeleteRole,
  });

  const columns = getRoleColumns(t);

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    refetch();
  };

  const handleUpdateSuccess = () => {
    setIsUpdateDialogOpen(false);
    setSelectedRole(null);
    refetch();
  };

  return (
    <main className="space-y-4">
      <PageHeader
        title={t("Roles")}
        description={t("ManageSystemRoles")}
        primaryAction={{
          label: t("CreateRoles"),
          onClick: () => setIsCreateDialogOpen(true),
          disabled: !hasPermission(session, Permission.CREATE_ROLE),
        }}
        translationNamespace="Roles"
      />

      <TableFilters
        totalItems={totalItems}
        limit={limit}
        onLimitChange={handleLimitChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        isRtl={false}
        filterDialog={
          <RoleFilterDialog
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
      />

      <div className="bg-background rounded-xl">
        {isLoading || !roles || roles.length === 0 ? (
          <TableDataState
            isLoading={isLoading}
            loadingMessage={t("LoadingRoles")}
            noDataMessage={t("NoRolesFound")}
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
                    {roles.map((role, index) => (
                      <TableRow
                        key={role.id}
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
                              column.render(role, {
                                index,
                                t,
                                session,
                                isDeleting,
                                handlers: {
                                  setSelectedItem: setSelectedRole,
                                  setIsViewDialogOpen: (isOpen) => {
                                    if (isOpen) setIsViewDialogOpen(true);
                                  },
                                  handleOpenUpdateDialog: (role) => {
                                    if (
                                      hasPermission(
                                        session,
                                        Permission.UPDATE_ROLE
                                      )
                                    ) {
                                      setSelectedRole(role);
                                      setIsUpdateDialogOpen(true);
                                    }
                                  },
                                  handleDelete,
                                  isRtl: false,
                                },
                              })
                            ) : (
                              <span>
                                {String(
                                  role[
                                    column.key.toString() as keyof RoleWithRelations
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

      <CreateRoleDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedRole && (
        <>
          <UpdateRoleDialog
            data={selectedRole}
            isOpen={isUpdateDialogOpen}
            onOpenChange={setIsUpdateDialogOpen}
            onSuccess={handleUpdateSuccess}
          />

          <ViewRoleDetailsDialog
            role={selectedRole}
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            onSuccess={() => setIsViewDialogOpen(false)}
          />
        </>
      )}
    </main>
  );
};

export default RolesPage;
