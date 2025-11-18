"use client";

import { FC, useState } from "react";
import { useTranslation } from "@/i18n/client";
import { BusStopWithRelations } from "@/types/models/bus-stop";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Info,
  MapPin,
  Map,
  Layers,
  ToggleLeft,
  Image as ImageIcon,
  Navigation,
  CheckSquare,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ImagePreviewer } from "@/components/show-image-previewer";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";

interface ViewBusStopDialogProps {
  data: BusStopWithRelations;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type BusStopBooleanField =
  | "hasShelter"
  | "hasBench"
  | "hasLighting"
  | "isAccessible"
  | "hasRealTimeInfo"
  | "isActive";

type BusStopWithFeatureFlags = BusStopWithRelations & {
  hasShelter?: boolean;
  hasBench?: boolean;
  hasLighting?: boolean;
  isAccessible?: boolean;
  hasRealTimeInfo?: boolean;
  isActive?: boolean;
};

const BOOLEAN_DISPLAY_FIELDS: Array<{
  key: BusStopBooleanField;
  label: string;
  icon: LucideIcon;
}> = [
  { key: "hasShelter", label: "HasShelter", icon: CheckSquare },
  { key: "hasBench", label: "HasBench", icon: CheckSquare },
  { key: "hasLighting", label: "HasLighting", icon: CheckSquare },
  { key: "isAccessible", label: "IsAccessible", icon: Navigation },
  { key: "hasRealTimeInfo", label: "HasRealTimeInfo", icon: ToggleLeft },
  { key: "isActive", label: "IsActive", icon: ToggleLeft },
];

export const ViewBusStopDialog: FC<ViewBusStopDialogProps> = ({
  data,
  isOpen,
  onOpenChange,
}) => {
  const stop = data as BusStopWithFeatureFlags;
  const { t, i18n } = useTranslation("BusStops");
  const isRTL = i18n.language !== "en";
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!stop) return null;

  const handleOpenImage = (url: string) => {
    setPreviewImage(url);
    setIsImagePreviewOpen(true);
  };

  return (
    <CustomDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t("ViewDialog.Title")}
      description={t("ViewDialog.Description")}
      rtl={isRTL}
      icon={Info}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Badge
            variant={stop.isActive ? "success" : "destructive"}
            className="flex items-center gap-1.5 px-3 py-1 text-sm"
          >
            <ToggleLeft className="h-4 w-4" />
            {stop.isActive ? t("Common.Active") : t("Common.Inactive")}
          </Badge>
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 px-3 py-1"
          >
            <MapPin className="h-4 w-4" />
            {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
          </Badge>
          {stop.zone && (
            <Badge
              variant="outline"
              className="flex items-center gap-1.5 px-3 py-1"
            >
              <Layers className="h-4 w-4" />
              {stop.zone.name?.en ?? stop.zoneId}
            </Badge>
          )}
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">
                {t("Common.Name")}
              </p>
              <p className="text-lg font-semibold">
                {stop.name?.en ?? t("Common.NotAvailable")}
              </p>
            </div>
            {stop.description?.en && (
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("Common.Description")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {stop.description.en}
                </p>
              </div>
            )}
            {stop.icon && (
              <div className="flex items-center gap-2">
                <Map className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {stop.icon.name?.en ?? stop.icon.file?.name ?? stop.iconId}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t("ViewDialog.Location")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("ViewDialog.Coordinates", {
                  lat: stop.latitude.toFixed(6),
                  lng: stop.longitude.toFixed(6),
                })}
              </p>
              {stop.order && (
                <Badge variant="secondary" className="w-fit">
                  {t("ViewDialog.DisplayOrder", { order: stop.order })}
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                {t("ViewDialog.Amenities")}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {BOOLEAN_DISPLAY_FIELDS.map(({ key, label, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {t(`ViewDialog.${label}`)}:{" "}
                      <span className="font-medium">
                        {stop[key] ? t("Common.Yes") : t("Common.No")}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {stop.images && stop.images.length > 0 ? (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                {t("ViewDialog.Images")}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {stop.images.map((image, index) => (
                  <button
                    type="button"
                    key={image.id || index}
                    className="relative aspect-square rounded-lg overflow-hidden border border-border/50 group"
                    onClick={() => handleOpenImage(image.url)}
                  >
                    <Image
                      src={image.url}
                      alt={image.name ?? `stop-image-${index}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className={cn(
                        "object-cover transition-all duration-300",
                        "group-hover:scale-110"
                      )}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              {t("ViewDialog.NoImages")}
            </CardContent>
          </Card>
        )}
      </div>

      {isImagePreviewOpen && previewImage && (
        <ImagePreviewer
          isOpen={isImagePreviewOpen}
          onClose={() => {
            setIsImagePreviewOpen(false);
            setPreviewImage(null);
          }}
          images={[
            {
              url: previewImage,
              alt: "Bus stop image",
            },
          ]}
        />
      )}
    </CustomDialog>
  );
};
