"use client";

import { FC, useEffect, useState } from "react";
import { useTranslation } from "@/i18n/client";
import { useUpdateBusRoute } from "@/hooks/employee-hooks/use-bus-route";
import {
  BusRouteWithRelations,
  UpdateBusRouteData,
  updateBusRouteSchema,
} from "@/types/models/bus-route";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Currency, RouteDirection } from "@prisma/client";

interface UpdateBusRouteDialogProps {
  data: BusRouteWithRelations;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const UpdateBusRouteDialog: FC<UpdateBusRouteDialogProps> = ({
  data,
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const { t, i18n } = useTranslation("BusRoutes");
  const isRTL = i18n.language !== "en";
  const [activeTab, setActiveTab] = useState<"english" | "arabic" | "kurdish">(
    "english"
  );
  const [laneIdsInput, setLaneIdsInput] = useState(
    (data.lanes ?? []).map((lane) => lane.id).join(",")
  );
  const [stopIdsInput, setStopIdsInput] = useState(
    (data.stops ?? []).map((stop) => stop.id).join(",")
  );

  const { mutateAsync: updateRoute, isPending: isSubmitting } =
    useUpdateBusRoute();

  const form = useForm<UpdateBusRouteData>({
    resolver: zodResolver(updateBusRouteSchema),
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
      serviceId: data.serviceId,
      routeNumber: data.routeNumber ?? "",
      direction: data.direction ?? RouteDirection.BIDIRECTIONAL,
      currency: data.currency ?? Currency.IQD,
      fare: data.fare ?? undefined,
      frequency: data.frequency ?? undefined,
      duration: data.duration ?? undefined,
      laneIds: (data.lanes ?? []).map((lane) => lane.id),
      stopIds: (data.stops ?? []).map((stop) => stop.id),
      isActive: data.isActive,
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
        serviceId: data.serviceId,
        routeNumber: data.routeNumber ?? "",
        direction: data.direction ?? RouteDirection.BIDIRECTIONAL,
        currency: data.currency ?? Currency.IQD,
        fare: data.fare ?? undefined,
        frequency: data.frequency ?? undefined,
        duration: data.duration ?? undefined,
        laneIds: (data.lanes ?? []).map((lane) => lane.id),
        stopIds: (data.stops ?? []).map((stop) => stop.id),
        isActive: data.isActive,
      });

      setLaneIdsInput((data.lanes ?? []).map((lane) => lane.id).join(","));
      setStopIdsInput((data.stops ?? []).map((stop) => stop.id).join(","));
    }
  }, [isOpen, data, form]);

  const handleSubmit = async (formData: UpdateBusRouteData) => {
    try {
      const laneIds = laneIdsInput
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      const stopIds = stopIdsInput
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      const dataToSubmit: UpdateBusRouteData = {
        ...formData,
        serviceId: formData.serviceId || null,
        fare:
          formData.fare === undefined || formData.fare === null
            ? undefined
            : Number(formData.fare),
        frequency:
          formData.frequency === undefined || formData.frequency === null
            ? undefined
            : Number(formData.frequency),
        duration:
          formData.duration === undefined || formData.duration === null
            ? undefined
            : Number(formData.duration),
        laneIds: laneIds.length ? laneIds : undefined,
        stopIds: stopIds.length ? stopIds : undefined,
        routeNumber: formData.routeNumber || undefined,
      };

      await updateRoute(dataToSubmit);

      toast.success(t("Success.Updated"));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating bus route:", error);
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
              <Label>{t("UpdateDialog.ServiceId")}</Label>
              <Input
                value={form.watch("serviceId") || ""}
                onChange={(e) =>
                  form.setValue("serviceId", e.target.value || null)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.RouteNumber")}</Label>
              <Input
                value={form.watch("routeNumber") || ""}
                onChange={(e) =>
                  form.setValue("routeNumber", e.target.value || undefined)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.Direction")}</Label>
              <Select
                value={form.watch("direction")}
                onValueChange={(value: RouteDirection) =>
                  form.setValue("direction", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("UpdateDialog.Direction")} />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(RouteDirection).map((direction) => (
                    <SelectItem key={direction} value={direction}>
                      {t(`RouteDirection.${direction}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.Currency")}</Label>
              <Select
                value={form.watch("currency")}
                onValueChange={(value: Currency) =>
                  form.setValue("currency", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("UpdateDialog.Currency")} />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Currency).map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {t(`Currency.${currency}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.Fare")}</Label>
              <Input
                type="number"
                min={0}
                value={form.watch("fare") ?? ""}
                onChange={(e) =>
                  form.setValue(
                    "fare",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.Frequency")}</Label>
              <Input
                type="number"
                min={1}
                value={form.watch("frequency") ?? ""}
                onChange={(e) =>
                  form.setValue(
                    "frequency",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.Duration")}</Label>
              <Input
                type="number"
                min={1}
                value={form.watch("duration") ?? ""}
                onChange={(e) =>
                  form.setValue(
                    "duration",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("UpdateDialog.LaneIds")}</Label>
            <Input
              value={laneIdsInput}
              onChange={(e) => setLaneIdsInput(e.target.value)}
              placeholder="lane-id-1,lane-id-2"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("UpdateDialog.StopIds")}</Label>
            <Input
              value={stopIdsInput}
              onChange={(e) => setStopIdsInput(e.target.value)}
              placeholder="stop-id-1,stop-id-2"
            />
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
            disabled={isSubmitting || !form.watch("nameFields.en")}
          >
            {isSubmitting ? t("Common.Updating") : t("Common.Update")}
          </Button>
        </div>
      </form>
    </CustomDialog>
  );
};


