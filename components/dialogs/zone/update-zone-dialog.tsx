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
import { Info } from "lucide-react";
import {
  ZoneWithRelations,
  UpdateZoneData,
  updateZoneSchema,
} from "@/types/models/zone";
import { useUpdateZone } from "@/hooks/employee-hooks/use-zone";

interface UpdateZoneDialogProps {
  data: ZoneWithRelations;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const UpdateZoneDialog: FC<UpdateZoneDialogProps> = ({
  data,
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const { t, i18n } = useTranslation("Zones");
  const isRTL = i18n.language !== "en";
  const [activeTab, setActiveTab] = useState<"english" | "arabic" | "kurdish">(
    "english"
  );

  const { mutateAsync: updateZone, isPending: isSubmitting } = useUpdateZone();

  const form = useForm<UpdateZoneData>({
    resolver: zodResolver(updateZoneSchema),
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
      color: data.color ?? "#FF6B6B",
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
        color: data.color ?? "#FF6B6B",
        isActive: data.isActive ?? true,
      });
    }
  }, [data, form, isOpen]);

  const handleSubmit = async (formData: UpdateZoneData) => {
    try {
      await updateZone(formData);
      toast.success(t("Success.Updated"));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating zone:", error);
      toast.error(t("Error.UpdateFailed"));
    }
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
          <div className="space-y-2">
            <Label>{t("UpdateDialog.Color")}</Label>
            <Input
              type="color"
              value={form.watch("color") ?? "#FF6B6B"}
              onChange={(e) => form.setValue("color", e.target.value)}
            />
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
            disabled={isSubmitting || !form.watch("nameFields")?.en?.trim()}
          >
            {isSubmitting ? t("Common.Updating") : t("Common.Update")}
          </Button>
        </div>
      </form>
    </CustomDialog>
  );
};
