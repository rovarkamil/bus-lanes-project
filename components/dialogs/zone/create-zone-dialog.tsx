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
import { Info } from "lucide-react";
import { CreateZoneData, createZoneSchema } from "@/types/models/zone";
import { useCreateZone } from "@/hooks/employee-hooks/use-zone";

interface CreateZoneDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateZoneDialog: FC<CreateZoneDialogProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const { t, i18n } = useTranslation("Zones");
  const isRTL = i18n.language !== "en";
  const [activeTab, setActiveTab] = useState<"english" | "arabic" | "kurdish">(
    "english"
  );

  const { mutateAsync: createZone, isPending: isSubmitting } = useCreateZone();

  const form = useForm<CreateZoneData>({
    resolver: zodResolver(createZoneSchema),
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
      color: "#FF6B6B",
      isActive: true,
    },
  });

  const resetState = () => {
    form.reset();
  };

  const handleSubmit = async (formData: CreateZoneData) => {
    try {
      await createZone(formData);
      toast.success(t("Success.Created"));
      onOpenChange(false);
      onSuccess?.();
      resetState();
    } catch (error) {
      console.error("Error creating zone:", error);
      toast.error(t("Error.CreateFailed"));
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
          <div className="space-y-2">
            <Label>{t("CreateDialog.Color")}</Label>
            <Input
              type="color"
              value={form.watch("color")}
              onChange={(e) => form.setValue("color", e.target.value)}
            />
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
            disabled={isSubmitting || !form.watch("nameFields").en.trim()}
          >
            {isSubmitting ? t("Common.Creating") : t("Common.Create")}
          </Button>
        </div>
      </form>
    </CustomDialog>
  );
};
