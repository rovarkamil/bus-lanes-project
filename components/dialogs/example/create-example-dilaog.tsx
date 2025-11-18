// This is an example of how to create a create dialog for a model.
// It is not a complete create dialog and should be used as a reference to create a new create dialog.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

"use client";

import { FC, useState } from "react";
import { useTranslation } from "@/i18n/client";
import { useCreateGallery } from "@/hooks/employee-hooks/use-galleries";
import { CreateGalleryData, createGallerySchema } from "@/types/models/gallery";
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
import { HaircutStyleCategory } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadMultipleImages } from "@/utils/supabase-storage-handler";

interface CreateGalleryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateGalleryDialog: FC<CreateGalleryDialogProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const { t, i18n } = useTranslation("Gallery");
  const isRTL = i18n.language !== "en";
  const [activeTab, setActiveTab] = useState<"english" | "arabic" | "kurdish">(
    "english"
  );
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState<
    {
      file: File;
      url: string;
      type: string;
      name: string;
      size: number;
    }[]
  >([]);

  const { mutateAsync: createGallery, isPending: isSubmitting } =
    useCreateGallery();

  const form = useForm<CreateGalleryData>({
    resolver: zodResolver(createGallerySchema),
    defaultValues: {
      titleFields: {
        en: "",
        ar: null,
        ckb: null,
      },
      descriptionFields: {
        en: "",
        ar: null,
        ckb: null,
      },
      category: HaircutStyleCategory.HAIRCUTS,
      isActive: true,
    },
  });

  const handleSubmit = async (formData: CreateGalleryData) => {
    try {
      if (images.length === 0) {
        toast.error(t("Error.ImageRequired"));
        return;
      }

      setIsUploading(true);

      // Upload images to Supabase Storage
      const uploadedImages = await uploadMultipleImages(
        images.map((img) => img.file),
        "gallery-images"
      );

      const dataToSubmit = {
        ...formData,
        titleFields: {
          en: formData.titleFields.en,
          ar: formData.titleFields.ar || null,
          ckb: formData.titleFields.ckb || null,
        },
        descriptionFields: {
          en: formData.descriptionFields?.en || "",
          ar: formData.descriptionFields?.ar || null,
          ckb: formData.descriptionFields?.ckb || null,
        },
        images: uploadedImages.map((image) => ({
          url: image.url,
          type: image.type,
          name: image.name,
          size: image.size,
        })),
      };

      await createGallery(dataToSubmit);

      toast.success(t("Success.Created"));
      onOpenChange(false);
      onSuccess?.();
      resetForm();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(t("Error.CreateFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    form.reset({
      titleFields: {
        en: "",
        ar: null,
        ckb: null,
      },
      descriptionFields: {
        en: "",
        ar: null,
        ckb: null,
      },
      category: HaircutStyleCategory.HAIRCUTS,
      isActive: true,
    });
    images.forEach((image) => {
      if (image.url.startsWith("blob:")) {
        URL.revokeObjectURL(image.url);
      }
    });
    setImages([]);
  };

  const handleImageSelect = (files: File[], urls?: string[]) => {
    const newImages = files.map((file, index) => ({
      file,
      url: urls?.[index] || URL.createObjectURL(file),
      type: file.type || "",
      name: file.name || "",
      size: file.size || 0,
    }));

    // Filter out any duplicates based on file name
    const existingFileNames = new Set(images.map((img) => img.name));
    const uniqueNewImages = newImages.filter(
      (img) => !existingFileNames.has(img.name)
    );

    setImages([...images, ...uniqueNewImages]);
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
          console.log("form", form);
          form.handleSubmit(handleSubmit)(e);
        }}
        className="space-y-6"
      >
        <LanguageTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          titleFields={form.watch("titleFields") as LanguageFields}
          onTitleChange={(fields) => form.setValue("titleFields", fields)}
          descriptionFields={form.watch("descriptionFields") as LanguageFields}
          onDescriptionChange={(fields) =>
            form.setValue("descriptionFields", fields)
          }
        />

        <div className="space-y-4">
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
                {t("Error.ImageRequired")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("CreateDialog.Category")}</Label>
            <Select
              value={form.watch("category")}
              onValueChange={(value: HaircutStyleCategory) =>
                form.setValue("category", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("CreateDialog.SelectCategory")} />
              </SelectTrigger>
              <SelectContent>
                {Object.values(HaircutStyleCategory).map((category) => (
                  <SelectItem key={category} value={category}>
                    {t(`HaircutStyleCategory.${category}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              !form.watch("titleFields.en") ||
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
