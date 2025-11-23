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
import { useUpdateBusLanesMapEditor } from "@/hooks/employee-hooks/use-bus-lane";
import {
  BusLaneWithRelations,
  UpdateBusLanesMapEditorData,
} from "@/types/models/bus-lane";
import { toast } from "sonner";
import { Info, Loader2 } from "lucide-react";
import SelectWithPagination from "@/components/select-with-pagination";
import MultipleSelectWithPagination from "@/components/multiple-select-with-pagination";
import { useFetchTransportServices } from "@/hooks/employee-hooks/use-transport-service";
import { useFetchBusRoutes } from "@/hooks/employee-hooks/use-bus-route";
import {
  MapLinesDialog,
  type MapLinesDialogResult,
} from "@/components/dialogs/map/map-lines-dialog";
import { CoordinateTuple } from "@/types/map";
import { TransportServiceWithRelations } from "@/types/models/transport-service";

interface UpdateBusLanesMapEditorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lanes: BusLaneWithRelations[];
  onSuccess?: () => void;
}

type SelectableEntity = { id: string; [key: string]: unknown };

const parsePathPoints = (value: unknown): CoordinateTuple[] =>
  Array.isArray(value) ? (value as CoordinateTuple[]) : [];

export const UpdateBusLanesMapEditorDialog: FC<
  UpdateBusLanesMapEditorDialogProps
> = ({ isOpen, onOpenChange, lanes, onSuccess }) => {
  const { t, i18n } = useTranslation("BusLanes");
  const isRTL = i18n.language !== "en";
  const [activeTab, setActiveTab] = useState<"english" | "arabic" | "kurdish">(
    "english"
  );
  const [laneForms, setLaneForms] = useState<
    Array<{
      id: string;
      nameFields: { en: string; ar?: string | null; ckb?: string | null };
      descriptionFields?: {
        en?: string | null;
        ar?: string | null;
        ckb?: string | null;
      };
      color: string;
      weight: number;
      opacity: number;
      serviceId?: string | null;
      routeIds?: string[];
      isActive: boolean;
      path?: CoordinateTuple[];
      draftStops: MapLinesDialogResult["draftStops"];
    }>
  >([]);
  const [editingLaneIndex, setEditingLaneIndex] = useState<number | null>(null);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  // Store selected services and routes per lane (by lane ID)
  const [selectedServices, setSelectedServices] = useState<
    Record<string, TransportServiceWithRelations | null>
  >({});
  const [selectedRoutes, setSelectedRoutes] = useState<
    Record<string, SelectableEntity[]>
  >({});

  const { mutateAsync: updateLanes, isPending: isUpdating } =
    useUpdateBusLanesMapEditor();

  useEffect(() => {
    if (isOpen && lanes.length > 0) {
      const forms = lanes.map((lane) => ({
        id: lane.id,
        nameFields: {
          en: lane.name?.en || "",
          ar: lane.name?.ar || null,
          ckb: lane.name?.ckb || null,
        },
        descriptionFields: lane.description
          ? {
              en: lane.description.en || "",
              ar: lane.description.ar || null,
              ckb: lane.description.ckb || null,
            }
          : {
              en: "",
              ar: null,
              ckb: null,
            },
        color: lane.color ?? "#0066CC",
        weight: lane.weight ?? 5,
        opacity: lane.opacity ?? 0.8,
        serviceId: lane.serviceId,
        routeIds: lane.routes?.map((r) => r.id) || [],
        isActive: lane.isActive ?? true,
        path: parsePathPoints(lane.path),
        draftStops: [],
      }));

      setLaneForms(forms);

      // Initialize selected services and routes per lane
      const services: Record<string, TransportServiceWithRelations | null> = {};
      const routes: Record<string, SelectableEntity[]> = {};

      lanes.forEach((lane) => {
        services[lane.id] =
          (lane.service as TransportServiceWithRelations | null) || null;
        routes[lane.id] = (lane.routes as SelectableEntity[]) || [];
      });

      setSelectedServices(services);
      setSelectedRoutes(routes);
    }
  }, [isOpen, lanes]);

  const handleSubmit = async () => {
    try {
      // Validate all lanes have required fields
      for (let i = 0; i < laneForms.length; i++) {
        const form = laneForms[i];
        if (!form.nameFields.en.trim()) {
          toast.error(t("UpdateDialog.NameRequired", { laneNumber: i + 1 }));
          return;
        }
        if (form.path && form.path.length < 2) {
          toast.error(t("UpdateDialog.PathRequired", { laneNumber: i + 1 }));
          return;
        }
      }

      const dataToSubmit: UpdateBusLanesMapEditorData = {
        lanes: laneForms.map((form) => ({
          id: form.id,
          nameFields: form.nameFields,
          descriptionFields: form.descriptionFields,
          color: form.color,
          weight: form.weight,
          opacity: form.opacity,
          serviceId: form.serviceId || null,
          routeIds: form.routeIds || [],
          path: form.path,
          isActive: form.isActive,
        })),
      };

      await updateLanes(dataToSubmit);
      toast.success(t("Success.Updated"));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating lanes:", error);
      toast.error(t("Error.UpdateFailed"));
    }
  };

  const handleLaneFormChange = (
    index: number,
    updates: Partial<(typeof laneForms)[0]>
  ) => {
    setLaneForms((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  const handleOpenMapDialog = (index: number) => {
    setEditingLaneIndex(index);
    setIsMapDialogOpen(true);
  };

  const handleMapDialogApply = (result: MapLinesDialogResult) => {
    if (editingLaneIndex !== null) {
      handleLaneFormChange(editingLaneIndex, {
        path: result.path,
        draftStops: result.draftStops,
        color: result.color,
        weight: result.weight,
        opacity: result.opacity,
      });
    }
    setIsMapDialogOpen(false);
    setEditingLaneIndex(null);
  };

  if (lanes.length === 0) {
    return null;
  }

  return (
    <>
      <CustomDialog
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={t("UpdateDialog.BulkTitle", { count: lanes.length })}
        description={t("UpdateDialog.BulkDescription")}
        rtl={isRTL}
        icon={Info}
      >
        <div className="space-y-6 max-h-[80vh] overflow-y-auto">
          {laneForms.map((form, index) => (
            <div
              key={form.id}
              className="space-y-4 rounded-lg border p-4 bg-muted/30"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  {t("UpdateDialog.LaneNumber", { number: index + 1 })}
                </h3>
                <div className="text-sm text-muted-foreground">
                  {form.path?.length || 0} {t("UpdateDialog.Points")}
                </div>
              </div>

              <LanguageTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                titleFields={form.nameFields as LanguageFields}
                onTitleChange={(fields) => {
                  handleLaneFormChange(index, { nameFields: fields });
                }}
                descriptionFields={
                  (form.descriptionFields || {
                    en: "",
                    ar: null,
                    ckb: null,
                  }) as LanguageFields
                }
                onDescriptionChange={(fields) => {
                  handleLaneFormChange(index, { descriptionFields: fields });
                }}
              />

              <div className="space-y-2">
                <Label>{t("UpdateDialog.PathJSON")}</Label>
                <div className="space-y-3 rounded-lg border border-dashed border-border/60 bg-background p-4">
                  <div>
                    <p className="text-sm font-medium">
                      {form.path && form.path.length
                        ? t("MapDialog.PathSummary", {
                            count: form.path.length,
                          })
                        : t("MapDialog.NoPath")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("MapDialog.SummaryHelper")}
                    </p>
                  </div>
                  {form.path && form.path.length > 0 && (
                    <pre className="max-h-32 overflow-auto rounded-md bg-muted p-2 text-xs">
                      {JSON.stringify(form.path, null, 2)}
                    </pre>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenMapDialog(index)}
                    className="w-full"
                  >
                    {form.path && form.path.length
                      ? t("MapDialog.EditPath")
                      : t("MapDialog.OpenBuilder")}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("UpdateDialog.Color")}</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={form.color}
                      onChange={(e) =>
                        handleLaneFormChange(index, { color: e.target.value })
                      }
                      className="h-10 w-16 rounded-md border"
                    />
                    <Input
                      value={form.color}
                      onChange={(e) =>
                        handleLaneFormChange(index, { color: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("UpdateDialog.Weight")}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={form.weight}
                    onChange={(e) =>
                      handleLaneFormChange(index, {
                        weight: Number(e.target.value) || 1,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("UpdateDialog.Opacity")}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min={0.1}
                    max={1}
                    value={form.opacity}
                    onChange={(e) =>
                      handleLaneFormChange(index, {
                        opacity: Number(e.target.value) || 0.8,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("UpdateDialog.TransportService")}</Label>
                  <SelectWithPagination
                    key={`service-${form.id}-${form.serviceId || ""}`}
                    fetchFunction={useFetchTransportServices}
                    fields={[
                      {
                        key: "name",
                        label: t("Common.Name"),
                        type: "relation",
                        relationKey: "en",
                      },
                      {
                        key: "type",
                        label: t("Table.ServiceType"),
                      },
                    ]}
                    onSelect={(item) => {
                      setSelectedServices((prev) => ({
                        ...prev,
                        [form.id]: item as TransportServiceWithRelations | null,
                      }));
                      handleLaneFormChange(index, {
                        serviceId: item?.id || null,
                      });
                    }}
                    placeholder={t("SelectTransportService")}
                    canClear
                    defaultValue={selectedServices[form.id] || undefined}
                    value={selectedServices[form.id]?.id ?? ""}
                  />
                </div>
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
                      [form.id]: items,
                    }));
                    handleLaneFormChange(index, {
                      routeIds: items.map((item) => item.id),
                    });
                  }}
                  placeholder={t("SelectRoutes")}
                  defaultValue={selectedRoutes[form.id] || []}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>{t("UpdateDialog.IsActive")}</Label>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    handleLaneFormChange(index, { isActive: checked })
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
              {t("UpdateDialog.BulkUpdate", { count: lanes.length })}
            </Button>
          </div>
        </div>
      </CustomDialog>

      {editingLaneIndex !== null && (
        <MapLinesDialog
          isOpen={isMapDialogOpen}
          onOpenChange={(open) => {
            setIsMapDialogOpen(open);
            if (!open) setEditingLaneIndex(null);
          }}
          onApply={handleMapDialogApply}
          initialPath={laneForms[editingLaneIndex]?.path || []}
          initialDraftStops={laneForms[editingLaneIndex]?.draftStops || []}
          initialColor={laneForms[editingLaneIndex]?.color || "#0066CC"}
          initialWeight={laneForms[editingLaneIndex]?.weight || 5}
          initialOpacity={laneForms[editingLaneIndex]?.opacity || 0.8}
          referenceLanes={[]}
          referenceRoutes={[]}
          referenceStops={[]}
          isSubmitting={isUpdating}
        />
      )}
    </>
  );
};
