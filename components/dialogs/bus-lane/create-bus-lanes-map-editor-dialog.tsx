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
import { useCreateBusLanesMapEditor } from "@/hooks/employee-hooks/use-bus-lane";
import {
  MapEditorLaneDraft,
  CreateBusLanesMapEditorData,
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
import { CreateTransportServiceDialog } from "@/components/dialogs/transport-service/create-transport-service-dialog";
import { TransportServiceWithRelations } from "@/types/models/transport-service";

interface CreateBusLanesMapEditorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lanes: MapEditorLaneDraft[];
  onSuccess?: () => void;
}

type SelectableEntity = { id: string; [key: string]: unknown };

export const CreateBusLanesMapEditorDialog: FC<
  CreateBusLanesMapEditorDialogProps
> = ({ isOpen, onOpenChange, lanes, onSuccess }) => {
  const { t, i18n } = useTranslation("BusLanes");
  const isRTL = i18n.language !== "en";
  const [activeTab, setActiveTab] = useState<"english" | "arabic" | "kurdish">(
    "english"
  );
  const [laneForms, setLaneForms] = useState<
    Array<{
      name: { en: string; ar?: string | null; ckb?: string | null };
      description?: {
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
      path: CoordinateTuple[];
      draftStops: MapLinesDialogResult["draftStops"];
    }>
  >([]);
  const [editingLaneIndex, setEditingLaneIndex] = useState<number | null>(null);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);

  const { mutateAsync: createLanes, isPending: isCreating } =
    useCreateBusLanesMapEditor();

  useEffect(() => {
    if (isOpen && lanes.length > 0) {
      setLaneForms(
        lanes.map((lane) => ({
          name: lane.name || { en: "", ar: null, ckb: null },
          description: lane.description,
          color: lane.color || "#0066CC",
          weight: lane.weight || 5,
          opacity: lane.opacity || 0.8,
          serviceId: lane.serviceId || null,
          routeIds: lane.routeIds || [],
          isActive: lane.isActive ?? true,
          path: lane.path || [],
          draftStops: lane.draftStops || [],
        }))
      );
    }
  }, [isOpen, lanes]);

  const handleSubmit = async () => {
    try {
      // Validate all lanes have required fields
      for (let i = 0; i < laneForms.length; i++) {
        const form = laneForms[i];
        if (!form.name.en.trim()) {
          toast.error(t("CreateDialog.NameRequired", { laneNumber: i + 1 }));
          return;
        }
        if (form.path.length < 2) {
          toast.error(t("CreateDialog.PathRequired", { laneNumber: i + 1 }));
          return;
        }
      }

      const dataToSubmit: CreateBusLanesMapEditorData = {
        lanes: laneForms.map((form, index) => ({
          ...lanes[index],
          name: form.name,
          description: form.description,
          color: form.color,
          weight: form.weight,
          opacity: form.opacity,
          serviceId: form.serviceId,
          routeIds: form.routeIds,
          path: form.path,
          draftStops: form.draftStops,
          isActive: form.isActive,
        })),
      };

      await createLanes(dataToSubmit);
      toast.success(t("Success.Created"));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating lanes:", error);
      toast.error(t("Error.CreateFailed"));
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
        title={t("CreateDialog.BulkTitle", { count: lanes.length })}
        description={t("CreateDialog.BulkDescription")}
        rtl={isRTL}
        icon={Info}
      >
        <div className="space-y-6 max-h-[80vh] overflow-y-auto">
          {laneForms.map((form, index) => (
            <div
              key={index}
              className="space-y-4 rounded-lg border p-4 bg-muted/30"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  {t("CreateDialog.LaneNumber", { number: index + 1 })}
                </h3>
                <div className="text-sm text-muted-foreground">
                  {form.path.length} {t("CreateDialog.Points")}
                </div>
              </div>

              <LanguageTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                titleFields={form.name as LanguageFields}
                onTitleChange={(fields) => {
                  handleLaneFormChange(index, { name: fields });
                }}
                descriptionFields={form.description as LanguageFields}
                onDescriptionChange={(fields) => {
                  handleLaneFormChange(index, { description: fields });
                }}
              />

              <div className="space-y-2">
                <Label>{t("CreateDialog.PathJSON")}</Label>
                <div className="space-y-3 rounded-lg border border-dashed border-border/60 bg-background p-4">
                  <div>
                    <p className="text-sm font-medium">
                      {form.path.length
                        ? t("MapDialog.PathSummary", {
                            count: form.path.length,
                          })
                        : t("MapDialog.NoPath")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("MapDialog.SummaryHelper")}
                    </p>
                  </div>
                  {form.path.length > 0 && (
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
                    {form.path.length
                      ? t("MapDialog.EditPath")
                      : t("MapDialog.OpenBuilder")}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("CreateDialog.Color")}</Label>
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
                  <Label>{t("CreateDialog.Weight")}</Label>
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
                  <Label>{t("CreateDialog.Opacity")}</Label>
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
                  <Label>{t("CreateDialog.TransportService")}</Label>
                  <SelectWithPagination
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
                    onSelect={(item) =>
                      handleLaneFormChange(index, {
                        serviceId: item?.id || null,
                      })
                    }
                    placeholder={t("SelectTransportService")}
                    canClear
                    value={form.serviceId || ""}
                    showAddButton
                    addButtonLabel={t("CreateDialog.NewTransportService")}
                    addDialog={
                      <CreateTransportServiceDialog
                        isOpen={false}
                        onOpenChange={() => {}}
                        onSuccess={() => {}}
                      />
                    }
                    onAddSuccess={(newService) => {
                      const created = newService as
                        | TransportServiceWithRelations
                        | undefined;
                      if (created?.id) {
                        handleLaneFormChange(index, {
                          serviceId: created.id,
                        });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("CreateDialog.Routes")}</Label>
                <MultipleSelectWithPagination
                  fetchFunction={useFetchBusRoutes}
                  fields={[
                    {
                      key: "name",
                      label: t("Common.Name"),
                      type: "relation",
                      relationKey: "en",
                    },
                  ]}
                  onSelect={(items: SelectableEntity[]) =>
                    handleLaneFormChange(index, {
                      routeIds: items.map((item) => item.id),
                    })
                  }
                  placeholder={t("SelectRoutes")}
                  defaultValue={
                    form.routeIds?.map((id) => ({ id })) as SelectableEntity[]
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>{t("CreateDialog.IsActive")}</Label>
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
            <Button type="button" onClick={handleSubmit} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("CreateDialog.BulkCreate", { count: lanes.length })}
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
          isSubmitting={isCreating}
        />
      )}
    </>
  );
};
