"use client";

import { FC, useEffect, useState } from "react";
import { useTranslation } from "@/i18n/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Info,
  Home,
  Sofa,
  Lightbulb,
  Accessibility,
  Radio,
  ToggleLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { LanguageTabs } from "@/components/language-tabs";
import { LanguageFields } from "@/utils/language-handler";
import { MultipleImageUploader } from "@/components/multiple-image-uploader";
import { useUpdateBusStop } from "@/hooks/employee-hooks/use-bus-stop";
import {
  BusStopWithRelations,
  UpdateBusStopData,
  updateBusStopSchema,
} from "@/types/models/bus-stop";
import {
  uploadMultipleImages,
  type UploadedFile,
} from "@/utils/supabase-storage-handler";
import SelectWithPagination from "@/components/select-with-pagination";
import MultipleSelectWithPagination from "@/components/multiple-select-with-pagination";
import { useFetchZones } from "@/hooks/employee-hooks/use-zone";
import { useFetchMapIcons } from "@/hooks/employee-hooks/use-map-icon";
import { useFetchBusLanes } from "@/hooks/employee-hooks/use-bus-lane";
import { useFetchBusRoutes } from "@/hooks/employee-hooks/use-bus-route";
import { ZoneWithRelations } from "@/types/models/zone";
import { MapIconWithRelations } from "@/types/models/map-icon";
import { BusLaneWithRelations } from "@/types/models/bus-lane";
import { BusRouteWithRelations } from "@/types/models/bus-route";
import { cn } from "@/lib/utils";

type SelectedImage = {
  file: File;
  url: string;
  type: string;
  name: string;
  size: number;
  id?: string;
  isExisting?: boolean;
};

interface UpdateBusStopDialogProps {
  data: BusStopWithRelations;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type BusStopToggleField =
  | "hasShelter"
  | "hasBench"
  | "hasLighting"
  | "isAccessible"
  | "hasRealTimeInfo"
  | "isActive";

const BOOLEAN_FIELDS: BusStopToggleField[] = [
  "hasShelter",
  "hasBench",
  "hasLighting",
  "isAccessible",
  "hasRealTimeInfo",
  "isActive",
];

type BusStopWithFeatureFlags = BusStopWithRelations & {
  hasShelter?: boolean;
  hasBench?: boolean;
  hasLighting?: boolean;
  isAccessible?: boolean;
  hasRealTimeInfo?: boolean;
  isActive?: boolean;
  order?: number | null;
};

export const UpdateBusStopDialog: FC<UpdateBusStopDialogProps> = ({
  data,
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const stop = data as BusStopWithFeatureFlags;
  const { t, i18n } = useTranslation("BusStops");
  const isRTL = i18n.language !== "en";
  const [activeTab, setActiveTab] = useState<"english" | "arabic" | "kurdish">(
    "english"
  );
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ZoneWithRelations | null>(
    (stop.zone as ZoneWithRelations) || null
  );
  const [selectedIcon, setSelectedIcon] = useState<MapIconWithRelations | null>(
    (stop.icon as MapIconWithRelations) || null
  );
  const [selectedLanes, setSelectedLanes] = useState<BusLaneWithRelations[]>(
    (stop.lanes as BusLaneWithRelations[]) || []
  );
  const [selectedRoutes, setSelectedRoutes] = useState<BusRouteWithRelations[]>(
    (stop.routes as BusRouteWithRelations[]) || []
  );

  const { mutateAsync: updateBusStop, isPending: isSubmitting } =
    useUpdateBusStop();

  const form = useForm<UpdateBusStopData>({
    resolver: zodResolver(updateBusStopSchema),
    defaultValues: {
      id: stop.id,
      nameFields: {
        en: stop.name?.en || "",
        ar: stop.name?.ar || null,
        ckb: stop.name?.ckb || null,
      },
      descriptionFields: {
        en: stop.description?.en || "",
        ar: stop.description?.ar || null,
        ckb: stop.description?.ckb || null,
      },
      latitude: stop.latitude,
      longitude: stop.longitude,
      iconId: stop.iconId,
      zoneId: stop.zoneId,
      hasShelter: stop.hasShelter ?? false,
      hasBench: stop.hasBench ?? false,
      hasLighting: stop.hasLighting ?? false,
      isAccessible: stop.isAccessible ?? false,
      hasRealTimeInfo: stop.hasRealTimeInfo ?? false,
      order: stop.order ?? undefined,
      isActive: stop.isActive ?? true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        id: stop.id,
        nameFields: {
          en: stop.name?.en || "",
          ar: stop.name?.ar || null,
          ckb: stop.name?.ckb || null,
        },
        descriptionFields: {
          en: stop.description?.en || "",
          ar: stop.description?.ar || null,
          ckb: stop.description?.ckb || null,
        },
        latitude: stop.latitude,
        longitude: stop.longitude,
        iconId: stop.iconId,
        zoneId: stop.zoneId,
        hasShelter: stop.hasShelter ?? false,
        hasBench: stop.hasBench ?? false,
        hasLighting: stop.hasLighting ?? false,
        isAccessible: stop.isAccessible ?? false,
        hasRealTimeInfo: stop.hasRealTimeInfo ?? false,
        order: stop.order ?? undefined,
        isActive: stop.isActive ?? true,
      });

      setSelectedZone((stop.zone as ZoneWithRelations) || null);
      setSelectedIcon((stop.icon as MapIconWithRelations) || null);
      setSelectedLanes((stop.lanes as BusLaneWithRelations[]) || []);
      setSelectedRoutes((stop.routes as BusRouteWithRelations[]) || []);

      setImages(
        stop.images
          ? stop.images.map((image) => ({
              file: new File([], image.name || "image", {
                type: image.type || "image/jpeg",
              }),
              url: image.url,
              type: image.type || "",
              name: image.name || "",
              size: image.size || 0,
              id: image.id,
              isExisting: true,
            }))
          : []
      );
    }
  }, [form, isOpen, stop]);

  const handleSubmit = async (formData: UpdateBusStopData) => {
    try {
      if (!formData.nameFields?.en?.trim()) {
        toast.error(t("Error.NameRequired"));
        return;
      }

      setIsUploading(true);

      const newImages = images.filter((image) => !image.isExisting);
      let uploadedImages: UploadedFile[] = [];

      if (newImages.length > 0) {
        uploadedImages = await uploadMultipleImages(
          newImages.map((img) => img.file),
          "bus-stop-images"
        );
      }

      const combinedImages = [
        ...images
          .filter((image) => image.isExisting)
          .map((image) => ({
            url: image.url,
            type: image.type,
            name: image.name,
            size: image.size,
            id: image.id,
          })),
        ...uploadedImages.map((image) => ({
          url: image.url,
          type: image.type,
          name: image.name,
          size: image.size,
        })),
      ];

      await updateBusStop({
        ...formData,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        order:
          formData.order === undefined || formData.order === null
            ? undefined
            : Number(formData.order),
        iconId: selectedIcon?.id || null,
        zoneId: selectedZone?.id || null,
        images: combinedImages,
        laneIds:
          selectedLanes.length > 0
            ? selectedLanes.map((lane) => lane.id)
            : undefined,
        routeIds:
          selectedRoutes.length > 0
            ? selectedRoutes.map((route) => route.id)
            : undefined,
      });

      toast.success(t("Success.Updated"));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating bus stop:", error);
      toast.error(t("Error.UpdateFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageSelect = (files: File[], urls?: string[]) => {
    const nextImages = files.map((file, index) => ({
      file,
      url: urls?.[index] ?? URL.createObjectURL(file),
      type: file.type || "",
      name: file.name || "",
      size: file.size || 0,
      isExisting: false,
    }));

    setImages((prev) => [...prev, ...nextImages]);
  };

  const handleImageRemove = (index: number) => {
    if (images[index]?.url.startsWith("blob:")) {
      URL.revokeObjectURL(images[index].url);
    }
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <CustomDialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
        }
        onOpenChange(open);
      }}
      title={t("UpdateDialog.Title")}
      description={t("UpdateDialog.Description")}
      rtl={isRTL}
      icon={Info}
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <LanguageTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          titleFields={form.watch("nameFields") as LanguageFields}
          onTitleChange={(fields: LanguageFields) =>
            form.setValue("nameFields", fields)
          }
          descriptionFields={form.watch("descriptionFields") as LanguageFields}
          onDescriptionChange={(fields: LanguageFields) =>
            form.setValue("descriptionFields", fields)
          }
        />

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("UpdateDialog.Latitude")}</Label>
              <Input
                type="number"
                step="0.000001"
                value={form.watch("latitude")}
                onChange={(e) =>
                  form.setValue("latitude", Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.Longitude")}</Label>
              <Input
                type="number"
                step="0.000001"
                value={form.watch("longitude")}
                onChange={(e) =>
                  form.setValue("longitude", Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.ZoneId")}</Label>
              <SelectWithPagination<ZoneWithRelations>
                fetchFunction={useFetchZones}
                onSelect={(item) => {
                  setSelectedZone(item);
                  form.setValue("zoneId", item?.id || null);
                }}
                fields={[
                  {
                    key: "name",
                    label: t("Common.Name"),
                    type: "relation",
                  },
                ]}
                placeholder={t("UpdateDialog.ZoneId")}
                value={selectedZone?.id}
                defaultValue={selectedZone || undefined}
                initialSelectedItem={selectedZone || undefined}
                canClear
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.IconId")}</Label>
              <SelectWithPagination<MapIconWithRelations>
                fetchFunction={useFetchMapIcons}
                onSelect={(item) => {
                  setSelectedIcon(item);
                  form.setValue("iconId", item?.id || null);
                }}
                fields={[
                  {
                    key: "name",
                    label: t("Common.Name"),
                    type: "relation",
                  },
                ]}
                placeholder={t("UpdateDialog.IconId")}
                value={selectedIcon?.id}
                defaultValue={selectedIcon || undefined}
                initialSelectedItem={selectedIcon || undefined}
                canClear
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.Order")}</Label>
              <Input
                type="number"
                min={1}
                value={form.watch("order") ?? ""}
                onChange={(e) =>
                  form.setValue(
                    "order",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.LaneIds")}</Label>
              <MultipleSelectWithPagination
                fetchFunction={useFetchBusLanes}
                onSelect={(items: BusLaneWithRelations[]) => {
                  setSelectedLanes(items);
                }}
                fields={[
                  {
                    key: "name",
                    label: t("Common.Name"),
                    type: "relation",
                  },
                ]}
                placeholder={t("UpdateDialog.LaneIds")}
                value={selectedLanes.map((lane) => lane.id)}
                initialSelectedItems={selectedLanes}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.RouteIds")}</Label>
              <MultipleSelectWithPagination
                fetchFunction={useFetchBusRoutes}
                onSelect={(items: BusRouteWithRelations[]) => {
                  setSelectedRoutes(items);
                }}
                fields={[
                  {
                    key: "name",
                    label: t("Common.Name"),
                    type: "relation",
                  },
                  {
                    key: "routeNumber",
                    label: t("Table.Route"),
                    type: "string",
                  },
                ]}
                placeholder={t("UpdateDialog.RouteIds")}
                value={selectedRoutes.map((route) => route.id)}
                initialSelectedItems={selectedRoutes}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("UpdateDialog.Images")}</Label>
            <MultipleImageUploader
              onImagesSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
              selectedImages={images}
              maxSize={5 * 1024 * 1024}
              label={t("UpdateDialog.Images")}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">
              {t("UpdateDialog.Amenities")}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BOOLEAN_FIELDS.map((key) => {
                const isChecked = Boolean(form.watch(key));
                const icons: Record<string, typeof Home> = {
                  hasShelter: Home,
                  hasBench: Sofa,
                  hasLighting: Lightbulb,
                  isAccessible: Accessibility,
                  hasRealTimeInfo: Radio,
                  isActive: ToggleLeft,
                };
                const Icon = icons[key] || ToggleLeft;

                return (
                  <div
                    key={key}
                    onClick={() => form.setValue(key, !isChecked)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-all duration-200",
                      isChecked
                        ? "bg-emerald-50 border-emerald-300 shadow-md hover:shadow-lg hover:border-emerald-400"
                        : "bg-background border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-md transition-colors",
                        isChecked
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-sm font-medium cursor-pointer block">
                        {t(`UpdateDialog.${key}`)}
                      </Label>
                    </div>
                    <Switch
                      checked={isChecked}
                      onCheckedChange={(checked) => form.setValue(key, checked)}
                      dir={isRTL ? "rtl" : "ltr"}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("Cancel")}
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              isUploading ||
              !form.watch("nameFields")?.en?.trim()
            }
          >
            {isUploading
              ? t("Common.Uploading")
              : isSubmitting
                ? t("Common.Updating")
                : t("Common.Update")}
          </Button>
        </div>
      </form>
    </CustomDialog>
  );
};
