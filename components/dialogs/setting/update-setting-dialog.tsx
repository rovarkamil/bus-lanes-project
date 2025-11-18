"use client";

import { useTranslation } from "@/i18n/client";
import { Settings, Key, FileText, Type } from "lucide-react";
import { useUpdateSetting } from "@/hooks/employee-hooks/use-settings";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  UpdateSettingData,
  updateSettingSchema,
  UpdateSettingDialogProps,
  getSettingTranslations,
} from "@/types/models/setting";
import { SettingType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/error-message";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";

export const UpdateSettingDialog = ({
  isOpen,
  onOpenChange,
  onSuccess,
  data,
}: UpdateSettingDialogProps) => {
  const { t, i18n } = useTranslation("Settings");
  const isRTL = i18n.language !== "en";
  const { t: tValidation } = useTranslation("Validation");
  const { t: tFields } = useTranslation("Fields");
  const { mutate: updateSetting, isPending: isSubmitting } = useUpdateSetting();

  const form = useForm<UpdateSettingData>({
    resolver: zodResolver(updateSettingSchema),
    defaultValues: {
      id: data?.id || "",
      key: data?.key || "",
      value: data?.value || "",
      type: data?.type || SettingType.STRING,
    },
  });

  useEffect(() => {
    if (data) {
      form.reset(data);
    }
  }, [data, form]);

  const handleSubmit = async (formData: UpdateSettingData) => {
    try {
      await updateSetting(
        {
          ...formData,
          id: data.id,
        },
        {
          onSuccess: () => {
            toast.success(t("Success.Updated"));
            onSuccess?.();
            form.reset();
            onOpenChange(false);
          },
        }
      );
    } catch (error) {
      console.error(error);
    }
  };

  const translations = getSettingTranslations(t, tValidation, tFields);

  return (
    <CustomDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      icon={Settings}
      title={t("UpdateDialog.Title")}
      description={t("UpdateDialog.Description")}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("Cancel")}
          </Button>
          <Button type="submit" form="updateForm" disabled={isSubmitting}>
            {isSubmitting ? t("Submitting") : t("Submit")}
          </Button>
        </>
      }
      rtl={isRTL}
    >
      <form
        id="updateForm"
        onSubmit={form.handleSubmit(handleSubmit)}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="key" className="text-sm flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                {t("UpdateDialog.Key")}
              </Label>
              <Input
                id="key"
                className="h-10"
                placeholder={t("UpdateDialog.KeyPlaceholder")}
                {...form.register("key")}
              />
              {form.formState.errors.key && (
                <p className="text-sm text-destructive">
                  {getErrorMessage(form.formState.errors.key, translations)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm flex items-center gap-2">
                <Type className="h-4 w-4 text-primary" />
                {t("UpdateDialog.Type")}
              </Label>
              <Select
                value={form.watch("type")}
                onValueChange={(value) =>
                  form.setValue("type", value as SettingType)
                }
                dir={isRTL ? "rtl" : "ltr"}
              >
                <SelectTrigger dir={isRTL ? "rtl" : "ltr"}>
                  <SelectValue
                    placeholder={t("UpdateDialog.TypePlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent dir={isRTL ? "rtl" : "ltr"}>
                  {(Object.values(SettingType) as SettingType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`Types.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.type && (
                <p className="text-sm text-destructive">
                  {getErrorMessage(form.formState.errors.type, translations)}
                </p>
              )}
            </div>

            <div className="space-y-2 col-span-2" dir={isRTL ? "rtl" : "ltr"}>
              <Label
                htmlFor="value"
                className="text-sm flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-primary" />
                {t("UpdateDialog.Value")}
              </Label>
              <Input
                id="value"
                className="h-10"
                placeholder={t("UpdateDialog.ValuePlaceholder")}
                {...form.register("value")}
              />
              {form.formState.errors.value && (
                <p className="text-sm text-destructive">
                  {getErrorMessage(form.formState.errors.value, translations)}
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </CustomDialog>
  );
};
