"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapDataPayload } from "@/types/map";
import { MapEditorLaneDraft } from "@/types/models/bus-lane";
import { useTranslation } from "@/i18n/client";
import { Edit, Trash2, Save, X, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateBusLanesMapEditorDialog } from "@/components/dialogs/bus-lane/create-bus-lanes-map-editor-dialog";
import { UpdateBusLanesMapEditorDialog } from "@/components/dialogs/bus-lane/update-bus-lanes-map-editor-dialog";
import { UpdateBusStopDialog } from "@/components/dialogs/bus-stop/update-bus-stop-dialog";
import { useUpdateBusStop } from "@/hooks/employee-hooks/use-bus-stop";
import { cn } from "@/lib/utils";
import { BusStopWithRelations } from "@/types/models/bus-stop";
import { BusLaneWithRelations } from "@/types/models/bus-lane";
import { toast } from "sonner";

interface DraftStop {
  id: string;
  latitude: number;
  longitude: number;
  name?: string;
}

interface MapEditorSidebarProps {
  data?: MapDataPayload;
  draftLanes: MapEditorLaneDraft[];
  onDraftLanesChange: (lanes: MapEditorLaneDraft[]) => void;
  draftStops?: DraftStop[];
  onDraftStopsChange?: React.Dispatch<React.SetStateAction<DraftStop[]>>;
  editorMode?: "lane" | "stop";
  onEditorModeChange?: (mode: "lane" | "stop") => void;
  selectedLaneId?: string | null;
  onSelectedLaneChange?: (laneId: string | null) => void;
  onPanToLocation?: (lat: number, lng: number, zoom?: number) => void;
  editingStopId?: string | null;
  onEditingStopChange?: (stopId: string | null) => void;
  editingStopNewPosition?: { latitude: number; longitude: number } | null;
  onCancelStopEdit?: () => void;
  onRefetch?: () => void;
  className?: string;
}

export function MapEditorSidebar({
  data,
  draftLanes,
  onDraftLanesChange,
  draftStops = [],
  onDraftStopsChange,
  editorMode = "lane",
  onEditorModeChange,
  selectedLaneId,
  onSelectedLaneChange,
  onPanToLocation,
  editingStopId,
  onEditingStopChange,
  editingStopNewPosition,
  onCancelStopEdit,
  onRefetch,
  className,
}: MapEditorSidebarProps) {
  const { t } = useTranslation("Map");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateLanesDialogOpen, setIsUpdateLanesDialogOpen] = useState(false);
  const [isUpdateStopDialogOpen, setIsUpdateStopDialogOpen] = useState(false);
  const [selectedStopForEdit, setSelectedStopForEdit] =
    useState<BusStopWithRelations | null>(null);
  const [lanesForUpdate, setLanesForUpdate] = useState<BusLaneWithRelations[]>(
    []
  );

  const { mutateAsync: updateBusStop, isPending: isUpdatingStopPosition } =
    useUpdateBusStop();

  const handleCreateLanes = () => {
    if (draftLanes.length === 0) return;

    // Check if we're editing existing lanes (have IDs) or creating new ones
    const lanesWithIds = draftLanes.filter((lane) => lane.id);

    if (lanesWithIds.length > 0) {
      // We're editing existing lanes - open update dialog
      // Convert MapLane to BusLaneWithRelations format with updated path
      const lanesToUpdate: BusLaneWithRelations[] = data!.lanes
        .filter((lane) => lanesWithIds.some((draft) => draft.id === lane.id))
        .map((lane) => {
          // Find corresponding draft to get updated path
          const draft = lanesWithIds.find((d) => d.id === lane.id);
          return {
            id: lane.id,
            path: draft?.path || lane.path,
            color: lane.color,
            weight: lane.weight,
            opacity: lane.opacity,
            isActive: lane.isActive ?? true,
            serviceId: lane.serviceId,
            nameId: "",
            descriptionId: null,
            name: lane.name
              ? {
                  id: "",
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  deletedAt: null,
                  en: lane.name.en || "",
                  ar: lane.name.ar || null,
                  ckb: lane.name.ckb || null,
                }
              : null,
            description: null,
            images: [],
            stops: [],
            routes: [],
            service: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          } as BusLaneWithRelations;
        });
      setLanesForUpdate(lanesToUpdate);
      setIsUpdateLanesDialogOpen(true);
    } else {
      // We're creating new lanes - open create dialog
      setIsCreateDialogOpen(true);
    }
  };

  const handleDeleteDraftLane = (index: number) => {
    onDraftLanesChange(draftLanes.filter((_, i) => i !== index));
  };

  const handleClearDrafts = () => {
    onDraftLanesChange([]);
  };

  const handleSuccess = () => {
    onDraftLanesChange([]);
    onRefetch?.();
  };

  const handleSaveStopPosition = async () => {
    if (!editingStopId || !editingStopNewPosition || !data) return;

    const stop = data.stops.find((s) => s.id === editingStopId);
    if (!stop) return;

    try {
      await updateBusStop({
        id: editingStopId,
        latitude: editingStopNewPosition.latitude,
        longitude: editingStopNewPosition.longitude,
      });

      toast.success(t("Success.PositionUpdated"));

      // Clear editing state
      if (onEditingStopChange) {
        onEditingStopChange(null);
      }
      if (onCancelStopEdit) {
        onCancelStopEdit();
      }

      // Refresh map data
      onRefetch?.();
    } catch (error) {
      console.error("Error updating stop position:", error);
      toast.error(t("Error.UpdateFailed"));
    }
  };

  return (
    <>
      <div className={`flex flex-col ${className}`}>
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="pb-3">
            <h2 className="text-lg font-semibold">{t("MapEditor")}</h2>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* Editor Mode Toggle */}
            {onEditorModeChange && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={editorMode === "lane" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onEditorModeChange("lane")}
                  className="w-full"
                >
                  {t("LaneMode")}
                </Button>
                <Button
                  type="button"
                  variant={editorMode === "stop" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onEditorModeChange("stop")}
                  className="w-full"
                >
                  {t("StopMode")}
                </Button>
              </div>
            )}

            {/* Save Stop Position Banner */}
            {editingStopId &&
              editingStopNewPosition &&
              editorMode === "stop" && (
                <div className="p-3 bg-primary/10 border border-primary rounded-lg space-y-2">
                  <div className="text-sm font-medium text-primary">
                    {t("PositionChanged")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    New position: {editingStopNewPosition.latitude.toFixed(6)},{" "}
                    {editingStopNewPosition.longitude.toFixed(6)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveStopPosition}
                      disabled={isUpdatingStopPosition}
                      className="flex-1"
                    >
                      {isUpdatingStopPosition ? (
                        <>
                          <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          {t("Saving")}
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-3.5 w-3.5" />
                          {t("SavePosition")}
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (onCancelStopEdit) {
                          onCancelStopEdit();
                        }
                      }}
                      disabled={isUpdatingStopPosition}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}

            {/* Draft Lanes Section */}
            {editorMode === "lane" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t("DraftLanes")}</span>
                  <Badge variant="secondary">{draftLanes.length}</Badge>
                </div>

                {draftLanes.length > 0 && (
                  <div className="space-y-2">
                    <ScrollArea className="h-32">
                      <div className="space-y-1 pr-4">
                        {draftLanes.map((lane, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded border p-2 text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor: lane.color || "#0066CC",
                                }}
                              />
                              <span className="truncate">
                                {lane.name?.en || `Lane ${index + 1}`}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {lane.path.length} pts
                              </Badge>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleDeleteDraftLane(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleCreateLanes}
                        className="flex-1"
                        size="sm"
                      >
                        <Save className="mr-2 h-3.5 w-3.5" />
                        {t("SaveDrafts")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClearDrafts}
                        size="sm"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {draftLanes.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t("ClickMapToDrawLanes")}
                  </p>
                )}
              </div>
            )}

            {/* Draft Stops Section */}
            {editorMode === "stop" && onDraftStopsChange && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t("DraftStops")}</span>
                  <Badge variant="secondary">{draftStops.length}</Badge>
                </div>

                {draftStops.length > 0 && (
                  <div className="space-y-2">
                    <ScrollArea className="h-32">
                      <div className="space-y-1 pr-4">
                        {draftStops.map((stop, index) => (
                          <div
                            key={stop.id}
                            className="flex items-center justify-between rounded border p-2 text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span className="truncate">
                                {stop.name || `Stop ${index + 1}`}
                              </span>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => {
                                onDraftStopsChange((prev: DraftStop[]) =>
                                  prev.filter((s) => s.id !== stop.id)
                                );
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => {
                          // TODO: Open create stops dialog
                          console.log("Save draft stops:", draftStops);
                        }}
                        className="flex-1"
                        size="sm"
                      >
                        <Save className="mr-2 h-3.5 w-3.5" />
                        {t("SaveStops")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onDraftStopsChange([])}
                        size="sm"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {draftStops.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t("ClickMapToPlaceStops")}
                  </p>
                )}
              </div>
            )}

            {/* Existing Lanes Section */}
            {editorMode === "lane" && (
              <div className="space-y-2 flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {t("ExistingLanes")}
                  </span>
                  <Badge variant="secondary">{data?.lanes?.length ?? 0}</Badge>
                </div>

                {data?.lanes && data.lanes.length > 0 && (
                  <ScrollArea className="flex-1">
                    <div className="space-y-1 pr-4">
                      {data.lanes.map((lane) => (
                        <div
                          key={lane.id}
                          className={cn(
                            "flex items-center justify-between rounded border p-2 text-sm hover:bg-accent cursor-pointer transition-colors",
                            selectedLaneId === lane.id &&
                              "bg-accent border-primary"
                          )}
                          onClick={() => {
                            // Highlight the lane on map
                            if (onSelectedLaneChange) {
                              onSelectedLaneChange(lane.id);
                            }
                          }}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className="h-3 w-3 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  lane.color ||
                                  lane.service?.color ||
                                  "#0066CC",
                              }}
                            />
                            <span className="truncate">
                              {lane.name?.en ?? lane.id}
                            </span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Load lane into draft for editing
                              onDraftLanesChange([
                                {
                                  id: lane.id, // Include ID to mark as editing existing
                                  path: lane.path || [],
                                  color: lane.color || "#0066CC",
                                  weight: lane.weight || 5,
                                  opacity: lane.opacity || 0.8,
                                  name: lane.name
                                    ? {
                                        en: lane.name.en || "",
                                        ar: lane.name.ar || null,
                                        ckb: lane.name.ckb || null,
                                      }
                                    : undefined,
                                  isActive: lane.isActive ?? true,
                                  serviceId: lane.serviceId,
                                },
                              ]);
                              // Select and highlight the lane
                              if (onSelectedLaneChange) {
                                onSelectedLaneChange(lane.id);
                              }
                              // Pan map to lane center
                              if (
                                onPanToLocation &&
                                lane.path &&
                                lane.path.length > 0
                              ) {
                                // Calculate center of lane path
                                const latSum = lane.path.reduce(
                                  (sum, point) => sum + point[0],
                                  0
                                );
                                const lngSum = lane.path.reduce(
                                  (sum, point) => sum + point[1],
                                  0
                                );
                                const centerLat = latSum / lane.path.length;
                                const centerLng = lngSum / lane.path.length;
                                onPanToLocation(centerLat, centerLng, 15);
                              }
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {(!data?.lanes || data.lanes.length === 0) && (
                  <p className="text-xs text-muted-foreground">
                    {t("NoExistingLanes")}
                  </p>
                )}
              </div>
            )}

            {/* Existing Stops Section */}
            {editorMode === "stop" && (
              <div className="space-y-2 flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {t("ExistingStops")}
                  </span>
                  <Badge variant="secondary">{data?.stops?.length ?? 0}</Badge>
                </div>

                {data?.stops && data.stops.length > 0 && (
                  <ScrollArea className="flex-1">
                    <div className="space-y-1 pr-4">
                      {data.stops.map((stop) => (
                        <div
                          key={stop.id}
                          className={cn(
                            "flex items-center justify-between rounded border p-2 text-sm hover:bg-accent cursor-pointer transition-colors",
                            editingStopId === stop.id &&
                              "bg-accent border-primary"
                          )}
                          onClick={() => {
                            // Pan to stop when clicking on it
                            if (onPanToLocation) {
                              onPanToLocation(
                                stop.latitude,
                                stop.longitude,
                                16
                              );
                            }
                          }}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="truncate">
                              {stop.name?.en ?? stop.id}
                              {editingStopId === stop.id && (
                                <span className="ml-2 text-xs text-primary">
                                  (Editing Position)
                                </span>
                              )}
                            </span>
                          </div>
                          <Button
                            size="icon"
                            variant={
                              editingStopId === stop.id ? "default" : "ghost"
                            }
                            className="h-6 w-6 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();

                              if (editingStopId === stop.id) {
                                // If already editing, open the update dialog
                                const stopForEdit = {
                                  id: stop.id,
                                  latitude: stop.latitude,
                                  longitude: stop.longitude,
                                  nameId: "",
                                  descriptionId: null,
                                  name: stop.name
                                    ? {
                                        id: "",
                                        createdAt: new Date(),
                                        updatedAt: new Date(),
                                        deletedAt: null,
                                        en: stop.name.en || "",
                                        ar: stop.name.ar || null,
                                        ckb: stop.name.ckb || null,
                                      }
                                    : null,
                                  description: null,
                                  hasShelter:
                                    stop.amenities?.hasShelter ?? false,
                                  hasBench: stop.amenities?.hasBench ?? false,
                                  hasLighting:
                                    stop.amenities?.hasLighting ?? false,
                                  isAccessible:
                                    stop.amenities?.isAccessible ?? false,
                                  hasRealTimeInfo:
                                    stop.amenities?.hasRealTimeInfo ?? false,
                                  iconId: stop.icon?.id || null,
                                  icon: null,
                                  zoneId: stop.zone?.id || null,
                                  zone: null,
                                  order: 0,
                                  images: [],
                                  lanes: [],
                                  routes: [],
                                  schedules: [],
                                  createdAt: new Date(),
                                  updatedAt: new Date(),
                                  deletedAt: null,
                                } as BusStopWithRelations;
                                setSelectedStopForEdit(stopForEdit);
                                setIsUpdateStopDialogOpen(true);
                              } else {
                                // Enter editing mode - allow repositioning
                                if (onEditingStopChange) {
                                  onEditingStopChange(stop.id);
                                }
                                // Pan to stop
                                if (onPanToLocation) {
                                  onPanToLocation(
                                    stop.latitude,
                                    stop.longitude,
                                    16
                                  );
                                }
                              }
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {(!data?.stops || data.stops.length === 0) && (
                  <p className="text-xs text-muted-foreground">
                    {t("NoExistingStops")}
                  </p>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
              <div className="space-y-1">
                <div className="text-muted-foreground">{t("TotalStops")}</div>
                <div className="font-semibold">{data?.stops?.length ?? 0}</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">{t("TotalRoutes")}</div>
                <div className="font-semibold">{data?.routes?.length ?? 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateBusLanesMapEditorDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        lanes={draftLanes}
        onSuccess={handleSuccess}
      />

      {lanesForUpdate.length > 0 && (
        <UpdateBusLanesMapEditorDialog
          isOpen={isUpdateLanesDialogOpen}
          onOpenChange={(open) => {
            setIsUpdateLanesDialogOpen(open);
            if (!open) {
              setLanesForUpdate([]);
            }
          }}
          lanes={lanesForUpdate}
          onSuccess={() => {
            handleSuccess();
            setLanesForUpdate([]);
          }}
        />
      )}

      {selectedStopForEdit && (
        <UpdateBusStopDialog
          isOpen={isUpdateStopDialogOpen}
          onOpenChange={(open) => {
            setIsUpdateStopDialogOpen(open);
            if (!open) {
              setSelectedStopForEdit(null);
            }
          }}
          data={selectedStopForEdit}
          onSuccess={() => {
            setSelectedStopForEdit(null);
            onRefetch?.();
          }}
        />
      )}
    </>
  );
}
