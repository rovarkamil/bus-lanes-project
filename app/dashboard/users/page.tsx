"use client";

import { Permission } from "@prisma/client";
import {
  UserWithRelations,
  userSchema,
  UserFilterParams,
  CreateUserData,
  UpdateUserData,
} from "@/types/models/user";
import {
  useDeleteUser,
  useFetchUsers,
  useCreateUser,
  useUpdateUser,
} from "@/hooks/employee-hooks/use-users";
import { CreateUserDialog } from "@/components/dialogs/user/create-user-dialog";
import { UpdateUserDialog } from "@/components/dialogs/user/update-user-dialog";
import { ViewUserDetailsDialog } from "@/components/dialogs/user/view-user-details-dialog";
import { UserFilterDialog } from "@/components/dialogs/user/filter-user-dialog";
import { getColumns } from "@/components/columns/user-table-columns";
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

const UsersPage = () => {
  const { t, i18n } = useTranslation("Users");
  const isRTL = i18n.language !== "en";
  const { data: session } = useSession();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRelations | null>(
    null
  );

  const {
    items: users,
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
    typeof userSchema,
    UserWithRelations,
    CreateUserData,
    // @ts-expect-error - UpdateUserData is not used in the useModelOperations hook
    UpdateUserData,
    UserFilterParams
  >({
    options: {
      modelName: "Users",
      schema: userSchema,
      apiPath: "/api/employee/user",
      queryKey: ["employee-users"],
    },
    initialSearchParams: {},
    useFetch: (params) => useFetchUsers(params as UserFilterParams),
    useCreate: useCreateUser,
    useUpdate: useUpdateUser,
    useDelete: useDeleteUser,
  });

  const columns = getColumns(t);

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    refetch();
  };

  const handleUpdateSuccess = () => {
    setIsUpdateDialogOpen(false);
    setSelectedUser(null);
    refetch();
  };

  return (
    <main className="space-y-4">
      <PageHeader
        title={t("UsersTitle")}
        description={t("ManageSystemUsers")}
        primaryAction={{
          label: t("CreateUsers"),
          onClick: () => setIsCreateDialogOpen(true),
          disabled: !hasPermission(session, Permission.CREATE_USER),
        }}
        translationNamespace="UsersTitle"
      />

      <TableFilters
        totalItems={totalItems}
        limit={limit}
        onLimitChange={handleLimitChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        filterDialog={
          <UserFilterDialog
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
        {isLoading || !users || users.length === 0 ? (
          <TableDataState
            isLoading={isLoading}
            loadingMessage={t("LoadingUsers")}
            noDataMessage={t("NoUsersFound")}
          />
        ) : (
          <div className="rounded-xl overflow-hidden ">
            <ScrollArea>
              <div className="min-w-[900px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      {columns.map((column: Column<UserWithRelations>) => (
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
                    {users.map((user, index) => (
                      <TableRow
                        key={user.id}
                        className="group hover:bg-muted/30 transition-all duration-200 cursor-default"
                      >
                        {columns.map((column: Column<UserWithRelations>) => (
                          <TableCell
                            key={column.key.toString()}
                            className={cn(
                              column.className,
                              column.showInMobile === false &&
                                "hidden md:table-cell"
                            )}
                          >
                            {column.render ? (
                              column.render(user, {
                                index,
                                t,
                                session,
                                isDeleting,
                                handlers: {
                                  setSelectedItem: setSelectedUser,
                                  setIsViewDialogOpen: (isOpen: boolean) => {
                                    if (isOpen) setIsViewDialogOpen(true);
                                  },
                                  handleOpenUpdateDialog: (
                                    user: UserWithRelations
                                  ) => {
                                    if (
                                      hasPermission(
                                        session,
                                        Permission.UPDATE_USER
                                      )
                                    ) {
                                      setSelectedUser(user);
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
                                  user[
                                    column.key.toString() as keyof UserWithRelations
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

      <CreateUserDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedUser && (
        <>
          <UpdateUserDialog
            data={selectedUser}
            isOpen={isUpdateDialogOpen}
            onOpenChange={setIsUpdateDialogOpen}
            onSuccess={handleUpdateSuccess}
          />

          <ViewUserDetailsDialog
            user={selectedUser}
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            onSuccess={() => setIsViewDialogOpen(false)}
          />
        </>
      )}
    </main>
  );
};

export default UsersPage;
