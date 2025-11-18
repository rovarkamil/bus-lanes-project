"use client";

import { FC, useEffect, useState } from "react";
import { useTranslation } from "@/i18n/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Info } from "lucide-react";
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
  const [laneIdsInput, setLaneIdsInput] = useState(
    (stop.lanes ?? []).map((lane) => lane.id).join(",")
  );
  const [routeIdsInput, setRouteIdsInput] = useState(
    (stop.routes ?? []).map((route) => route.id).join(",")
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

      setLaneIdsInput((stop.lanes ?? []).map((lane) => lane.id).join(","));
      setRouteIdsInput((stop.routes ?? []).map((route) => route.id).join(","));

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

      const parsedLaneIds = laneIdsInput
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const parsedRouteIds = routeIdsInput
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      await updateBusStop({
        ...formData,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        order:
          formData.order === undefined || formData.order === null
            ? undefined
            : Number(formData.order),
        iconId: formData.iconId || null,
        zoneId: formData.zoneId || null,
        images: combinedImages,
        laneIds: parsedLaneIds.length ? parsedLaneIds : undefined,
        routeIds: parsedRouteIds.length ? parsedRouteIds : undefined,
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
              <Input
                value={form.watch("zoneId") ?? ""}
                onChange={(e) =>
                  form.setValue("zoneId", e.target.value || null)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.IconId")}</Label>
              <Input
                value={form.watch("iconId") ?? ""}
                onChange={(e) =>
                  form.setValue("iconId", e.target.value || null)
                }
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
              <Input
                value={laneIdsInput}
                onChange={(e) => setLaneIdsInput(e.target.value)}
                placeholder="lane-id-1,lane-id-2"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.RouteIds")}</Label>
              <Input
                value={routeIdsInput}
                onChange={(e) => setRouteIdsInput(e.target.value)}
                placeholder="route-id-1,route-id-2"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BOOLEAN_FIELDS.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <Label className="text-sm font-medium">
                  {t(`UpdateDialog.${key}`)}
                </Label>
                <Switch
                  checked={Boolean(form.watch(key))}
                  onCheckedChange={(checked) => form.setValue(key, checked)}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            ))}
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
