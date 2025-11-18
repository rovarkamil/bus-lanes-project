"use client";

import { FC, useState } from "react";
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
import { useCreateBusStop } from "@/hooks/employee-hooks/use-bus-stop";
import {
  CreateBusStopData,
  createBusStopSchema,
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
};

interface CreateBusStopDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateBusStopDialog: FC<CreateBusStopDialogProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const { t, i18n } = useTranslation("BusStops");
  const isRTL = i18n.language !== "en";
  const [activeTab, setActiveTab] = useState<"english" | "arabic" | "kurdish">(
    "english"
  );
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [laneIdsInput, setLaneIdsInput] = useState("");
  const [routeIdsInput, setRouteIdsInput] = useState("");

  const { mutateAsync: createBusStop, isPending: isSubmitting } =
    useCreateBusStop();

  const form = useForm<CreateBusStopData>({
    resolver: zodResolver(createBusStopSchema),
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
      latitude: 36.1911,
      longitude: 44.0092,
      iconId: null,
      zoneId: null,
      hasShelter: false,
      hasBench: false,
      hasLighting: false,
      isAccessible: false,
      hasRealTimeInfo: false,
      order: undefined,
      isActive: true,
    },
  });

  type BusStopCreateToggleField =
    | "hasShelter"
    | "hasBench"
    | "hasLighting"
    | "isAccessible"
    | "hasRealTimeInfo"
    | "isActive";

  const BOOLEAN_FIELDS: BusStopCreateToggleField[] = [
    "hasShelter",
    "hasBench",
    "hasLighting",
    "isAccessible",
    "hasRealTimeInfo",
    "isActive",
  ];

  const handleSubmit = async (formData: CreateBusStopData) => {
    try {
      if (!formData.nameFields.en.trim()) {
        toast.error(t("Error.NameRequired"));
        return;
      }

      setIsUploading(true);

      let uploadedImages: UploadedFile[] = [];
      if (images.length > 0) {
        uploadedImages = await uploadMultipleImages(
          images.map((img) => img.file),
          "bus-stop-images"
        );
      }

      const parsedLaneIds = laneIdsInput
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const parsedRouteIds = routeIdsInput
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      const payload: CreateBusStopData = {
        ...formData,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        order:
          formData.order === undefined || formData.order === null
            ? undefined
            : Number(formData.order),
        images: uploadedImages.map((image) => ({
          url: image.url,
          type: image.type,
          name: image.name,
          size: image.size,
        })),
        iconId: formData.iconId || null,
        zoneId: formData.zoneId || null,
        laneIds: parsedLaneIds.length ? parsedLaneIds : undefined,
        routeIds: parsedRouteIds.length ? parsedRouteIds : undefined,
      };

      await createBusStop(payload);

      toast.success(t("Success.Created"));
      onOpenChange(false);
      onSuccess?.();
      resetForm();
    } catch (error) {
      console.error("Error creating bus stop:", error);
      toast.error(t("Error.CreateFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setImages([]);
    setLaneIdsInput("");
    setRouteIdsInput("");
  };

  const handleImageSelect = (files: File[], urls?: string[]) => {
    const newImages = files.map((file, index) => ({
      file,
      url: urls?.[index] ?? URL.createObjectURL(file),
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

  return (
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
          descriptionFields={form.watch("descriptionFields") as LanguageFields}
          onDescriptionChange={(fields: LanguageFields) =>
            form.setValue("descriptionFields", fields)
          }
        />

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("CreateDialog.Latitude")}</Label>
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
              <Label>{t("CreateDialog.Longitude")}</Label>
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
              <Label>{t("CreateDialog.ZoneId")}</Label>
              <Input
                value={form.watch("zoneId") ?? ""}
                onChange={(e) =>
                  form.setValue("zoneId", e.target.value || null)
                }
                placeholder="zone-id"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("CreateDialog.IconId")}</Label>
              <Input
                value={form.watch("iconId") ?? ""}
                onChange={(e) =>
                  form.setValue("iconId", e.target.value || null)
                }
                placeholder="icon-id"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("CreateDialog.Order")}</Label>
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
              <Label>{t("CreateDialog.LaneIds")}</Label>
              <Input
                value={laneIdsInput}
                onChange={(e) => setLaneIdsInput(e.target.value)}
                placeholder="lane-id-1,lane-id-2"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("CreateDialog.RouteIds")}</Label>
              <Input
                value={routeIdsInput}
                onChange={(e) => setRouteIdsInput(e.target.value)}
                placeholder="route-id-1,route-id-2"
              />
            </div>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BOOLEAN_FIELDS.map((key) => (
              <div
                key={key.toString()}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <Label className="text-sm font-medium">
                  {t(`CreateDialog.${key.toString()}`)}
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
              isSubmitting || isUploading || !form.watch("nameFields").en.trim()
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
  );
};
