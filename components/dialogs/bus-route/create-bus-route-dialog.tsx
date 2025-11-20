"use client";

import { FC, useState } from "react";
import { useTranslation } from "@/i18n/client";
import { useCreateBusRoute } from "@/hooks/employee-hooks/use-bus-route";
import {
  CreateBusRouteData,
  createBusRouteSchema,
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
import SelectWithPagination from "@/components/select-with-pagination";
import MultipleSelectWithPagination from "@/components/multiple-select-with-pagination";
import { useFetchTransportServices } from "@/hooks/employee-hooks/use-transport-service";
import { useFetchBusLanes } from "@/hooks/employee-hooks/use-bus-lane";
import { useFetchBusStops } from "@/hooks/employee-hooks/use-bus-stop";
import { TransportServiceWithRelations } from "@/types/models/transport-service";
import { BusLaneWithRelations } from "@/types/models/bus-lane";
import { BusStopWithRelations } from "@/types/models/bus-stop";

interface CreateBusRouteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateBusRouteDialog: FC<CreateBusRouteDialogProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const { t, i18n } = useTranslation("BusRoutes");
  const isRTL = i18n.language !== "en";
  const [activeTab, setActiveTab] = useState<"english" | "arabic" | "kurdish">(
    "english"
  );
  const [selectedService, setSelectedService] =
    useState<TransportServiceWithRelations | null>(null);
  const [selectedLanes, setSelectedLanes] = useState<BusLaneWithRelations[]>(
    []
  );
  const [selectedStops, setSelectedStops] = useState<BusStopWithRelations[]>(
    []
  );

  const { mutateAsync: createRoute, isPending: isSubmitting } =
    useCreateBusRoute();

  const form = useForm<CreateBusRouteData>({
    resolver: zodResolver(createBusRouteSchema),
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
      serviceId: null,
      routeNumber: "",
      direction: RouteDirection.BIDIRECTIONAL,
      currency: Currency.IQD,
      fare: undefined,
      frequency: undefined,
      duration: undefined,
      isActive: true,
    },
  });

  const handleSubmit = async (formData: CreateBusRouteData) => {
    try {
      const dataToSubmit: CreateBusRouteData = {
        ...formData,
        serviceId: selectedService?.id || null,
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
        laneIds:
          selectedLanes.length > 0
            ? selectedLanes.map((lane) => lane.id)
            : undefined,
        stopIds:
          selectedStops.length > 0
            ? selectedStops.map((stop) => stop.id)
            : undefined,
        routeNumber: formData.routeNumber || undefined,
      };

      await createRoute(dataToSubmit);

      toast.success(t("Success.Created"));
      onOpenChange(false);
      onSuccess?.();
      resetForm();
    } catch (error) {
      console.error("Error creating bus route:", error);
      toast.error(t("Error.CreateFailed"));
    }
  };

  const resetForm = () => {
    form.reset();
    setSelectedService(null);
    setSelectedLanes([]);
    setSelectedStops([]);
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
              <Label>{t("CreateDialog.ServiceId")}</Label>
              <SelectWithPagination
                fetchFunction={useFetchTransportServices}
                onSelect={(item) => {
                  setSelectedService(item);
                  form.setValue("serviceId", item?.id || null);
                }}
                fields={[
                  {
                    key: "name",
                    label: t("Common.Name"),
                    type: "relation",
                  },
                  {
                    key: "type",
                    label: t("Table.Type"),
                    type: "string",
                  },
                ]}
                placeholder={t("CreateDialog.ServiceId")}
                value={selectedService?.id}
                defaultValue={selectedService || undefined}
                canClear
              />
            </div>
            <div className="space-y-2">
              <Label>{t("CreateDialog.RouteNumber")}</Label>
              <Input
                value={form.watch("routeNumber") || ""}
                onChange={(e) =>
                  form.setValue("routeNumber", e.target.value || undefined)
                }
                placeholder="R1"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("CreateDialog.Direction")}</Label>
              <Select
                value={form.watch("direction")}
                onValueChange={(value: RouteDirection) =>
                  form.setValue("direction", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("CreateDialog.Direction")} />
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
              <Label>{t("CreateDialog.Currency")}</Label>
              <Select
                value={form.watch("currency")}
                onValueChange={(value: Currency) =>
                  form.setValue("currency", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("CreateDialog.Currency")} />
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
              <Label>{t("CreateDialog.Fare")}</Label>
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
              <Label>{t("CreateDialog.Frequency")}</Label>
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
              <Label>{t("CreateDialog.Duration")}</Label>
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
            <Label>{t("CreateDialog.Lane")}</Label>
            <MultipleSelectWithPagination
              fetchFunction={useFetchBusLanes}
              onSelect={(items) => {
                setSelectedLanes(items);
              }}
              fields={[
                {
                  key: "name",
                  label: t("Common.Name"),
                  type: "relation",
                },
              ]}
              placeholder={t("CreateDialog.LanePlaceholder")}
              value={selectedLanes.map((lane) => lane.id)}
              defaultValue={selectedLanes}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("CreateDialog.Stop")}</Label>
            <MultipleSelectWithPagination
              fetchFunction={useFetchBusStops}
              onSelect={(items) => {
                setSelectedStops(items);
              }}
              fields={[
                {
                  key: "name",
                  label: t("Common.Name"),
                  type: "relation",
                },
              ]}
              placeholder={t("CreateDialog.StopPlaceholder")}
              value={selectedStops.map((stop) => stop.id)}
              defaultValue={selectedStops}
            />
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
            disabled={isSubmitting || !form.watch("nameFields.en")}
          >
            {isSubmitting ? t("Common.Creating") : t("Common.Create")}
          </Button>
        </div>
      </form>
    </CustomDialog>
  );
};
