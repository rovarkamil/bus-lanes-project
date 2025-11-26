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
import { useUpdateBusStopsMapEditor } from "@/hooks/employee-hooks/use-bus-stop";
import {
  BusStopWithRelations,
  UpdateBusStopsMapEditorData,
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

interface UpdateBusStopsMapEditorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  stops: BusStopWithRelations[];
  onSuccess?: () => void;
}

type SelectableEntity = { id: string; [key: string]: unknown };

export const UpdateBusStopsMapEditorDialog: FC<
  UpdateBusStopsMapEditorDialogProps
> = ({ isOpen, onOpenChange, stops, onSuccess }) => {
  const { t, i18n } = useTranslation("BusStops");
  const isRTL = i18n.language !== "en";
  const [activeTab, setActiveTab] = useState<"english" | "arabic" | "kurdish">(
    "english"
  );

  const [selectedRoutes, setSelectedRoutes] = useState<
    Record<string, BusRoute[]>
  >({});
  const [selectedLanes, setSelectedLanes] = useState<Record<string, BusLane[]>>(
    {}
  );
  const [stopForms, setStopForms] = useState<
    Array<{
      id: string;
      nameFields: { en: string; ar?: string | null; ckb?: string | null };
      descriptionFields?: {
        en?: string | null;
        ar?: string | null;
        ckb?: string | null;
      };
      latitude?: number;
      longitude?: number;
      iconId?: string | null;
      zoneId?: string | null;
      laneIds?: string[];
      routeIds?: string[];
      hasShelter?: boolean;
      hasBench?: boolean;
      hasLighting?: boolean;
      isAccessible?: boolean;
      hasRealTimeInfo?: boolean;
      order?: number;
      isActive?: boolean;
    }>
  >([]);

  const { mutateAsync: updateStops, isPending: isUpdating } =
    useUpdateBusStopsMapEditor();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isBusy = isUpdating || isSubmitting;

  useEffect(() => {
    if (isOpen && stops.length > 0) {
      setStopForms(
        stops.map((stop) => ({
          id: stop.id,
          nameFields: {
            en: stop.name?.en || "",
            ar: stop.name?.ar || null,
            ckb: stop.name?.ckb || null,
          },
          descriptionFields: {
            en: stop.description?.en || "",
            ar: stop.description?.ar || null,
            ckb: stop.description?.ckb || null,
          },
          latitude: stop.latitude,
          longitude: stop.longitude,
          iconId: stop.iconId,
          zoneId: stop.zoneId,
          laneIds: stop.lanes?.map((l) => l.id) || [],
          routeIds: stop.routes?.map((r) => r.id) || [],
          hasShelter: stop.hasShelter,
          hasBench: stop.hasBench,
          hasLighting: stop.hasLighting,
          isAccessible: stop.isAccessible,
          hasRealTimeInfo: stop.hasRealTimeInfo,
          order: stop.order || undefined,
        }))
      );
      const routes: Record<string, BusRoute[]> = {};
      const lanes: Record<string, BusLane[]> = {};
      stops.forEach((stop) => {
        routes[stop.id] = stop.routes as BusRoute[];
        lanes[stop.id] = stop.lanes as BusLane[];
      });
      setSelectedRoutes(routes);
      setSelectedLanes(lanes);
    }
  }, [isOpen, stops]);

  const handleSubmit = async () => {
    if (isBusy) return;
    try {
      // Validate all stops have required fields
      for (let i = 0; i < stopForms.length; i++) {
        const form = stopForms[i];
        if (!form.nameFields.en.trim()) {
          toast.error(t("UpdateDialog.NameRequired", { stopNumber: i + 1 }));
          return;
        }
        if (
          form.latitude !== undefined &&
          (form.latitude < -90 ||
            form.latitude > 90 ||
            form.longitude === undefined ||
            form.longitude < -180 ||
            form.longitude > 180)
        ) {
          toast.error(
            t("UpdateDialog.InvalidCoordinates", { stopNumber: i + 1 })
          );
          return;
        }
      }

      setIsSubmitting(true);
      const dataToSubmit: UpdateBusStopsMapEditorData = {
        stops: stopForms.map((form) => ({
          id: form.id,
          nameFields: form.nameFields,
          descriptionFields: form.descriptionFields,
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

      await updateStops(dataToSubmit);
      toast.success(t("Success.Updated"));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating stops:", error);
      toast.error(t("Error.UpdateFailed"));
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
      title={t("UpdateDialog.BulkTitle", { count: stops.length })}
      description={t("UpdateDialog.BulkDescription")}
      rtl={isRTL}
      icon={Info}
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        {stopForms.map((form, index) => (
          <div
            key={form.id}
            className="space-y-4 rounded-lg border p-4 bg-muted/30"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                {t("UpdateDialog.StopNumber", { number: index + 1 })}
              </h3>
            </div>

            <LanguageTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              titleFields={form.nameFields as LanguageFields}
              onTitleChange={(fields) => {
                handleStopFormChange(index, { nameFields: fields });
              }}
              descriptionFields={form.descriptionFields as LanguageFields}
              onDescriptionChange={(fields) => {
                handleStopFormChange(index, { descriptionFields: fields });
              }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("UpdateDialog.Latitude")}</Label>
                <Input
                  type="number"
                  step="any"
                  min={-90}
                  max={90}
                  value={form.latitude ?? ""}
                  onChange={(e) =>
                    handleStopFormChange(index, {
                      latitude:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("UpdateDialog.Longitude")}</Label>
                <Input
                  type="number"
                  step="any"
                  min={-180}
                  max={180}
                  value={form.longitude ?? ""}
                  onChange={(e) =>
                    handleStopFormChange(index, {
                      longitude:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("UpdateDialog.Zone")}</Label>
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
                  placeholder={t("UpdateDialog.SelectZone")}
                  canClear
                  value={form.zoneId || ""}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("UpdateDialog.MapIcon")}</Label>
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
                  placeholder={t("UpdateDialog.SelectIcon")}
                  canClear
                  value={form.iconId || ""}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("UpdateDialog.DisplayOrder")}</Label>
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
              <Label>{t("UpdateDialog.Lanes")}</Label>
              <MultipleSelectWithPagination
                 key={`lanes-${form.id}-${form.laneIds?.join(",") || ""}`}
                 fetchFunction={useFetchBusLanes}
                 fields={[
                   {
                     key: "name",
                     label: t("Common.Name"),
                     type: "relation",
                     relationKey: "en",
                   },
                 ]}
                 onSelect={(items: SelectableEntity[]) => {
                   setSelectedLanes((prev) => ({
                     ...prev,
                     [form.id]: items as BusLane[],
                   }));
                   handleStopFormChange(index, {
                     laneIds: items.map((item) => item.id),
                   });
                 }}
                 placeholder={t("UpdateDialog.SelectLanes")}
                 defaultValue={selectedLanes[form.id] || []}
                 
              />
            </div>

            <div className="space-y-2">
              <Label>{t("UpdateDialog.Routes")}</Label>
              <MultipleSelectWithPagination
                 key={`routes-${form.id}-${form.routeIds?.join(",") || ""}`}
                 fetchFunction={useFetchBusRoutes}
                 fields={[
                   {
                     key: "name",
                     label: t("Common.Name"),
                     type: "relation",
                     relationKey: "en",
                   },
                 ]}
                 onSelect={(items: SelectableEntity[]) => {
                   setSelectedRoutes((prev) => ({
                     ...prev,
                     [form.id]: items as BusRoute[],
                   }));
                   handleStopFormChange(index, {
                     routeIds: items.map((item) => item.id),
                   });
                 }}
                 
                 placeholder={t("UpdateDialog.SelectRoutes")}
                 defaultValue={selectedRoutes[form.id] || [] as BusRoute[]}
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
                    {t("UpdateDialog.HasShelter")}
                  </Label>
                </div>
                <Switch
                  checked={form.hasShelter ?? false}
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
                    {t("UpdateDialog.HasBench")}
                  </Label>
                </div>
                <Switch
                  checked={form.hasBench ?? false}
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
                    {t("UpdateDialog.HasLighting")}
                  </Label>
                </div>
                <Switch
                  checked={form.hasLighting ?? false}
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
                    {t("UpdateDialog.IsAccessible")}
                  </Label>
                </div>
                <Switch
                  checked={form.isAccessible ?? false}
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
                    {t("UpdateDialog.HasRealTimeInfo")}
                  </Label>
                </div>
                <Switch
                  checked={form.hasRealTimeInfo ?? false}
                  onCheckedChange={(checked) =>
                    handleStopFormChange(index, { hasRealTimeInfo: checked })
                  }
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label>{t("UpdateDialog.IsActive")}</Label>
                <Switch
                  checked={form.isActive ?? true}
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
            {t("UpdateDialog.BulkUpdate", { count: stops.length })}
          </Button>
        </div>
      </div>
    </CustomDialog>
  );
};
