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
  TransportServiceWithRelations,
  UpdateTransportServiceData,
  updateTransportServiceSchema,
} from "@/types/models/transport-service";
import { useUpdateTransportService } from "@/hooks/employee-hooks/use-transport-service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransportServiceType } from "@prisma/client";

interface UpdateTransportServiceDialogProps {
  data: TransportServiceWithRelations;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const UpdateTransportServiceDialog: FC<
  UpdateTransportServiceDialogProps
> = ({ data, isOpen, onOpenChange, onSuccess }) => {
  const { t, i18n } = useTranslation("TransportServices");
  const isRTL = i18n.language !== "en";
  const [activeTab, setActiveTab] = useState<"english" | "arabic" | "kurdish">(
    "english"
  );

  const { mutateAsync: updateTransportService, isPending: isSubmitting } =
    useUpdateTransportService();

  const form = useForm<UpdateTransportServiceData>({
    resolver: zodResolver(updateTransportServiceSchema),
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
      type: data.type ?? TransportServiceType.BUS,
      color: data.color ?? "#0066CC",
      iconId: data.iconId,
      capacity: data.capacity ?? undefined,
      operatingFrom: data.operatingFrom ?? undefined,
      operatingTo: data.operatingTo ?? undefined,
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
        type: data.type ?? TransportServiceType.BUS,
        color: data.color ?? "#0066CC",
        iconId: data.iconId,
        capacity: data.capacity ?? undefined,
        operatingFrom: data.operatingFrom ?? undefined,
        operatingTo: data.operatingTo ?? undefined,
        isActive: data.isActive ?? true,
      });
    }
  }, [data, form, isOpen]);

  const handleSubmit = async (formData: UpdateTransportServiceData) => {
    try {
      await updateTransportService({
        ...formData,
        iconId: formData.iconId || null,
        capacity:
          formData.capacity === undefined || formData.capacity === null
            ? undefined
            : Number(formData.capacity),
      });

      toast.success(t("Success.Updated"));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating transport service:", error);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("UpdateDialog.Type")}</Label>
              <Select
                value={form.watch("type") ?? TransportServiceType.BUS}
                onValueChange={(value: TransportServiceType) =>
                  form.setValue("type", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("UpdateDialog.Type")} />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TransportServiceType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`TransportServiceType.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.Color")}</Label>
              <Input
                type="color"
                value={form.watch("color") ?? "#0066CC"}
                onChange={(e) => form.setValue("color", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.IconId")}</Label>
              <Input
                value={form.watch("iconId") ?? ""}
                onChange={(e) =>
                  form.setValue("iconId", e.target.value || null)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.Capacity")}</Label>
              <Input
                type="number"
                min={0}
                value={form.watch("capacity") ?? ""}
                onChange={(e) =>
                  form.setValue(
                    "capacity",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.OperatingFrom")}</Label>
              <Input
                type="time"
                value={form.watch("operatingFrom") ?? ""}
                onChange={(e) =>
                  form.setValue(
                    "operatingFrom",
                    e.target.value === "" ? undefined : e.target.value
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.OperatingTo")}</Label>
              <Input
                type="time"
                value={form.watch("operatingTo") ?? ""}
                onChange={(e) =>
                  form.setValue(
                    "operatingTo",
                    e.target.value === "" ? undefined : e.target.value
                  )
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
            disabled={isSubmitting || !form.watch("nameFields")?.en?.trim()}
          >
            {isSubmitting ? t("Common.Updating") : t("Common.Update")}
          </Button>
        </div>
      </form>
    </CustomDialog>
  );
};


