"use client";

import { FC } from "react";
import { useTranslation } from "@/i18n/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { DayOfWeek } from "@prisma/client";
import { useCreateBusSchedule } from "@/hooks/employee-hooks/use-bus-schedule";
import {
  CreateBusScheduleData,
  createBusScheduleSchema,
} from "@/types/models/bus-schedule";
import { Button } from "@/components/ui/button";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Info } from "lucide-react";

interface CreateBusScheduleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateBusScheduleDialog: FC<CreateBusScheduleDialogProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const { t, i18n } = useTranslation("BusSchedules");
  const isRTL = i18n.language !== "en";

  const { mutateAsync: createSchedule, isPending: isSubmitting } =
    useCreateBusSchedule();

  const form = useForm<CreateBusScheduleData>({
    resolver: zodResolver(createBusScheduleSchema),
    defaultValues: {
      routeId: "",
      stopId: "",
      departureTime: "08:00",
      dayOfWeek: DayOfWeek.MONDAY,
      specificDate: undefined,
      notes: "",
      isActive: true,
    },
  });

  const handleSubmit = async (formData: CreateBusScheduleData) => {
    try {
      await createSchedule({
        ...formData,
        routeId: formData.routeId.trim(),
        stopId: formData.stopId.trim(),
        notes: formData.notes?.trim() || undefined,
        specificDate: formData.specificDate || undefined,
      });
      toast.success(t("Success.Created"));
      onOpenChange(false);
      onSuccess?.();
      form.reset();
    } catch (error) {
      console.error("Error creating bus schedule:", error);
      toast.error(t("Error.CreateFailed"));
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("CreateDialog.RouteId")}</Label>
              <Input
                value={form.watch("routeId")}
                onChange={(e) => form.setValue("routeId", e.target.value)}
                placeholder="route-id"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("CreateDialog.StopId")}</Label>
              <Input
                value={form.watch("stopId")}
                onChange={(e) => form.setValue("stopId", e.target.value)}
                placeholder="stop-id"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("CreateDialog.DepartureTime")}</Label>
              <Input
                type="time"
                value={form.watch("departureTime")}
                onChange={(e) => form.setValue("departureTime", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("CreateDialog.DayOfWeek")}</Label>
              <Select
                value={form.watch("dayOfWeek")}
                onValueChange={(value: DayOfWeek) =>
                  form.setValue("dayOfWeek", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("CreateDialog.DayOfWeek")} />
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
            <Label>{t("CreateDialog.SpecificDate")}</Label>
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
            <Label>{t("CreateDialog.Notes")}</Label>
            <Input
              value={form.watch("notes") ?? ""}
              onChange={(e) => form.setValue("notes", e.target.value)}
              placeholder={t("CreateDialog.NotesPlaceholder")}
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
            disabled={
              isSubmitting ||
              !form.watch("routeId").trim() ||
              !form.watch("stopId").trim()
            }
          >
            {isSubmitting ? t("Common.Creating") : t("Common.Create")}
          </Button>
        </div>
      </form>
    </CustomDialog>
  );
};
