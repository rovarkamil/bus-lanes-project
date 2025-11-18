"use client";

import { FC, useEffect, useState } from "react";
import { useTranslation } from "@/i18n/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { LanguageTabs } from "@/components/language-tabs";
import { LanguageFields } from "@/utils/language-handler";
import { FileUploader } from "@/components/file-uploader";
import { Info } from "lucide-react";
import {
  UpdateMapIconData,
  updateMapIconSchema,
  MapIconWithRelations,
} from "@/types/models/map-icon";
import { useUpdateMapIcon } from "@/hooks/employee-hooks/use-map-icon";
import { uploadSingleImage } from "@/utils/supabase-storage-handler";
import type { UploadedFileInput } from "@/lib/helpers/file-utils";

type SelectedFileState = {
  file: File;
  url: string;
  isExisting?: boolean;
  existingMeta?: UploadedFileInput;
};

interface UpdateMapIconDialogProps {
  data: MapIconWithRelations;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const UpdateMapIconDialog: FC<UpdateMapIconDialogProps> = ({
  data,
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const { t, i18n } = useTranslation("MapIcons");
  const isRTL = i18n.language !== "en";
  const [activeTab, setActiveTab] = useState<"english" | "arabic" | "kurdish">(
    "english"
  );
  const [selectedFile, setSelectedFile] = useState<SelectedFileState | null>(
    data.file
      ? {
          file: new File([], data.file.name ?? "map-icon.png", {
            type: data.file.type ?? "image/png",
          }),
          url: data.file.url,
          isExisting: true,
          existingMeta: {
            id: data.file.id,
            url: data.file.url,
            type: data.file.type ?? undefined,
            name: data.file.name ?? undefined,
            size: data.file.size ?? undefined,
            isExisting: true,
          },
        }
      : null
  );
  const [isUploading, setIsUploading] = useState(false);

  const { mutateAsync: updateMapIcon, isPending: isSubmitting } =
    useUpdateMapIcon();

  const form = useForm<UpdateMapIconData>({
    resolver: zodResolver(updateMapIconSchema),
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
      iconSize: data.iconSize ?? 32,
      iconAnchorX: data.iconAnchorX ?? 0,
      iconAnchorY: data.iconAnchorY ?? 0,
      popupAnchorX: data.popupAnchorX ?? 0,
      popupAnchorY: data.popupAnchorY ?? 0,
      isActive: data.isActive ?? true,
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
        iconSize: data.iconSize ?? 32,
        iconAnchorX: data.iconAnchorX ?? 0,
        iconAnchorY: data.iconAnchorY ?? 0,
        popupAnchorX: data.popupAnchorX ?? 0,
        popupAnchorY: data.popupAnchorY ?? 0,
        isActive: data.isActive ?? true,
      });

      setSelectedFile(
        data.file
          ? {
              file: new File([], data.file.name ?? "map-icon.png", {
                type: data.file.type ?? "image/png",
              }),
              url: data.file.url,
              isExisting: true,
              existingMeta: {
                id: data.file.id,
                url: data.file.url,
                type: data.file.type ?? undefined,
                name: data.file.name ?? undefined,
                size: data.file.size ?? undefined,
                isExisting: true,
              },
            }
          : null
      );
    }
  }, [data, form, isOpen]);

  const handleSubmit = async (formData: UpdateMapIconData) => {
    try {
      if (!selectedFile) {
        toast.error(t("Error.FileRequired"));
        return;
      }

      setIsUploading(true);

      let filePayload: UploadedFileInput | undefined = selectedFile.isExisting
        ? selectedFile.existingMeta
        : undefined;

      if (!selectedFile.isExisting) {
        const uploaded = await uploadSingleImage(
          selectedFile.file,
          "map-icons",
          "icons"
        );
        filePayload = {
          url: uploaded.url,
          type: selectedFile.file.type,
          name: selectedFile.file.name,
          size: selectedFile.file.size,
        };
      }

      await updateMapIcon({
        ...formData,
        file: filePayload,
      });

      toast.success(t("Success.Updated"));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating map icon:", error);
      toast.error(t("Error.UpdateFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileRemove = () => {
    if (selectedFile?.url.startsWith("blob:")) {
      URL.revokeObjectURL(selectedFile.url);
    }
    setSelectedFile(null);
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
          <FileUploader
            label={t("UpdateDialog.File")}
            selectedFile={selectedFile}
            onFileSelect={(file) => {
              setSelectedFile((prev) => {
                if (prev?.url.startsWith("blob:")) {
                  URL.revokeObjectURL(prev.url);
                }
                return {
                  file,
                  url: URL.createObjectURL(file),
                  isExisting: false,
                };
              });
            }}
            onFileRemove={handleFileRemove}
            accept="image/*"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("UpdateDialog.IconSize")}</Label>
              <Input
                type="number"
                min={16}
                max={128}
                value={form.watch("iconSize") ?? 32}
                onChange={(e) =>
                  form.setValue("iconSize", Number(e.target.value) || 32)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.IconAnchorX")}</Label>
              <Input
                type="number"
                value={form.watch("iconAnchorX") ?? 0}
                onChange={(e) =>
                  form.setValue("iconAnchorX", Number(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.IconAnchorY")}</Label>
              <Input
                type="number"
                value={form.watch("iconAnchorY") ?? 0}
                onChange={(e) =>
                  form.setValue("iconAnchorY", Number(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.PopupAnchorX")}</Label>
              <Input
                type="number"
                value={form.watch("popupAnchorX") ?? 0}
                onChange={(e) =>
                  form.setValue("popupAnchorX", Number(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.PopupAnchorY")}</Label>
              <Input
                type="number"
                value={form.watch("popupAnchorY") ?? 0}
                onChange={(e) =>
                  form.setValue("popupAnchorY", Number(e.target.value) || 0)
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="text-sm font-medium">
              {t("UpdateDialog.IsActive")}
            </Label>
            <Switch
              checked={form.watch("isActive") ?? true}
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
              !form.watch("nameFields")?.en?.trim() ||
              !selectedFile
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
