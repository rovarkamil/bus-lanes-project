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
import {
  uploadMultipleImages,
  type UploadedFile,
} from "@/utils/supabase-storage-handler";
import SelectWithPagination from "@/components/select-with-pagination";
import MultipleSelectWithPagination from "@/components/multiple-select-with-pagination";
import { useFetchTransportServices } from "@/hooks/employee-hooks/use-transport-service";
import { useFetchBusRoutes } from "@/hooks/employee-hooks/use-bus-route";
import { CoordinateTuple } from "@/types/map";
import {
  MapLinesDialog,
  type MapLinesDialogResult,
} from "@/components/dialogs/map/map-lines-dialog";

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

type SelectableEntity = { id: string; [key: string]: unknown };

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

  const parsePathPoints = (value: unknown): CoordinateTuple[] =>
    Array.isArray(value) ? (value as CoordinateTuple[]) : [];

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [pathPoints, setPathPoints] = useState<CoordinateTuple[]>(
    parsePathPoints(data.path)
  );
  const [mapDraftStops, setMapDraftStops] = useState<
    MapLinesDialogResult["draftStops"]
  >([]);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [selectedRoutes, setSelectedRoutes] = useState<SelectableEntity[]>(
    data.routes ?? []
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
      path: parsePathPoints(data.path),
      draftStops: [],
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

      setPathPoints(parsePathPoints(data.path));
      setMapDraftStops([]);
      setSelectedRoutes(data.routes ?? []);
      setIsMapDialogOpen(false);
    }
  }, [isOpen, data, form]);

  const handleSubmit = async (formData: UpdateBusLaneData) => {
    try {
      if (pathPoints.length < 2) {
        toast.error(t("UpdateDialog.PathRequired"));
        return;
      }

      setIsUploading(true);

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
        path: pathPoints,
        images: allImages,
        routeIds: selectedRoutes.map((route) => route.id),
        draftStops: mapDraftStops,
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

  useEffect(() => {
    form.setValue("path", pathPoints as UpdateBusLaneData["path"], {
      shouldValidate: true,
    });
  }, [pathPoints, form]);

  useEffect(() => {
    form.setValue(
      "draftStops",
      mapDraftStops as UpdateBusLaneData["draftStops"],
      { shouldValidate: true }
    );
  }, [mapDraftStops, form]);

  return (
    <>
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
            descriptionFields={
              form.watch("descriptionFields") as LanguageFields
            }
            onDescriptionChange={(fields: LanguageFields) =>
              form.setValue("descriptionFields", fields)
            }
          />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("UpdateDialog.PathJSON")}</Label>
              <div className="space-y-3 rounded-lg border border-dashed border-border/60 bg-muted/30 p-4">
                <div>
                  <p className="text-sm font-medium">
                    {pathPoints.length
                      ? t("MapDialog.PathSummary", { count: pathPoints.length })
                      : t("MapDialog.NoPath")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("MapDialog.SummaryHelper")}
                  </p>
                </div>
                {pathPoints.length > 0 && (
                  <pre className="max-h-48 overflow-auto rounded-md bg-background p-2 text-xs">
                    {JSON.stringify(pathPoints, null, 2)}
                  </pre>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMapDialogOpen(true)}
                  className="w-full"
                >
                  {pathPoints.length
                    ? t("MapDialog.EditPath")
                    : t("MapDialog.OpenBuilder")}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("UpdateDialog.Color")}</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={form.watch("color")}
                    onChange={(e) => form.setValue("color", e.target.value)}
                    className="h-10 w-16 rounded-md border"
                  />
                  <Input
                    value={form.watch("color")}
                    onChange={(e) => form.setValue("color", e.target.value)}
                    className="flex-1"
                  />
                </div>
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
                <Label>{t("UpdateDialog.TransportService")}</Label>
                <SelectWithPagination
                  fetchFunction={useFetchTransportServices}
                  fields={[
                    {
                      key: "name",
                      label: t("Common.Name"),
                      type: "relation",
                      relationKey: "en",
                    },
                    {
                      key: "type",
                      label: t("Table.ServiceType"),
                    },
                  ]}
                  onSelect={(item) =>
                    form.setValue("serviceId", (item?.id as string) ?? null)
                  }
                  placeholder={t("SelectTransportService")}
                  canClear
                  value={form.watch("serviceId") ?? ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("UpdateDialog.Routes")}</Label>
              <MultipleSelectWithPagination
                fetchFunction={useFetchBusRoutes}
                fields={[
                  {
                    key: "routeNumber",
                    label: t("Table.RouteNumber"),
                  },
                  {
                    key: "name",
                    label: t("Common.Name"),
                    type: "relation",
                    relationKey: "en",
                  },
                ]}
                onSelect={(items) => setSelectedRoutes(items)}
                placeholder={t("SelectRoutes")}
                defaultValue={selectedRoutes}
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
                onCheckedChange={(checked) =>
                  form.setValue("isActive", checked)
                }
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

      <MapLinesDialog
        isOpen={isMapDialogOpen}
        onOpenChange={setIsMapDialogOpen}
        onApply={(result) => {
          setPathPoints(result.path);
          setMapDraftStops(result.draftStops);
          form.setValue("color", result.color);
          form.setValue("weight", result.weight);
          form.setValue("opacity", result.opacity);
          setIsMapDialogOpen(false);
        }}
        initialPath={pathPoints}
        initialDraftStops={mapDraftStops}
        initialColor={form.watch("color")}
        initialWeight={form.watch("weight")}
        initialOpacity={form.watch("opacity")}
        referenceLanes={[]}
        referenceRoutes={[]}
        referenceStops={[]}
        isSubmitting={isSubmitting || isUploading}
      />
    </>
  );
};
