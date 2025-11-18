// This is an example of how to create a table for a model.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/data-table/confirmation-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type Column, type RenderContext } from "@/types/data-table";
import { GalleryWithRelations } from "@/types/models/gallery";
import { formatDate } from "@/lib/formatDate";
import { cn } from "@/lib/utils";
import {
  Edit,
  Eye,
  Trash2,
  Maximize2,
  CheckCircle2,
  XCircle,
  Grid,
} from "lucide-react";
import { TFunction } from "i18next";
import Image from "next/image";
import { Permission, HaircutStyleCategory } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ImagePreviewer } from "@/components/show-image-previewer";

type ActionButtonHandlers = {
  setSelectedItem: (gallery: GalleryWithRelations) => void;
  setIsViewDialogOpen: (open: boolean) => void;
  handleOpenUpdateDialog: (gallery: GalleryWithRelations) => void;
  handleDelete: (id: string) => void;
};

const GalleryTitleCell = ({
  gallery,
  language,
}: {
  gallery: GalleryWithRelations;
  language: "en" | "ar" | "ckb";
}) => (
  <div className="flex flex-col gap-1">
    <span className="font-semibold text-foreground">
      {language ? gallery.title?.[language] : "-"}
    </span>
    <span className="text-xs text-muted-foreground line-clamp-2">
      {gallery.description?.[language] || "-"}
    </span>
  </div>
);

const FileCell = ({
  gallery,
  t,
}: {
  gallery: GalleryWithRelations;
  t: TFunction;
}) => {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const maxImagesToShow = 3;
  const remainingCount = gallery.images
    ? gallery.images.length - maxImagesToShow
    : 0;

  return (
    <div className="flex items-center gap-2">
      {gallery.images && gallery.images.length > 0 ? (
        <>
          {gallery.images.slice(0, maxImagesToShow).map((image) => (
            <div
              key={image.id}
              className="relative w-12 h-12 rounded-lg overflow-hidden ring-1 ring-border/50 cursor-pointer group"
              onClick={() => setSelectedImageUrl(image.url)}
            >
              <Image
                src={image.url.startsWith("http") ? image.url : `/${image.url}`}
                alt={gallery.title?.en || ""}
                fill
                className="object-cover transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center ring-1 ring-border/50">
              <span className="text-xs font-medium text-muted-foreground">
                +{remainingCount}
              </span>
            </div>
          )}
          {selectedImageUrl && (
            <ImagePreviewer
              isOpen={!!selectedImageUrl}
              onClose={() => setSelectedImageUrl(null)}
              images={[
                {
                  url: selectedImageUrl,
                  alt: gallery.title?.en || "",
                },
              ]}
            />
          )}
        </>
      ) : (
        <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center ring-1 ring-border/50">
          <span className="text-xs text-muted-foreground">{t("NoImage")}</span>
        </div>
      )}
    </div>
  );
};

const CategoryCell = ({
  category,
  t,
}: {
  category: HaircutStyleCategory;
  t: TFunction;
}) => (
  <div className="flex items-center gap-2">
    <Badge
      variant="outline"
      className="bg-blue-50 text-blue-700 border-blue-200 font-medium"
    >
      <Grid className="mr-1 h-3 w-3" />
      {t(`HaircutStyleCategory.${category}`)}
    </Badge>
  </div>
);

const StatusCell = ({ isActive, t }: { isActive: boolean; t: TFunction }) => (
  <div className="flex items-center gap-2">
    {isActive ? (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-200 font-medium"
      >
        <CheckCircle2 className="mr-1 h-3 w-3" />
        {t("Common.Active")}
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-red-50 text-red-700 border-red-200 font-medium"
      >
        <XCircle className="mr-1 h-3 w-3" />
        {t("Common.Inactive")}
      </Badge>
    )}
  </div>
);

const DateCell = ({ date }: { date: Date }) => (
  <div className="flex flex-col">
    <span className="text-sm font-medium text-foreground">
      {formatDate(date)}
    </span>
    <span className="text-xs text-muted-foreground">
      {new Date(date).toLocaleTimeString()}
    </span>
  </div>
);

const ActionButtons = ({
  item,
  context,
}: {
  item: GalleryWithRelations;
  context: RenderContext<GalleryWithRelations>;
}) => {
  const buttons = [
    {
      icon: Eye,
      tooltip: "View",
      requiresPermission: Permission.VIEW_GALLERY,
      onClick: (
        gallery: GalleryWithRelations,
        handlers: ActionButtonHandlers
      ) => {
        handlers.setSelectedItem(gallery);
        handlers.setIsViewDialogOpen(true);
      },
    },
    {
      icon: Edit,
      tooltip: "Edit",
      requiresPermission: Permission.UPDATE_GALLERY,
      onClick: (
        gallery: GalleryWithRelations,
        handlers: ActionButtonHandlers
      ) => {
        handlers.handleOpenUpdateDialog(gallery);
      },
    },
    {
      icon: Trash2,
      tooltip: "Delete",
      requiresPermission: Permission.DELETE_GALLERY,
      className: "text-destructive",
      onClick: (
        gallery: GalleryWithRelations,
        handlers: ActionButtonHandlers
      ) => {
        handlers.handleDelete(gallery.id);
      },
    },
  ];

  const safeHandlers: ActionButtonHandlers = {
    setSelectedItem: (gallery: GalleryWithRelations) => {
      context.handlers.setSelectedItem?.(gallery);
    },
    setIsViewDialogOpen: (open: boolean) => {
      context.handlers.setIsViewDialogOpen?.(open);
    },
    handleOpenUpdateDialog: (gallery: GalleryWithRelations) => {
      context.handlers.handleOpenUpdateDialog?.(gallery);
    },
    handleDelete: (id: string) => {
      context.handlers.handleDelete?.(id);
    },
  };

  return (
    <div className="flex items-center gap-2">
      {buttons.map((button, idx) => {
        const hasPermission =
          !button.requiresPermission ||
          context.session?.user.role?.permissions.includes(
            button.requiresPermission
          );

        const Icon = button.icon;

        if (button.tooltip === "Delete") {
          return (
            <ConfirmationDialog
              key={idx}
              title={context.t("AreYouSure")}
              message={context.t("AreYouSureYouWantToDeleteThisGallery")}
              onConfirm={() => button.onClick(item, safeHandlers)}
              confirmLabel={
                context.isDeleting ? context.t("Deleting") : context.t("Delete")
              }
              cancelLabel={context.t("Cancel")}
              variant="destructive"
              isRtl={context.handlers.isRtl}
              disabled={context.isDeleting}
            >
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", button.className)}
                disabled={!hasPermission}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </ConfirmationDialog>
          );
        }

        return (
          <TooltipProvider key={idx}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-8 w-8", button.className)}
                  disabled={!hasPermission}
                  onClick={() => button.onClick(item, safeHandlers)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>{context.t(button.tooltip)}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};

export const getColumns = (
  t: TFunction,
  language: "en" | "ar" | "ckb"
): Column<GalleryWithRelations>[] => [
  {
    key: "title",
    label: t("Gallery.Title"),
    sortable: true,
    className: "min-w-[250px]",
    render: (gallery) => (
      <GalleryTitleCell gallery={gallery} language={language} />
    ),
  },
  {
    key: "file",
    label: t("Gallery.File"),
    sortable: false,
    className: "min-w-[120px]",
    render: (gallery) => <FileCell gallery={gallery} t={t} />,
  },
  {
    key: "category",
    label: t("Gallery.Category"),
    sortable: true,
    className: "min-w-[120px]",
    render: (gallery) => <CategoryCell category={gallery.category} t={t} />,
  },
  {
    key: "isActive",
    label: t("Gallery.Status"),
    sortable: true,
    className: "min-w-[120px]",
    render: (gallery) => <StatusCell isActive={gallery.isActive} t={t} />,
  },
  {
    key: "createdAt",
    label: t("Gallery.CreatedAt"),
    sortable: true,
    className: "min-w-[150px]",
    render: (gallery) => <DateCell date={gallery.createdAt} />,
  },
  {
    key: "actions",
    label: t("Gallery.Actions"),
    sortable: false,
    className: "w-[100px]",
    render: (gallery, context) => (
      <ActionButtons item={gallery} context={context} />
    ),
  },
];
