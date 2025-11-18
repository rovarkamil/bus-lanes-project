"use client";

import { FC, useEffect, useState } from "react";
import { useTranslation } from "@/i18n/client";
import { useUpdateBusLane } from "@/hooks/employee-hooks/use-bus-lane";
import {
  BusLaneWithRelations,
  UpdateBusLaneData,
  updateBusLaneSchema,
} from "@/types/models/bus-lane";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LanguageTabs } from "@/components/language-tabs";
import { Info } from "lucide-react";
import { LanguageFields } from "@/utils/language-handler";
import { MultipleImageUploader } from "@/components/multiple-image-uploader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  uploadMultipleImages,
  type UploadedFile,
} from "@/utils/supabase-storage-handler";

type UploadedImage = {
  file: File;
  url: string;
  type: string;
  name: string;
  size: number;
  id?: string;
  isExisting?: boolean;
};

interface UpdateBusLaneDialogProps {
  data: BusLaneWithRelations;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const UpdateBusLaneDialog: FC<UpdateBusLaneDialogProps> = ({
  data,
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const { t, i18n } = useTranslation("BusLanes");
  const isRTL = i18n.language !== "en";
  const [activeTab, setActiveTab] = useState<"english" | "arabic" | "kurdish">(
    "english"
  );
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [pathInput, setPathInput] = useState(
    JSON.stringify(data.path ?? [], null, 2)
  );
  const [stopIdsInput, setStopIdsInput] = useState(
    (data.stops ?? []).map((stop) => stop.id).join(",")
  );
  const [routeIdsInput, setRouteIdsInput] = useState(
    (data.routes ?? []).map((route) => route.id).join(",")
  );

  const { mutateAsync: updateBusLane, isPending: isSubmitting } =
    useUpdateBusLane();

  const form = useForm<UpdateBusLaneData>({
    resolver: zodResolver(updateBusLaneSchema),
    defaultValues: {
      id: data.id,
      nameFields: {
        en: data.name?.en || "",
        ar: data.name?.ar || null,
        ckb: data.name?.ckb || null,
      },
      descriptionFields: {
        en: data.description?.en || "",
        ar: data.description?.ar || null,
        ckb: data.description?.ckb || null,
      },
      color: data.color ?? "#0066CC",
      weight: data.weight ?? 5,
      opacity: data.opacity ?? 0.8,
      serviceId: data.serviceId,
      isActive: data.isActive,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        id: data.id,
        nameFields: {
          en: data.name?.en || "",
          ar: data.name?.ar || null,
          ckb: data.name?.ckb || null,
        },
        descriptionFields: {
          en: data.description?.en || "",
          ar: data.description?.ar || null,
          ckb: data.description?.ckb || null,
        },
        color: data.color ?? "#0066CC",
        weight: data.weight ?? 5,
        opacity: data.opacity ?? 0.8,
        serviceId: data.serviceId,
        isActive: data.isActive,
      });

      setImages(
        data.images
          ? data.images.map((image) => ({
              file: new File([], image.name || "", {
                type: image.type || "image/jpeg",
              }),
              url: image.url,
              id: image.id,
              type: image.type || "",
              name: image.name || "",
              size: image.size || 0,
              isExisting: true,
            }))
          : []
      );

      setPathInput(JSON.stringify(data.path ?? [], null, 2));
      setStopIdsInput((data.stops ?? []).map((stop) => stop.id).join(","));
      setRouteIdsInput((data.routes ?? []).map((route) => route.id).join(","));
    }
  }, [isOpen, data, form]);

  const handleSubmit = async (formData: UpdateBusLaneData) => {
    try {
      if (!pathInput.trim()) {
        toast.error(t("UpdateDialog.PathRequired"));
        return;
      }

      setIsUploading(true);

      let parsedPath: [number, number][] = [];
      try {
        parsedPath = JSON.parse(pathInput) as [number, number][];
      } catch {
        toast.error(t("UpdateDialog.InvalidPath"));
        setIsUploading(false);
        return;
      }

      const newImages = images.filter((img) => !img.isExisting);
      let uploadedImages: UploadedFile[] = [];

      if (newImages.length > 0) {
        uploadedImages = await uploadMultipleImages(
          newImages.map((img) => img.file),
          "bus-lane-images"
        );
      }

      const allImages = [
        ...images
          .filter((img) => img.isExisting)
          .map((img) => ({
            url: img.url,
            type: img.type,
            name: img.name,
            size: img.size,
            id: img.id,
          })),
        ...uploadedImages.map((image) => ({
          url: image.url,
          type: image.type,
          name: image.name,
          size: image.size,
        })),
      ];

      const dataToSubmit = {
        ...formData,
        path: parsedPath,
        images: allImages,
        stopIds: stopIdsInput
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean),
        routeIds: routeIdsInput
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean),
        serviceId: formData.serviceId || null,
      };

      await updateBusLane(dataToSubmit);

      toast.success(t("Success.Updated"));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating bus lane:", error);
      toast.error(t("Error.UpdateFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageSelect = (files: File[], urls?: string[]) => {
    const newImages = files.map((file, index) => ({
      file,
      url: urls?.[index] || URL.createObjectURL(file),
      type: file.type || "",
      name: file.name || "",
      size: file.size || 0,
      isExisting: false,
    }));
    setImages((prev) => [...prev, ...newImages]);
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
      onOpenChange={onOpenChange}
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
          <div className="space-y-2">
            <Label>{t("UpdateDialog.PathJSON")}</Label>
            <Textarea
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              placeholder="[[36.1911,44.0092],[36.1912,44.0111]]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("UpdateDialog.Color")}</Label>
              <Input
                type="color"
                value={form.watch("color")}
                onChange={(e) => form.setValue("color", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.Weight")}</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={form.watch("weight")}
                onChange={(e) =>
                  form.setValue("weight", Number(e.target.value) || 1)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.Opacity")}</Label>
              <Input
                type="number"
                step="0.1"
                min={0.1}
                max={1}
                value={form.watch("opacity")}
                onChange={(e) =>
                  form.setValue("opacity", Number(e.target.value) || 0.8)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.ServiceId")}</Label>
              <Input
                value={form.watch("serviceId") || ""}
                onChange={(e) =>
                  form.setValue("serviceId", e.target.value || null)
                }
                placeholder="service-id"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("UpdateDialog.StopIds")}</Label>
            <Input
              value={stopIdsInput}
              onChange={(e) => setStopIdsInput(e.target.value)}
              placeholder="id-1,id-2"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("UpdateDialog.RouteIds")}</Label>
            <Input
              value={routeIdsInput}
              onChange={(e) => setRouteIdsInput(e.target.value)}
              placeholder="id-1,id-2"
            />
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
            {images.length === 0 && (
              <p className="text-sm text-destructive">
                {t("Error.ImagesRequired")}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label>{t("UpdateDialog.IsActive")}</Label>
            <Switch
              checked={form.watch("isActive")}
              onCheckedChange={(checked) => form.setValue("isActive", checked)}
              dir={isRTL ? "rtl" : "ltr"}
            />
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
              !form.watch("nameFields.en") ||
              images.length === 0
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
