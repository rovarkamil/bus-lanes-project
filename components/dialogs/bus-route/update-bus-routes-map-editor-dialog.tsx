"use client";

import { FC, useState, useEffect } from "react";
import { useTranslation } from "@/i18n/client";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { LanguageTabs } from "@/components/language-tabs";
import { LanguageFields } from "@/utils/language-handler";
import { useUpdateBusRoutesMapEditor } from "@/hooks/employee-hooks/use-bus-route";
import {
  BusRouteWithRelations,
  UpdateBusRoutesMapEditorData,
} from "@/types/models/bus-route";
import { toast } from "sonner";
import { Info, Loader2 } from "lucide-react";
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

interface UpdateBusRoutesMapEditorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  routes: BusRouteWithRelations[];
  onSuccess?: () => void;
}

type SelectableEntity = { id: string; [key: string]: unknown };

export const UpdateBusRoutesMapEditorDialog: FC<
  UpdateBusRoutesMapEditorDialogProps
> = ({ isOpen, onOpenChange, routes, onSuccess }) => {
  const { t, i18n } = useTranslation("BusRoutes");
  const isRTL = i18n.language !== "en";
  const [activeTab, setActiveTab] = useState<"english" | "arabic" | "kurdish">(
    "english"
  );
  const [routeForms, setRouteForms] = useState<
    Array<{
      id: string;
      nameFields: { en: string; ar?: string | null; ckb?: string | null };
      descriptionFields?: {
        en?: string | null;
        ar?: string | null;
        ckb?: string | null;
      };
      serviceId?: string | null;
      routeNumber?: string;
      direction: RouteDirection;
      fare?: number;
      currency: Currency;
      frequency?: number;
      duration?: number;
      laneIds?: string[];
      stopIds?: string[];
      isActive: boolean;
    }>
  >([]);

  const { mutateAsync: updateRoutes, isPending: isUpdating } =
    useUpdateBusRoutesMapEditor();

  useEffect(() => {
    if (isOpen && routes.length > 0) {
      setRouteForms(
        routes.map((route) => ({
          id: route.id,
          nameFields: {
            en: route.name?.en || "",
            ar: route.name?.ar || null,
            ckb: route.name?.ckb || null,
          },
          descriptionFields: {
            en: route.description?.en || "",
            ar: route.description?.ar || null,
            ckb: route.description?.ckb || null,
          },
          serviceId: route.serviceId,
          routeNumber: route.routeNumber || undefined,
          direction: route.direction,
          fare: route.fare || undefined,
          currency: route.currency,
          frequency: route.frequency || undefined,
          duration: route.duration || undefined,
          laneIds: route.lanes?.map((l) => l.id) || [],
          stopIds: route.stops?.map((s) => s.id) || [],
          isActive: route.isActive ?? true,
        }))
      );
    }
  }, [isOpen, routes]);

  const handleSubmit = async () => {
    try {
      // Validate all routes have required fields
      for (let i = 0; i < routeForms.length; i++) {
        const form = routeForms[i];
        if (!form.nameFields.en.trim()) {
          toast.error(t("UpdateDialog.NameRequired", { routeNumber: i + 1 }));
          return;
        }
      }

      const dataToSubmit: UpdateBusRoutesMapEditorData = {
        routes: routeForms.map((form) => ({
          id: form.id,
          nameFields: form.nameFields,
          descriptionFields: form.descriptionFields,
          serviceId: form.serviceId,
          routeNumber: form.routeNumber,
          direction: form.direction,
          fare: form.fare,
          currency: form.currency,
          frequency: form.frequency,
          duration: form.duration,
          laneIds: form.laneIds,
          stopIds: form.stopIds,
          isActive: form.isActive,
        })),
      };

      await updateRoutes(dataToSubmit);
      toast.success(t("Success.Updated"));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating routes:", error);
      toast.error(t("Error.UpdateFailed"));
    }
  };

  const handleRouteFormChange = (
    index: number,
    updates: Partial<(typeof routeForms)[0]>
  ) => {
    setRouteForms((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  if (routes.length === 0) {
    return null;
  }

  return (
    <CustomDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t("UpdateDialog.BulkTitle", { count: routes.length })}
      description={t("UpdateDialog.BulkDescription")}
      rtl={isRTL}
      icon={Info}
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        {routeForms.map((form, index) => (
          <div
            key={form.id}
            className="space-y-4 rounded-lg border p-4 bg-muted/30"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                {t("UpdateDialog.RouteNumber", { number: index + 1 })}
              </h3>
            </div>

            <LanguageTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              titleFields={form.nameFields as LanguageFields}
              onTitleChange={(fields) => {
                handleRouteFormChange(index, { nameFields: fields });
              }}
              descriptionFields={form.descriptionFields as LanguageFields}
              onDescriptionChange={(fields) => {
                handleRouteFormChange(index, { descriptionFields: fields });
              }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("UpdateDialog.ServiceId")}</Label>
                <SelectWithPagination
                  fetchFunction={useFetchTransportServices}
                  onSelect={(item) => {
                    handleRouteFormChange(index, {
                      serviceId: item?.id || null,
                    });
                  }}
                  fields={[
                    {
                      key: "name",
                      label: t("Common.Name"),
                      type: "relation",
                      relationKey: "en",
                    },
                    {
                      key: "type",
                      label: t("Table.Type"),
                    },
                  ]}
                  placeholder={t("UpdateDialog.ServiceId")}
                  canClear
                  value={form.serviceId || ""}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("UpdateDialog.RouteNumber")}</Label>
                <Input
                  value={form.routeNumber || ""}
                  onChange={(e) =>
                    handleRouteFormChange(index, {
                      routeNumber: e.target.value || undefined,
                    })
                  }
                  placeholder="R1"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("UpdateDialog.Direction")}</Label>
                <Select
                  value={form.direction}
                  onValueChange={(value: RouteDirection) =>
                    handleRouteFormChange(index, { direction: value })
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
                  value={form.currency}
                  onValueChange={(value: Currency) =>
                    handleRouteFormChange(index, { currency: value })
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
                  value={form.fare ?? ""}
                  onChange={(e) =>
                    handleRouteFormChange(index, {
                      fare:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("UpdateDialog.Frequency")}</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.frequency ?? ""}
                  onChange={(e) =>
                    handleRouteFormChange(index, {
                      frequency:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("UpdateDialog.Duration")}</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.duration ?? ""}
                  onChange={(e) =>
                    handleRouteFormChange(index, {
                      duration:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("UpdateDialog.Lane")}</Label>
              <MultipleSelectWithPagination
                fetchFunction={useFetchBusLanes}
                onSelect={(items: SelectableEntity[]) =>
                  handleRouteFormChange(index, {
                    laneIds: items.map((item) => item.id),
                  })
                }
                fields={[
                  {
                    key: "name",
                    label: t("Common.Name"),
                    type: "relation",
                    relationKey: "en",
                  },
                ]}
                placeholder={t("UpdateDialog.LanePlaceholder")}
                defaultValue={
                  form.laneIds?.map((id) => ({ id })) as SelectableEntity[]
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("UpdateDialog.Stop")}</Label>
              <MultipleSelectWithPagination
                fetchFunction={useFetchBusStops}
                onSelect={(items: SelectableEntity[]) =>
                  handleRouteFormChange(index, {
                    stopIds: items.map((item) => item.id),
                  })
                }
                fields={[
                  {
                    key: "name",
                    label: t("Common.Name"),
                    type: "relation",
                    relationKey: "en",
                  },
                ]}
                placeholder={t("UpdateDialog.StopPlaceholder")}
                defaultValue={
                  form.stopIds?.map((id) => ({ id })) as SelectableEntity[]
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>{t("UpdateDialog.IsActive")}</Label>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  handleRouteFormChange(index, { isActive: checked })
                }
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>
          </div>
        ))}

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("Cancel")}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("UpdateDialog.BulkUpdate", { count: routes.length })}
          </Button>
        </div>
      </div>
    </CustomDialog>
  );
};
