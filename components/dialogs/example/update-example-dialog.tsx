// This is an example of how to create an update dialog for a model.
// It is not a complete update dialog and should be used as a reference to create a new update dialog.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

"use client";

import { FC, useEffect, useState } from "react";
import { useTranslation } from "@/i18n/client";
import { useUpdateGallery } from "@/hooks/employee-hooks/use-galleries";
import {
  GalleryWithRelations,
  UpdateGalleryData,
  updateGallerySchema,
} from "@/types/models/gallery";
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
import {
  uploadMultipleImages,
  type UploadedFile,
} from "@/utils/supabase-storage-handler";

interface UpdateGalleryDialogProps {
  data: GalleryWithRelations;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const UpdateGalleryDialog: FC<UpdateGalleryDialogProps> = ({
  data,
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
      id?: string;
      isExisting?: boolean;
    }[]
  >(
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

  const { mutateAsync: updateGallery, isPending: isSubmitting } =
    useUpdateGallery();

  const form = useForm<UpdateGalleryData>({
    resolver: zodResolver(updateGallerySchema),
    defaultValues: {
      id: data.id,
      titleFields: {
        en: data.title?.en || "",
        ar: data.title?.ar || null,
        ckb: data.title?.ckb || null,
      },
      descriptionFields: {
        en: data.description?.en || "",
        ar: data.description?.ar || null,
        ckb: data.description?.ckb || null,
      },
      category: data.category || HaircutStyleCategory.HAIRCUTS,
      isActive: data.isActive,
      titleId: data.title?.id,
      descriptionId: data.description?.id,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        id: data.id,
        titleFields: {
          en: data.title?.en || "",
          ar: data.title?.ar || null,
          ckb: data.title?.ckb || null,
        },
        descriptionFields: {
          en: data.description?.en || "",
          ar: data.description?.ar || null,
          ckb: data.description?.ckb || null,
        },
        category: data.category || HaircutStyleCategory.HAIRCUTS,
        isActive: data.isActive,
        titleId: data.title?.id,
        descriptionId: data.description?.id,
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
    }
  }, [isOpen, data, form]);

  const handleSubmit = async (formData: UpdateGalleryData) => {
    try {
      if (images.length === 0) {
        toast.error(t("Error.ImageRequired"));
        return;
      }

      setIsUploading(true);

      // Upload only new images (non-existing ones) to Supabase Storage
      const newImages = images.filter((img) => !img.isExisting);
      let uploadedImages: UploadedFile[] = [];

      if (newImages.length > 0) {
        uploadedImages = await uploadMultipleImages(
          newImages.map((img) => img.file),
          "gallery-images"
        );
      }

      // Combine existing and newly uploaded images
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
        images: allImages,
      };

      await updateGallery(dataToSubmit);

      toast.success(t("Success.Updated"));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating gallery:", error);
      toast.error(t("Error.UpdateFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageSelect = (files: File[]) => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setImages([
      ...images,
      ...files.map((file, index) => ({
        file,
        url: urls[index],
        type: file.type || "",
        name: file.name || "",
        size: file.size || 0,
        isExisting: false,
      })),
    ]);
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
          images.forEach((image) => {
            if (image.url.startsWith("blob:")) {
              URL.revokeObjectURL(image.url);
            }
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
          titleFields={form.watch("titleFields") as LanguageFields}
          onTitleChange={(fields) => form.setValue("titleFields", fields)}
          descriptionFields={form.watch("descriptionFields") as LanguageFields}
          onDescriptionChange={(fields) =>
            form.setValue("descriptionFields", fields)
          }
        />

        <div className="space-y-4">
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
                {t("Error.ImageRequired")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("UpdateDialog.Category")}</Label>
            <Select
              value={form.watch("category")}
              onValueChange={(value: HaircutStyleCategory) =>
                form.setValue("category", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("UpdateDialog.SelectCategory")} />
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
              !form.watch("titleFields.en") ||
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
