"use client";

import { FC } from "react";
import { useTranslation } from "@/i18n/client";
import { ZoneWithRelations } from "@/types/models/zone";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Badge } from "@/components/ui/badge";
import { Info, Palette, ToggleLeft, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ViewZoneDialogProps {
  data: ZoneWithRelations;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewZoneDialog: FC<ViewZoneDialogProps> = ({
  data,
  isOpen,
  onOpenChange,
}) => {
  const { t, i18n } = useTranslation("Zones");
  const isRTL = i18n.language !== "en";

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
            <Palette className="h-4 w-4" />
            {data.color}
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
              <MapPin className="h-4 w-4" />
              {t("ViewDialog.Stops")}
            </h3>
            {data.stops && data.stops.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.stops.map((stop) => (
                  <Badge
                    key={stop.id}
                    variant="secondary"
                    className="text-xs px-2 py-1"
                  >
                    {stop.id}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("ViewDialog.NoStops")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </CustomDialog>
  );
};
