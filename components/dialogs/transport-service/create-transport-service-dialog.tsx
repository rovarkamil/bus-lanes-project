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
import {
  CreateTransportServiceData,
  createTransportServiceSchema,
} from "@/types/models/transport-service";
import { useCreateTransportService } from "@/hooks/employee-hooks/use-transport-service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransportServiceType } from "@prisma/client";
import SelectWithPagination from "@/components/select-with-pagination";
import { useFetchMapIcons } from "@/hooks/employee-hooks/use-map-icon";

interface CreateTransportServiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateTransportServiceDialog: FC<
  CreateTransportServiceDialogProps
> = ({ isOpen, onOpenChange, onSuccess }) => {
  const { t, i18n } = useTranslation("TransportServices");
  const isRTL = i18n.language !== "en";
  const [activeTab, setActiveTab] = useState<"english" | "arabic" | "kurdish">(
    "english"
  );

  const { mutateAsync: createTransportService, isPending: isSubmitting } =
    useCreateTransportService();

  const form = useForm<CreateTransportServiceData>({
    resolver: zodResolver(createTransportServiceSchema),
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
      type: TransportServiceType.BUS,
      color: "#0066CC",
      iconId: null,
      capacity: undefined,
      operatingFrom: undefined,
      operatingTo: undefined,
      isActive: true,
    },
  });

  const resetState = () => {
    form.reset();
  };

  const handleSubmit = async (formData: CreateTransportServiceData) => {
    try {
      await createTransportService({
        ...formData,
        iconId: formData.iconId || null,
        capacity:
          formData.capacity === undefined || formData.capacity === null
            ? undefined
            : Number(formData.capacity),
      });

      toast.success(t("Success.Created"));
      onOpenChange(false);
      onSuccess?.();
      resetState();
    } catch (error) {
      console.error("Error creating transport service:", error);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("CreateDialog.Type")}</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(value: TransportServiceType) =>
                  form.setValue("type", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("CreateDialog.Type")} />
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
              <Label>{t("CreateDialog.Color")}</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={form.watch("color")}
                  onChange={(e) => form.setValue("color", e.target.value)}
                  className="h-10 w-16 rounded-md border"
                />
                <Input
                  value={form.watch("color")}
                  onChange={(e) => form.setValue("color", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("CreateDialog.MapIcon")}</Label>
              <SelectWithPagination
                fetchFunction={useFetchMapIcons}
                fields={[
                  {
                    key: "name",
                    label: t("Common.Name"),
                    type: "relation",
                    relationKey: "en",
                  },
                  {
                    key: "iconSize",
                    label: t("Common.Size"),
                    type: "number",
                  },
                ]}
                onSelect={(item) => form.setValue("iconId", item?.id ?? null)}
                placeholder={t("Table.ClickToSelectIcon")}
                canClear
                value={form.watch("iconId") ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("CreateDialog.Capacity")}</Label>
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
              <Label>{t("CreateDialog.OperatingFrom")}</Label>
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
              <Label>{t("CreateDialog.OperatingTo")}</Label>
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
