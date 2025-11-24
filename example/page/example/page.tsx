// This is an example of how to create a page for a model.
// It is not a complete page and should be used as a reference to create a new page.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

"use client";

import { Permission } from "@prisma/client";
import {
  GalleryWithRelations,
  gallerySchema,
  GalleryFilterParams,
  CreateGalleryData,
  UpdateGalleryData,
} from "@/types/models/gallery";
import {
  useDeleteGallery,
  useFetchGalleries,
  useCreateGallery,
  useUpdateGallery,
} from "@/hooks/employee-hooks/use-galleries";
import { CreateGalleryDialog } from "@/components/dialogs/gallery/create-gallery-dialog";
import { UpdateGalleryDialog } from "@/components/dialogs/gallery/update-gallery-dialog";
import { ViewGalleryDetailsDialog } from "@/components/dialogs/gallery/view-gallery-details-dialog";
import { GalleryFilterDialog } from "@/components/dialogs/gallery/filter-gallery-dialog";
import { getColumns } from "@/components/columns/gallery-table-columns";
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

const GalleriesPage = () => {
  const { t, i18n } = useTranslation("Gallery");
  const isRTL = i18n.language !== "en";
  const { data: session } = useSession();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedGallery, setSelectedGallery] =
    useState<GalleryWithRelations | null>(null);

  const {
    items: galleries,
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
    typeof gallerySchema,
    //@ts-expect-error - TODO: fix this
    GalleryWithRelations,
    CreateGalleryData,
    UpdateGalleryData,
    GalleryFilterParams
  >({
    options: {
      modelName: "Gallery",
      schema: gallerySchema,
      apiPath: "/api/employee/gallery",
      queryKey: ["employee-galleries"],
    },
    initialSearchParams: {},
    useFetch: useFetchGalleries,
    useCreate: useCreateGallery,
    useUpdate: useUpdateGallery,
    useDelete: useDeleteGallery,
  });

  const columns = getColumns(t, i18n.language as "en" | "ar" | "ckb");

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    refetch();
  };

  const handleUpdateSuccess = () => {
    setIsUpdateDialogOpen(false);
    setSelectedGallery(null);
    refetch();
  };

  return (
    <main className="space-y-4">
      <PageHeader
        title={t("GalleryTitle")}
        description={t("ManageGalleries")}
        primaryAction={{
          label: t("CreateGallery"),
          onClick: () => setIsCreateDialogOpen(true),
          disabled: !hasPermission(session, Permission.CREATE_GALLERY),
        }}
        translationNamespace="GalleryTitle"
      />

      <TableFilters
        totalItems={totalItems}
        limit={limit}
        onLimitChange={handleLimitChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        filterDialog={
          <GalleryFilterDialog
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
        {isLoading || !galleries || galleries.length === 0 ? (
          <TableDataState
            isLoading={isLoading}
            loadingMessage={t("LoadingGalleries")}
            noDataMessage={t("NoGalleriesFound")}
          />
        ) : (
          <div className="rounded-xl overflow-hidden border border-border/10">
            <ScrollArea>
              <div className="min-w-[900px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      {columns.map((column: Column<GalleryWithRelations>) => (
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
                    {galleries.map((gallery, index) => (
                      <TableRow
                        key={gallery.id}
                        className="group hover:bg-muted/30 transition-all duration-200 cursor-default"
                      >
                        {columns.map((column: Column<GalleryWithRelations>) => (
                          <TableCell
                            key={column.key.toString()}
                            className={cn(
                              column.className,
                              column.showInMobile === false &&
                                "hidden md:table-cell"
                            )}
                          >
                            {column.render ? (
                              column.render(gallery, {
                                index,
                                t,
                                session,
                                isDeleting,
                                handlers: {
                                  setSelectedItem: setSelectedGallery,
                                  setIsViewDialogOpen: (isOpen: boolean) => {
                                    if (isOpen) setIsViewDialogOpen(true);
                                  },
                                  handleOpenUpdateDialog: (
                                    gallery: GalleryWithRelations
                                  ) => {
                                    if (
                                      hasPermission(
                                        session,
                                        Permission.UPDATE_GALLERY
                                      )
                                    ) {
                                      setSelectedGallery(gallery);
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
                                  gallery[
                                    column.key.toString() as keyof GalleryWithRelations
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

      <CreateGalleryDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedGallery && (
        <>
          <UpdateGalleryDialog
            data={selectedGallery}
            isOpen={isUpdateDialogOpen}
            onOpenChange={setIsUpdateDialogOpen}
            onSuccess={handleUpdateSuccess}
          />

          <ViewGalleryDetailsDialog
            data={selectedGallery as GalleryWithRelations}
            isOpen={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
          />
        </>
      )}
    </main>
  );
};

export default GalleriesPage;
