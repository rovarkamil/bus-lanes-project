"use client";

import { FC, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { uploadMultipleImages } from "@/utils/supabase-storage-handler";

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
  const [pathInput, setPathInput] = useState("");
  const [stopIdsInput, setStopIdsInput] = useState("");
  const [routeIdsInput, setRouteIdsInput] = useState("");

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
    },
  });

  const handleSubmit = async (formData: CreateBusLaneData) => {
    try {
      if (!pathInput.trim()) {
        toast.error(t("CreateDialog.PathRequired"));
        return;
      }

      setIsUploading(true);

      let parsedPath: [number, number][] = [];
      try {
        parsedPath = JSON.parse(pathInput) as [number, number][];
      } catch {
        toast.error(t("CreateDialog.InvalidPath"));
        setIsUploading(false);
        return;
      }

      const uploadedImages = await uploadMultipleImages(
        images.map((img) => img.file),
        "bus-lane-images"
      );

      const dataToSubmit = {
        ...formData,
        path: parsedPath,
        images: uploadedImages.map((image) => ({
          url: image.url,
          type: image.type,
          name: image.name,
          size: image.size,
        })),
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
    setPathInput("");
    setStopIdsInput("");
    setRouteIdsInput("");
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
          <div className="space-y-2">
            <Label>{t("CreateDialog.PathJSON")}</Label>
            <Textarea
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              placeholder="[[36.1911,44.0092],[36.1912,44.0111]]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("CreateDialog.Color")}</Label>
              <Input
                type="color"
                value={form.watch("color")}
                onChange={(e) => form.setValue("color", e.target.value)}
              />
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
              <Label>{t("CreateDialog.ServiceId")}</Label>
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
            <Label>{t("CreateDialog.StopIds")}</Label>
            <Input
              value={stopIdsInput}
              onChange={(e) => setStopIdsInput(e.target.value)}
              placeholder="id-1,id-2"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("CreateDialog.RouteIds")}</Label>
            <Input
              value={routeIdsInput}
              onChange={(e) => setRouteIdsInput(e.target.value)}
              placeholder="id-1,id-2"
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
                ? t("Common.Creating")
                : t("Common.Create")}
          </Button>
        </div>
      </form>
    </CustomDialog>
  );
};
