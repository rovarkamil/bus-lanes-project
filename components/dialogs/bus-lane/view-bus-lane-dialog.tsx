/* eslint-disable @next/next/no-img-element */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
"use client";

import { FC, useState } from "react";
import { useTranslation } from "@/i18n/client";
import { BusLaneWithRelations } from "@/types/models/bus-lane";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Info,
  CircleDot,
  Route as RouteIcon,
  MapPin,
  Palette,
  Activity,
  Image as ImageIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ImagePreviewer } from "@/components/show-image-previewer";

interface ViewBusLaneDialogProps {
  data: BusLaneWithRelations;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewBusLaneDialog: FC<ViewBusLaneDialogProps> = ({
  data,
  isOpen,
  onOpenChange,
}) => {
  const { t, i18n } = useTranslation("BusLanes");
  const isRTL = i18n.language !== "en";
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  if (!data) return null;

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
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant={data.isActive ? "success" : "destructive"}
            className="px-3 py-1 text-sm font-medium flex items-center gap-1.5"
          >
            <CircleDot className="h-4 w-4" />
            {data.isActive ? t("Common.Active") : t("Common.Inactive")}
          </Badge>

          <Badge
            variant="outline"
            className="px-3 py-1 text-sm flex items-center gap-1.5"
          >
            <Palette className="h-4 w-4" />
            {data.color}
          </Badge>

          <Badge
            variant="outline"
            className="px-3 py-1 text-sm flex items-center gap-1.5"
          >
            <Activity className="h-4 w-4" />
            {t("ViewDialog.WeightOpacity", {
              weight: data.weight,
              opacity: data.opacity,
            })}
          </Badge>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">{t("Common.Name")}</span>
              <span className="text-lg font-semibold">
                {data.name?.en ?? t("Common.NotAvailable")}
              </span>
            </div>
            {data.description?.en && (
              <div>
                <span className="text-xs text-muted-foreground">
                  {t("Common.Description")}
                </span>
                <p className="text-sm text-muted-foreground">{data.description.en}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <RouteIcon className="h-4 w-4" />
                {t("ViewDialog.Relations")}
              </h3>
              <div className="flex flex-col gap-2">
                <Badge variant="secondary">
                  {t("ViewDialog.Routes", { count: data.routes?.length ?? 0 })}
                </Badge>
                <Badge variant="secondary">
                  {t("ViewDialog.Stops", { count: data.stops?.length ?? 0 })}
                </Badge>
                <Badge variant="outline">
                  {t("ViewDialog.Service")} : {data.service?.type ?? t("Common.None")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t("ViewDialog.PathPoints")}
              </h3>
              <div className="max-h-40 overflow-auto rounded border border-border/50 p-2 text-xs bg-muted/30">
                <pre>{JSON.stringify(data.path, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              {t("ViewDialog.Images")}
            </h3>
            {data.images && data.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {data.images.map((image, index) => (
                  <div
                    key={image.id || index}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer border border-border/50 group"
                    onClick={() => {
                      setSelectedImageUrl(image.url);
                      setIsImagePreviewOpen(true);
                    }}
                  >
                    <img
                      src={image.url}
                      alt={image.name || `lane-image-${index}`}
                      className={cn(
                        "w-full h-full object-cover transition-all duration-300",
                        "group-hover:scale-110"
                      )}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("ViewDialog.NoImages")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {isImagePreviewOpen && selectedImageUrl && (
        <ImagePreviewer
          isOpen={isImagePreviewOpen}
          onClose={() => {
            setIsImagePreviewOpen(false);
            setSelectedImageUrl(null);
          }}
          images={[
            {
              url: selectedImageUrl,
              alt: "Bus lane image",
            },
          ]}
        />
      )}
    </CustomDialog>
  );
};


