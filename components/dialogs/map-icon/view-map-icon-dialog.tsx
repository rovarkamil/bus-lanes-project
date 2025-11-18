"use client";

import { FC, useState } from "react";
import { useTranslation } from "@/i18n/client";
import { MapIconWithRelations } from "@/types/models/map-icon";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Info,
  Move,
  Crosshair,
  ToggleLeft,
  Route as RouteIcon,
  MapPin,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { ImagePreviewer } from "@/components/show-image-previewer";

interface ViewMapIconDialogProps {
  data: MapIconWithRelations;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewMapIconDialog: FC<ViewMapIconDialogProps> = ({
  data,
  isOpen,
  onOpenChange,
}) => {
  const { t, i18n } = useTranslation("MapIcons");
  const isRTL = i18n.language !== "en";
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  if (!data) return null;

  return (
    <CustomDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t("ViewDialog.Title")}
      description={t("ViewDialog.Description")}
      rtl={isRTL}
      icon={Info}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Badge
            variant={data.isActive ? "success" : "destructive"}
            className="flex items-center gap-1.5 px-3 py-1 text-sm"
          >
            <ToggleLeft className="h-4 w-4" />
            {data.isActive ? t("Common.Active") : t("Common.Inactive")}
          </Badge>
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 px-3 py-1"
          >
            <Move className="h-4 w-4" />
            {t("ViewDialog.IconSizeValue", { value: data.iconSize })}
          </Badge>
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 px-3 py-1"
          >
            <Crosshair className="h-4 w-4" />
            {t("ViewDialog.AnchorValue", {
              x: data.iconAnchorX,
              y: data.iconAnchorY,
            })}
          </Badge>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">
                {t("Common.Name")}
              </p>
              <p className="text-lg font-semibold">
                {data.name?.en ?? t("Common.NotAvailable")}
              </p>
            </div>
            {data.description?.en && (
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("Common.Description")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.description.en}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Move className="h-4 w-4" />
              {t("ViewDialog.AnchorConfiguration")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Badge variant="secondary" className="justify-center">
                {t("ViewDialog.IconAnchor", {
                  x: data.iconAnchorX,
                  y: data.iconAnchorY,
                })}
              </Badge>
              <Badge variant="secondary" className="justify-center">
                {t("ViewDialog.PopupAnchor", {
                  x: data.popupAnchorX,
                  y: data.popupAnchorY,
                })}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {data.file && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold">
                {t("ViewDialog.IconFile")}
              </h3>
              <button
                type="button"
                className="relative w-32 h-32 border rounded-xl overflow-hidden"
                onClick={() => setIsPreviewOpen(true)}
              >
                <Image
                  src={data.file.url}
                  alt={data.file.name ?? "Map icon"}
                  fill
                  sizes="128px"
                  className="object-contain bg-muted"
                />
              </button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <RouteIcon className="h-4 w-4" />
              {t("ViewDialog.Usage")}
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="flex items-center gap-1.5">
                <RouteIcon className="h-3 w-3" />
                {t("ViewDialog.ServicesCount", {
                  count: data.transportServices?.length ?? 0,
                })}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                {t("ViewDialog.StopsCount", {
                  count: data.busStops?.length ?? 0,
                })}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {isPreviewOpen && data.file && (
        <ImagePreviewer
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          images={[
            {
              url: data.file.url,
              alt: data.file.name ?? "Map icon image",
            },
          ]}
        />
      )}
    </CustomDialog>
  );
};
