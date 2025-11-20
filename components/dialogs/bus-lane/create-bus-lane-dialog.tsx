"use client";

import { FC, useEffect, useState } from "react";
import { useTranslation } from "@/i18n/client";
import { useCreateBusLane } from "@/hooks/employee-hooks/use-bus-lane";
import {
  CreateBusLaneData,
  createBusLaneSchema,
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
import { uploadMultipleImages } from "@/utils/supabase-storage-handler";
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
};

interface CreateBusLaneDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type SelectableEntity = { id: string; [key: string]: unknown };

export const CreateBusLaneDialog: FC<CreateBusLaneDialogProps> = ({
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
  const [pathPoints, setPathPoints] = useState<CoordinateTuple[]>([]);
  const [mapDraftStops, setMapDraftStops] = useState<
    MapLinesDialogResult["draftStops"]
  >([]);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [selectedRoutes, setSelectedRoutes] = useState<SelectableEntity[]>([]);

  const { mutateAsync: createBusLane, isPending: isSubmitting } =
    useCreateBusLane();

  const form = useForm<CreateBusLaneData>({
    resolver: zodResolver(createBusLaneSchema),
    defaultValues: {
      nameFields: {
        en: "",
        ar: null,
        ckb: null,
      },
      descriptionFields: {
        en: "",
        ar: null,
        ckb: null,
      },
      color: "#0066CC",
      weight: 5,
      opacity: 0.8,
      serviceId: null,
      isActive: true,
      path: [],
      draftStops: [],
    },
  });

  const handleSubmit = async (formData: CreateBusLaneData) => {
    try {
      if (pathPoints.length < 2) {
        toast.error(t("CreateDialog.PathRequired"));
        return;
      }

      setIsUploading(true);

      const uploadedImages = await uploadMultipleImages(
        images.map((img) => img.file),
        "bus-lane-images"
      );

      const dataToSubmit = {
        ...formData,
        path: pathPoints,
        images: uploadedImages.map((image) => ({
          url: image.url,
          type: image.type,
          name: image.name,
          size: image.size,
        })),
        routeIds: selectedRoutes.map((route) => route.id),
        draftStops: mapDraftStops,
        serviceId: formData.serviceId || null,
      };

      await createBusLane(dataToSubmit);

      toast.success(t("Success.Created"));
      onOpenChange(false);
      onSuccess?.();
      resetForm();
    } catch (error) {
      console.error("Error submitting bus lane:", error);
      toast.error(t("Error.CreateFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    form.reset();
    images.forEach((image) => {
      if (image.url.startsWith("blob:")) {
        URL.revokeObjectURL(image.url);
      }
    });
    setImages([]);
    setPathPoints([]);
    setMapDraftStops([]);
    setSelectedRoutes([]);
    setIsMapDialogOpen(false);
  };

  const handleImageSelect = (files: File[], urls?: string[]) => {
    const newImages = files.map((file, index) => ({
      file,
      url: urls?.[index] || URL.createObjectURL(file),
      type: file.type || "",
      name: file.name || "",
      size: file.size || 0,
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
    form.setValue("path", pathPoints as CreateBusLaneData["path"], {
      shouldValidate: true,
    });
  }, [pathPoints, form]);

  useEffect(() => {
    form.setValue(
      "draftStops",
      mapDraftStops as CreateBusLaneData["draftStops"],
      { shouldValidate: true }
    );
  }, [mapDraftStops, form]);

  return (
    <>
      <CustomDialog
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetForm();
          }
          onOpenChange(open);
        }}
        title={t("CreateDialog.Title")}
        description={t("CreateDialog.Description")}
        rtl={isRTL}
        icon={Info}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit(handleSubmit)(e);
          }}
          className="space-y-6"
        >
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
              <Label>{t("CreateDialog.PathJSON")}</Label>
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
                <Label>{t("CreateDialog.Color")}</Label>
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
                <Label>{t("CreateDialog.Weight")}</Label>
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
                <Label>{t("CreateDialog.Opacity")}</Label>
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
                <Label>{t("CreateDialog.TransportService")}</Label>
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
                    form.setValue("serviceId", item?.id ?? null)
                  }
                  placeholder={t("SelectTransportService")}
                  canClear
                  value={form.watch("serviceId") ?? ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("CreateDialog.Routes")}</Label>
              <MultipleSelectWithPagination
                fetchFunction={useFetchBusRoutes}
                fields={[
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
              <Label>{t("CreateDialog.Images")}</Label>
              <MultipleImageUploader
                onImagesSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
                selectedImages={images}
                maxSize={5 * 1024 * 1024}
                label={t("CreateDialog.Images")}
              />
              {images.length === 0 && (
                <p className="text-sm text-destructive">
                  {t("Error.ImagesRequired")}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label>{t("CreateDialog.IsActive")}</Label>
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
                  ? t("Common.Creating")
                  : t("Common.Create")}
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
