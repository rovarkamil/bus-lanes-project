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
import { useCreateBusStopsMapEditor } from "@/hooks/employee-hooks/use-bus-stop";
import {
  MapEditorStopDraft,
  CreateBusStopsMapEditorData,
} from "@/types/models/bus-stop";
import { toast } from "sonner";
import { Info, Loader2 } from "lucide-react";
import SelectWithPagination from "@/components/select-with-pagination";
import MultipleSelectWithPagination from "@/components/multiple-select-with-pagination";
import { useFetchZones } from "@/hooks/employee-hooks/use-zone";
import { useFetchMapIcons } from "@/hooks/employee-hooks/use-map-icon";
import { useFetchBusLanes } from "@/hooks/employee-hooks/use-bus-lane";
import { useFetchBusRoutes } from "@/hooks/employee-hooks/use-bus-route";
import { Home, Sofa, Lightbulb, Accessibility, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { BusLane, BusRoute } from "@prisma/client";

interface CreateBusStopsMapEditorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  stops: MapEditorStopDraft[];
  onSuccess?: () => void;
}

type SelectableEntity = { id: string; [key: string]: unknown };

export const CreateBusStopsMapEditorDialog: FC<
  CreateBusStopsMapEditorDialogProps
> = ({ isOpen, onOpenChange, stops, onSuccess }) => {
  const { t, i18n } = useTranslation("BusStops");
  const isRTL = i18n.language !== "en";
  const [activeTab, setActiveTab] = useState<"english" | "arabic" | "kurdish">(
    "english"
  );
  const [selectedLanes, setSelectedLanes] = useState<Record<string, BusLane[]>>(
    {}
  );
  const [selectedRoutes, setSelectedRoutes] = useState<
    Record<string, BusRoute[]>
  >({});
  const [stopForms, setStopForms] = useState<
    Array<{
      name: { en: string; ar?: string | null; ckb?: string | null };
      description?: {
        en?: string | null;
        ar?: string | null;
        ckb?: string | null;
      };
      latitude: number;
      longitude: number;
      iconId?: string | null;
      zoneId?: string | null;
      laneIds?: string[];
      routeIds?: string[];
      hasShelter: boolean;
      hasBench: boolean;
      hasLighting: boolean;
      isAccessible: boolean;
      hasRealTimeInfo: boolean;
      order?: number;
      isActive: boolean;
    }>
  >([]);

  const { mutateAsync: createStops, isPending: isCreating } =
    useCreateBusStopsMapEditor();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isBusy = isCreating || isSubmitting;

  useEffect(() => {
    if (isOpen && stops.length > 0) {
      setStopForms(
        stops.map((stop) => ({
          name: stop.name || { en: "", ar: null, ckb: null },
          description: stop.description,
          latitude: stop.latitude,
          longitude: stop.longitude,
          iconId: stop.iconId || null,
          zoneId: stop.zoneId || null,
          laneIds: stop.laneIds || [],
          routeIds: stop.routeIds || [],
          hasShelter: stop.hasShelter ?? false,
          hasBench: stop.hasBench ?? false,
          hasLighting: stop.hasLighting ?? false,
          isAccessible: stop.isAccessible ?? false,
          hasRealTimeInfo: stop.hasRealTimeInfo ?? false,
          order: stop.order,
          isActive: stop.isActive ?? true,
        }))
      );
    }
  }, [isOpen, stops]);

  const handleSubmit = async () => {
    if (isBusy) return;
    try {
      // Validate all stops have required fields
      for (let i = 0; i < stopForms.length; i++) {
        const form = stopForms[i];
        if (!form.name.en.trim()) {
          toast.error(t("CreateDialog.NameRequired", { stopNumber: i + 1 }));
          return;
        }
        if (
          form.latitude < -90 ||
          form.latitude > 90 ||
          form.longitude < -180 ||
          form.longitude > 180
        ) {
          toast.error(
            t("CreateDialog.InvalidCoordinates", { stopNumber: i + 1 })
          );
          return;
        }
      }

      setIsSubmitting(true);
      const dataToSubmit: CreateBusStopsMapEditorData = {
        stops: stopForms.map((form, index) => ({
          ...stops[index],
          name: form.name,
          description: form.description,
          latitude: form.latitude,
          longitude: form.longitude,
          iconId: form.iconId,
          zoneId: form.zoneId,
          laneIds: form.laneIds,
          routeIds: form.routeIds,
          hasShelter: form.hasShelter,
          hasBench: form.hasBench,
          hasLighting: form.hasLighting,
          isAccessible: form.isAccessible,
          hasRealTimeInfo: form.hasRealTimeInfo,
          order: form.order,
          isActive: form.isActive,
        })),
      };

      await createStops(dataToSubmit);
      toast.success(t("Success.Created"));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating stops:", error);
      toast.error(t("Error.CreateFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStopFormChange = (
    index: number,
    updates: Partial<(typeof stopForms)[0]>
  ) => {
    setStopForms((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  if (stops.length === 0) {
    return null;
  }

  return (
    <CustomDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t("CreateDialog.BulkTitle", { count: stops.length })}
      description={t("CreateDialog.BulkDescription")}
      rtl={isRTL}
      icon={Info}
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        {stopForms.map((form, index) => (
          <div
            key={index}
            className="space-y-4 rounded-lg border p-4 bg-muted/30"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                {t("CreateDialog.StopNumber", { number: index + 1 })}
              </h3>
            </div>

            <LanguageTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              titleFields={form.name as LanguageFields}
              onTitleChange={(fields) => {
                handleStopFormChange(index, { name: fields });
              }}
              descriptionFields={form.description as LanguageFields}
              onDescriptionChange={(fields) => {
                handleStopFormChange(index, { description: fields });
              }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("CreateDialog.Latitude")}</Label>
                <Input
                  type="number"
                  step="any"
                  min={-90}
                  max={90}
                  value={form.latitude}
                  onChange={(e) =>
                    handleStopFormChange(index, {
                      latitude: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("CreateDialog.Longitude")}</Label>
                <Input
                  type="number"
                  step="any"
                  min={-180}
                  max={180}
                  value={form.longitude}
                  onChange={(e) =>
                    handleStopFormChange(index, {
                      longitude: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("CreateDialog.Zone")}</Label>
                <SelectWithPagination
                  fetchFunction={useFetchZones}
                  onSelect={(item) => {
                    handleStopFormChange(index, {
                      zoneId: item?.id || null,
                    });
                  }}
                  fields={[
                    {
                      key: "name",
                      label: t("Common.Name"),
                      type: "relation",
                      relationKey: "en",
                    },
                  ]}
                  placeholder={t("CreateDialog.SelectZone")}
                  canClear
                  value={form.zoneId || ""}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("CreateDialog.MapIcon")}</Label>
                <SelectWithPagination
                  fetchFunction={useFetchMapIcons}
                  onSelect={(item) => {
                    handleStopFormChange(index, {
                      iconId: item?.id || null,
                    });
                  }}
                  fields={[
                    {
                      key: "name",
                      label: t("Common.Name"),
                      type: "relation",
                      relationKey: "en",
                    },
                  ]}
                  placeholder={t("CreateDialog.SelectIcon")}
                  canClear
                  value={form.iconId || ""}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("CreateDialog.DisplayOrder")}</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.order ?? ""}
                  onChange={(e) =>
                    handleStopFormChange(index, {
                      order:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("CreateDialog.Lanes")}</Label>
              <MultipleSelectWithPagination
                fetchFunction={useFetchBusLanes}
                onSelect={(items: SelectableEntity[]) => {
                  handleStopFormChange(index, {
                    laneIds: items.map((item) => item.id),
                  });
                  setSelectedLanes((prev) => ({
                    ...prev,
                    [index]: items as BusLane[],
                  }));
                }}
                fields={[
                  {
                    key: "name",
                    label: t("Common.Name"),
                    type: "relation",
                    relationKey: "en",
                  },
                ]}
                placeholder={t("CreateDialog.SelectLanes")}
                defaultValue={selectedLanes[index] || []}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("CreateDialog.Routes")}</Label>
              <MultipleSelectWithPagination
                fetchFunction={useFetchBusRoutes}
                onSelect={(items: SelectableEntity[]) => {
                  handleStopFormChange(index, {
                    routeIds: items.map((item) => item.id),
                  });
                  setSelectedRoutes((prev) => ({
                    ...prev,
                    [index]: items as BusRoute[],
                  }));
                }}
                fields={[
                  {
                    key: "name",
                    label: t("Common.Name"),
                    type: "relation",
                    relationKey: "en",
                  },
                ]}
                placeholder={t("CreateDialog.SelectRoutes")}
                defaultValue={selectedRoutes[index] || []}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div
                className={cn(
                  "flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors",
                  form.hasShelter
                    ? "bg-primary/10 border-primary"
                    : "bg-background"
                )}
                onClick={() =>
                  handleStopFormChange(index, {
                    hasShelter: !form.hasShelter,
                  })
                }
              >
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <Label className="cursor-pointer">
                    {t("CreateDialog.HasShelter")}
                  </Label>
                </div>
                <Switch
                  checked={form.hasShelter}
                  onCheckedChange={(checked) =>
                    handleStopFormChange(index, { hasShelter: checked })
                  }
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>

              <div
                className={cn(
                  "flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors",
                  form.hasBench
                    ? "bg-primary/10 border-primary"
                    : "bg-background"
                )}
                onClick={() =>
                  handleStopFormChange(index, { hasBench: !form.hasBench })
                }
              >
                <div className="flex items-center gap-2">
                  <Sofa className="h-4 w-4" />
                  <Label className="cursor-pointer">
                    {t("CreateDialog.HasBench")}
                  </Label>
                </div>
                <Switch
                  checked={form.hasBench}
                  onCheckedChange={(checked) =>
                    handleStopFormChange(index, { hasBench: checked })
                  }
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>

              <div
                className={cn(
                  "flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors",
                  form.hasLighting
                    ? "bg-primary/10 border-primary"
                    : "bg-background"
                )}
                onClick={() =>
                  handleStopFormChange(index, {
                    hasLighting: !form.hasLighting,
                  })
                }
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  <Label className="cursor-pointer">
                    {t("CreateDialog.HasLighting")}
                  </Label>
                </div>
                <Switch
                  checked={form.hasLighting}
                  onCheckedChange={(checked) =>
                    handleStopFormChange(index, { hasLighting: checked })
                  }
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>

              <div
                className={cn(
                  "flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors",
                  form.isAccessible
                    ? "bg-primary/10 border-primary"
                    : "bg-background"
                )}
                onClick={() =>
                  handleStopFormChange(index, {
                    isAccessible: !form.isAccessible,
                  })
                }
              >
                <div className="flex items-center gap-2">
                  <Accessibility className="h-4 w-4" />
                  <Label className="cursor-pointer">
                    {t("CreateDialog.IsAccessible")}
                  </Label>
                </div>
                <Switch
                  checked={form.isAccessible}
                  onCheckedChange={(checked) =>
                    handleStopFormChange(index, { isAccessible: checked })
                  }
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>

              <div
                className={cn(
                  "flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors",
                  form.hasRealTimeInfo
                    ? "bg-primary/10 border-primary"
                    : "bg-background"
                )}
                onClick={() =>
                  handleStopFormChange(index, {
                    hasRealTimeInfo: !form.hasRealTimeInfo,
                  })
                }
              >
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4" />
                  <Label className="cursor-pointer">
                    {t("CreateDialog.HasRealTimeInfo")}
                  </Label>
                </div>
                <Switch
                  checked={form.hasRealTimeInfo}
                  onCheckedChange={(checked) =>
                    handleStopFormChange(index, { hasRealTimeInfo: checked })
                  }
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label>{t("CreateDialog.IsActive")}</Label>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    handleStopFormChange(index, { isActive: checked })
                  }
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
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
          <Button type="button" onClick={handleSubmit} disabled={isBusy}>
            {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("CreateDialog.BulkCreate", { count: stops.length })}
          </Button>
        </div>
      </div>
    </CustomDialog>
  );
};
