"use client";

import { FC, useState } from "react";
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
  CreateMapIconData,
  createMapIconSchema,
} from "@/types/models/map-icon";
import { useCreateMapIcon } from "@/hooks/employee-hooks/use-map-icon";
import { uploadSingleImage } from "@/utils/supabase-storage-handler";

type SelectedFileState = {
  file: File;
  url: string;
};

interface CreateMapIconDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateMapIconDialog: FC<CreateMapIconDialogProps> = ({
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
    null
  );
  const [isUploading, setIsUploading] = useState(false);

  const { mutateAsync: createMapIcon, isPending: isSubmitting } =
    useCreateMapIcon();

  const form = useForm<CreateMapIconData>({
    resolver: zodResolver(createMapIconSchema),
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
      iconSize: 32,
      iconAnchorX: 16,
      iconAnchorY: 32,
      popupAnchorX: 0,
      popupAnchorY: -32,
      isActive: true,
    },
  });

  const resetState = () => {
    form.reset();
    if (selectedFile?.url.startsWith("blob:")) {
      URL.revokeObjectURL(selectedFile.url);
    }
    setSelectedFile(null);
  };

  const handleSubmit = async (formData: CreateMapIconData) => {
    try {
      if (!selectedFile) {
        toast.error(t("Error.FileRequired"));
        return;
      }

      setIsUploading(true);
      const uploaded = await uploadSingleImage(
        selectedFile.file,
        "map-icons",
        "icons"
      );

      await createMapIcon({
        ...formData,
        file: {
          url: uploaded.url,
          type: selectedFile.file.type,
          name: selectedFile.file.name,
          size: selectedFile.file.size,
        },
      });

      toast.success(t("Success.Created"));
      onOpenChange(false);
      onSuccess?.();
      resetState();
    } catch (error) {
      console.error("Error creating map icon:", error);
      toast.error(t("Error.CreateFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <CustomDialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetState();
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
          <FileUploader
            label={t("CreateDialog.File")}
            selectedFile={selectedFile}
            onFileSelect={(file) => {
              setSelectedFile((prev) => {
                if (prev?.url.startsWith("blob:")) {
                  URL.revokeObjectURL(prev.url);
                }
                return {
                  file,
                  url: URL.createObjectURL(file),
                };
              });
            }}
            onFileRemove={() => {
              if (selectedFile?.url.startsWith("blob:")) {
                URL.revokeObjectURL(selectedFile.url);
              }
              setSelectedFile(null);
            }}
            accept="image/*"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("CreateDialog.IconSize")}</Label>
              <Input
                type="number"
                min={16}
                max={128}
                value={form.watch("iconSize")}
                onChange={(e) =>
                  form.setValue("iconSize", Number(e.target.value) || 32)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("CreateDialog.IconAnchorX")}</Label>
              <Input
                type="number"
                value={form.watch("iconAnchorX")}
                onChange={(e) =>
                  form.setValue("iconAnchorX", Number(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("CreateDialog.IconAnchorY")}</Label>
              <Input
                type="number"
                value={form.watch("iconAnchorY")}
                onChange={(e) =>
                  form.setValue("iconAnchorY", Number(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("CreateDialog.PopupAnchorX")}</Label>
              <Input
                type="number"
                value={form.watch("popupAnchorX")}
                onChange={(e) =>
                  form.setValue("popupAnchorX", Number(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("CreateDialog.PopupAnchorY")}</Label>
              <Input
                type="number"
                value={form.watch("popupAnchorY")}
                onChange={(e) =>
                  form.setValue("popupAnchorY", Number(e.target.value) || 0)
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="text-sm font-medium">
              {t("CreateDialog.IsActive")}
            </Label>
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
