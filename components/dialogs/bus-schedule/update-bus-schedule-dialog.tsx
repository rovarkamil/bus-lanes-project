"use client";

import { FC, useEffect, useState } from "react";
import { useTranslation } from "@/i18n/client";
import { DayOfWeek } from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useUpdateBusSchedule } from "@/hooks/employee-hooks/use-bus-schedule";
import {
  BusScheduleWithRelations,
  UpdateBusScheduleData,
  updateBusScheduleSchema,
} from "@/types/models/bus-schedule";
import { Button } from "@/components/ui/button";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Info } from "lucide-react";
import SelectWithPagination from "@/components/select-with-pagination";
import { useFetchBusRoutes } from "@/hooks/employee-hooks/use-bus-route";
import { useFetchBusStops } from "@/hooks/employee-hooks/use-bus-stop";
import { BusRouteWithRelations } from "@/types/models/bus-route";
import { BusStopWithRelations } from "@/types/models/bus-stop";

interface UpdateBusScheduleDialogProps {
  data: BusScheduleWithRelations;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const UpdateBusScheduleDialog: FC<UpdateBusScheduleDialogProps> = ({
  data,
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const { t, i18n } = useTranslation("BusSchedules");
  const isRTL = i18n.language !== "en";
  const [selectedRoute, setSelectedRoute] =
    useState<BusRouteWithRelations | null>(
      (data.route as BusRouteWithRelations) || null
    );
  const [selectedStop, setSelectedStop] = useState<BusStopWithRelations | null>(
    (data.stop as BusStopWithRelations) || null
  );

  const { mutateAsync: updateSchedule, isPending: isSubmitting } =
    useUpdateBusSchedule();

  const form = useForm<UpdateBusScheduleData>({
    resolver: zodResolver(updateBusScheduleSchema),
    defaultValues: {
      id: data.id,
      routeId: data.routeId,
      stopId: data.stopId,
      departureTime: data.departureTime,
      dayOfWeek: data.dayOfWeek,
      specificDate: data.specificDate ? new Date(data.specificDate) : undefined,
      notes: data.notes ?? "",
      isActive: data.isActive,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        id: data.id,
        routeId: data.routeId,
        stopId: data.stopId,
        departureTime: data.departureTime,
        dayOfWeek: data.dayOfWeek,
        specificDate: data.specificDate
          ? new Date(data.specificDate)
          : undefined,
        notes: data.notes ?? "",
        isActive: data.isActive,
      });

      setSelectedRoute((data.route as BusRouteWithRelations) || null);
      setSelectedStop((data.stop as BusStopWithRelations) || null);
    }
  }, [data, form, isOpen]);

  const handleSubmit = async (formData: UpdateBusScheduleData) => {
    try {
      if (!selectedRoute || !selectedStop) {
        toast.error(t("Error.RouteStopRequired"));
        return;
      }

      await updateSchedule({
        ...formData,
        routeId: selectedRoute.id,
        stopId: selectedStop.id,
        notes: formData.notes?.trim() || undefined,
        specificDate: formData.specificDate || undefined,
      });

      toast.success(t("Success.Updated"));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating bus schedule:", error);
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("UpdateDialog.RouteId")}</Label>
              <SelectWithPagination
                fetchFunction={useFetchBusRoutes}
                onSelect={(item) => {
                  setSelectedRoute(item);
                  form.setValue("routeId", item?.id || "");
                }}
                fields={[
                  {
                    key: "name",
                    label: t("Common.Name"),
                    type: "relation",
                  },
                  {
                    key: "routeNumber",
                    label: t("Table.Route"),
                    type: "string",
                  },
                ]}
                placeholder={t("UpdateDialog.RouteId")}
                value={selectedRoute?.id}
                defaultValue={selectedRoute || undefined}
                initialSelectedItem={selectedRoute || undefined}
                canClear
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.StopId")}</Label>
              <SelectWithPagination
                fetchFunction={useFetchBusStops}
                onSelect={(item) => {
                  setSelectedStop(item);
                  form.setValue("stopId", item?.id || "");
                }}
                fields={[
                  {
                    key: "name",
                    label: t("Common.Name"),
                    type: "relation",
                  },
                ]}
                placeholder={t("UpdateDialog.StopId")}
                value={selectedStop?.id}
                defaultValue={selectedStop || undefined}
                initialSelectedItem={selectedStop || undefined}
                canClear
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.DepartureTime")}</Label>
              <Input
                type="time"
                value={form.watch("departureTime")}
                onChange={(e) => form.setValue("departureTime", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("UpdateDialog.DayOfWeek")}</Label>
              <Select
                value={form.watch("dayOfWeek")}
                onValueChange={(value: DayOfWeek) =>
                  form.setValue("dayOfWeek", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("UpdateDialog.DayOfWeek")} />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DayOfWeek).map((day) => (
                    <SelectItem key={day} value={day}>
                      {t(`DayOfWeek.${day}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("UpdateDialog.SpecificDate")}</Label>
            <Input
              type="date"
              value={
                form.watch("specificDate")
                  ? new Date(form.watch("specificDate") as Date)
                      .toISOString()
                      .slice(0, 10)
                  : ""
              }
              onChange={(e) =>
                form.setValue(
                  "specificDate",
                  e.target.value ? new Date(e.target.value) : undefined
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label>{t("UpdateDialog.Notes")}</Label>
            <Input
              value={form.watch("notes") ?? ""}
              onChange={(e) => form.setValue("notes", e.target.value)}
              placeholder={t("UpdateDialog.NotesPlaceholder")}
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
            disabled={isSubmitting || !selectedRoute || !selectedStop}
          >
            {isSubmitting ? t("Common.Updating") : t("Common.Update")}
          </Button>
        </div>
      </form>
    </CustomDialog>
  );
};
