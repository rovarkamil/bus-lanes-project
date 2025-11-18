"use client";

import { FC, useState } from "react";
import { useTranslation } from "@/i18n/client";
import { TransportServiceWithRelations } from "@/types/models/transport-service";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Info,
  Bus,
  Palette,
  Gauge,
  Clock,
  ToggleLeft,
  Route as RouteIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { ImagePreviewer } from "@/components/show-image-previewer";

interface ViewTransportServiceDialogProps {
  data: TransportServiceWithRelations;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewTransportServiceDialog: FC<
  ViewTransportServiceDialogProps
> = ({ data, isOpen, onOpenChange }) => {
  const { t, i18n } = useTranslation("TransportServices");
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
      maxWidth="4xl"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 px-3 py-1 text-sm"
          >
            <Bus className="h-4 w-4" />
            {t(`TransportServiceType.${data.type}`)}
          </Badge>
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 px-3 py-1 text-sm"
          >
            <Palette className="h-4 w-4" />
            {data.color}
          </Badge>
          <Badge
            variant={data.isActive ? "success" : "destructive"}
            className="flex items-center gap-1.5 px-3 py-1 text-sm"
          >
            <ToggleLeft className="h-4 w-4" />
            {data.isActive ? t("Common.Active") : t("Common.Inactive")}
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
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              {t("ViewDialog.OperationalDetails")}
            </h3>
            <div className="flex flex-wrap gap-3">
              {typeof data.capacity === "number" && (
                <Badge variant="secondary">
                  {t("ViewDialog.CapacityValue", { value: data.capacity })}
                </Badge>
              )}
              {(data.operatingFrom || data.operatingTo) && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5"
                >
                  <Clock className="h-3 w-3" />
                  {t("ViewDialog.OperatingHours", {
                    from: data.operatingFrom ?? "--:--",
                    to: data.operatingTo ?? "--:--",
                  })}
                </Badge>
              )}
              <Badge variant="secondary" className="flex items-center gap-1.5">
                <RouteIcon className="h-3 w-3" />
                {t("ViewDialog.RoutesCount", {
                  count: data.routes?.length ?? 0,
                })}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1.5">
                <RouteIcon className="h-3 w-3" />
                {t("ViewDialog.LanesCount", {
                  count: data.lanes?.length ?? 0,
                })}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {data.icon?.file && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Palette className="h-4 w-4" />
                {t("ViewDialog.MapIcon")}
              </h3>
              <button
                type="button"
                className="relative w-32 h-32 border rounded-xl overflow-hidden"
                onClick={() => setIsPreviewOpen(true)}
              >
                <Image
                  src={data.icon.file.url}
                  alt={data.icon.file.name ?? "Transport icon"}
                  fill
                  sizes="128px"
                  className="object-contain bg-muted"
                />
              </button>
            </CardContent>
          </Card>
        )}
      </div>

      {isPreviewOpen && data.icon?.file && (
        <ImagePreviewer
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          images={[
            {
              url: data.icon.file.url,
              alt: data.icon.file.name ?? "Transport service icon",
            },
          ]}
        />
      )}
    </CustomDialog>
  );
};
