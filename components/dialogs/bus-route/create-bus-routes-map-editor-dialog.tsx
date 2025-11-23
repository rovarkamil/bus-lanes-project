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
import { useCreateBusRoutesMapEditor } from "@/hooks/employee-hooks/use-bus-route";
import {
  MapEditorRouteDraft,
  CreateBusRoutesMapEditorData,
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

interface CreateBusRoutesMapEditorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  routes: MapEditorRouteDraft[];
  onSuccess?: () => void;
}

type SelectableEntity = { id: string; [key: string]: unknown };

export const CreateBusRoutesMapEditorDialog: FC<
  CreateBusRoutesMapEditorDialogProps
> = ({ isOpen, onOpenChange, routes, onSuccess }) => {
  const { t, i18n } = useTranslation("BusRoutes");
  const isRTL = i18n.language !== "en";
  const [activeTab, setActiveTab] = useState<"english" | "arabic" | "kurdish">(
    "english"
  );
  const [routeForms, setRouteForms] = useState<
    Array<{
      name: { en: string; ar?: string | null; ckb?: string | null };
      description?: {
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

  const { mutateAsync: createRoutes, isPending: isCreating } =
    useCreateBusRoutesMapEditor();

  useEffect(() => {
    if (isOpen && routes.length > 0) {
      setRouteForms(
        routes.map((route) => ({
          name: route.name || { en: "", ar: null, ckb: null },
          description: route.description,
          serviceId: route.serviceId || null,
          routeNumber: route.routeNumber,
          direction: route.direction || RouteDirection.BIDIRECTIONAL,
          fare: route.fare,
          currency: route.currency || Currency.IQD,
          frequency: route.frequency,
          duration: route.duration,
          laneIds: route.laneIds || [],
          stopIds: route.stopIds || [],
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
        if (!form.name.en.trim()) {
          toast.error(
            t("CreateDialog.NameRequired", { routeNumber: i + 1 })
          );
          return;
        }
      }

      const dataToSubmit: CreateBusRoutesMapEditorData = {
        routes: routeForms.map((form, index) => ({
          ...routes[index],
          name: form.name,
          description: form.description,
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

      await createRoutes(dataToSubmit);
      toast.success(t("Success.Created"));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating routes:", error);
      toast.error(t("Error.CreateFailed"));
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
      title={t("CreateDialog.BulkTitle", { count: routes.length })}
      description={t("CreateDialog.BulkDescription")}
      rtl={isRTL}
      icon={Info}
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        {routeForms.map((form, index) => (
          <div
            key={index}
            className="space-y-4 rounded-lg border p-4 bg-muted/30"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                {t("CreateDialog.RouteNumber", { number: index + 1 })}
              </h3>
            </div>

            <LanguageTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              titleFields={form.name as LanguageFields}
              onTitleChange={(fields) => {
                handleRouteFormChange(index, { name: fields });
              }}
              descriptionFields={form.description as LanguageFields}
              onDescriptionChange={(fields) => {
                handleRouteFormChange(index, { description: fields });
              }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("CreateDialog.ServiceId")}</Label>
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
                  placeholder={t("CreateDialog.ServiceId")}
                  canClear
                  value={form.serviceId || ""}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("CreateDialog.RouteNumber")}</Label>
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
                <Label>{t("CreateDialog.Direction")}</Label>
                <Select
                  value={form.direction}
                  onValueChange={(value: RouteDirection) =>
                    handleRouteFormChange(index, { direction: value })
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
                  value={form.currency}
                  onValueChange={(value: Currency) =>
                    handleRouteFormChange(index, { currency: value })
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
                <Label>{t("CreateDialog.Frequency")}</Label>
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
                <Label>{t("CreateDialog.Duration")}</Label>
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
              <Label>{t("CreateDialog.Lane")}</Label>
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
                placeholder={t("CreateDialog.LanePlaceholder")}
                defaultValue={
                  form.laneIds?.map((id) => ({ id })) as SelectableEntity[]
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("CreateDialog.Stop")}</Label>
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
                placeholder={t("CreateDialog.StopPlaceholder")}
                defaultValue={
                  form.stopIds?.map((id) => ({ id })) as SelectableEntity[]
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>{t("CreateDialog.IsActive")}</Label>
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
          <Button type="button" onClick={handleSubmit} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("CreateDialog.BulkCreate", { count: routes.length })}
          </Button>
        </div>
      </div>
    </CustomDialog>
  );
};

