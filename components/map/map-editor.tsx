"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Tooltip,
  FeatureGroup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { LatLngExpression, Icon, LatLng } from "leaflet";
import L from "leaflet";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CoordinateTuple,
  MapDataPayload,
  MapTransportService,
  MapStop,
  MapLane,
  MapRoute,
} from "@/types/map";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Trash2,
  Undo2,
  X,
  Edit,
  Plus,
  Route,
  MapPin,
} from "lucide-react";
import { useTranslation } from "@/i18n/client";
import { toast } from "sonner";
import {
  createDefaultMarkerIcon,
  createStopMarkerIcon,
} from "@/lib/map/marker-icons";
import {
  useCreateBusLane,
  useUpdateBusLane,
  useDeleteBusLane,
} from "@/hooks/employee-hooks/use-bus-lane";
import { useUpdateBusStop } from "@/hooks/employee-hooks/use-bus-stop";
import { BusStopWithRelations } from "@/types/models/bus-stop";
import { CreateTransportServiceDialog } from "@/components/dialogs/transport-service/create-transport-service-dialog";
import { CreateBusScheduleDialog } from "@/components/dialogs/bus-schedule/create-bus-schedule-dialog";
import { CreateBusStopDialog } from "@/components/dialogs/bus-stop/create-bus-stop-dialog";
import { UpdateBusStopDialog } from "@/components/dialogs/bus-stop/update-bus-stop-dialog";
import { CreateZoneDialog } from "@/components/dialogs/zone/create-zone-dialog";
import { CreateBusRouteDialog } from "@/components/dialogs/bus-route/create-bus-route-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DEFAULT_CENTER: LatLngExpression = [36.1911, 44.0092];
const CLOSING_POINT_THRESHOLD = 0.0001; // ~11 meters at equator

interface DraftStop {
  latitude: number;
  longitude: number;
  name?: string;
}

export interface MapEditorSubmission {
  name: string;
  description?: string;
  color: string;
  serviceId?: string;
  path: CoordinateTuple[];
  draftStops: DraftStop[];
}

interface MapEditorProps {
  data?: MapDataPayload;
  isSaving?: boolean;
  onSave?: (payload: MapEditorSubmission) => void;
  onResetDraft?: () => void;
  onRefetch?: () => void;
  className?: string;
}

const MapClickHandler = ({
  onAddPoint,
  onAddStop,
  mode,
  onStopClick,
}: {
  onAddPoint: (point: CoordinateTuple) => void;
  onAddStop: (point: CoordinateTuple) => void;
  mode: "lane" | "stop";
  onStopClick?: (point: CoordinateTuple) => void;
}) => {
  useMapEvents({
    click: (event) => {
      const point: CoordinateTuple = [event.latlng.lat, event.latlng.lng];

      if (mode === "stop" && onStopClick) {
        onStopClick(point);
        return;
      }

      if ((event.originalEvent as MouseEvent)?.shiftKey) {
        onAddStop(point);
        return;
      }

      if (mode === "lane") {
        onAddPoint(point);
      }
    },
  });
  return null;
};

const ServicesSelect = ({
  services,
  current,
  onChange,
  placeholder,
}: {
  services: MapTransportService[];
  current?: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => (
  <Select value={current} onValueChange={onChange}>
    <SelectTrigger>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {services.map((service) => (
        <SelectItem key={service.id} value={service.id}>
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: service.color ?? "#0066CC" }}
            />
            {service.type}
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const ExistingLayers = ({
  stops,
  lanes,
  routes,
  stopIcon,
  defaultIcon,
  onLaneClick,
  onStopClick,
  onRouteClick,
  selectedLaneId,
  selectedStopId,
  selectedStop,
  editorMode,
  onStopDrag,
}: {
  stops: MapStop[];
  lanes: MapLane[];
  routes?: MapRoute[];
  stopIcon?: Icon;
  defaultIcon?: Icon;
  onLaneClick?: (lane: MapLane) => void;
  onStopClick?: (stop: MapStop) => void;
  onRouteClick?: (route: MapRoute) => void;
  selectedLaneId?: string | null;
  selectedStopId?: string | null;
  selectedStop?: MapStop | null;
  editorMode?: "lane" | "stop";
  onStopDrag?: (stopId: string, position: LatLng) => void;
}) => (
  <FeatureGroup>
    {stops.map((stop) => {
      const isSelected = selectedStopId === stop.id;
      const isDraggable = editorMode === "stop" && isSelected;
      // Use different icon for selected stop in edit mode
      const icon = editorMode === "stop" && isSelected ? defaultIcon : stopIcon;
      // Use updated position from selectedStop if this is the selected stop
      const position =
        isSelected && selectedStop
          ? ([selectedStop.latitude, selectedStop.longitude] as [
              number,
              number,
            ])
          : ([stop.latitude, stop.longitude] as [number, number]);
      return (
        <Marker
          key={stop.id}
          position={position}
          icon={icon}
          draggable={isDraggable}
          opacity={isSelected && editorMode === "stop" ? 1 : 0.8}
          eventHandlers={{
            click: () => onStopClick?.(stop),
            dragend: (e) => {
              if (isDraggable && onStopDrag) {
                const marker = e.target;
                const position = marker.getLatLng();
                onStopDrag(stop.id, position);
              }
            },
          }}
        >
          <Tooltip sticky>
            {stop.name?.en ?? stop.id}
            {isSelected && editorMode === "stop" && " • Editing"}
          </Tooltip>
        </Marker>
      );
    })}
    {lanes.map((lane) => (
      <Polyline
        key={lane.id}
        positions={lane.path}
        pathOptions={{
          color: lane.color ?? lane.service?.color ?? "#1d4ed8",
          weight: selectedLaneId === lane.id ? 6 : (lane.weight ?? 4),
          opacity: selectedLaneId === lane.id ? 0.9 : 0.6,
        }}
        eventHandlers={{
          click: () => onLaneClick?.(lane),
        }}
      >
        <Tooltip sticky>{lane.name?.en ?? lane.id}</Tooltip>
      </Polyline>
    ))}
    {routes?.map((route) => (
      <Polyline
        key={route.id}
        positions={route.path || []}
        pathOptions={{
          color: route.color ?? route.service?.color ?? "#f97316",
          weight: 3,
          opacity: 0.4,
          dashArray: "6 6",
        }}
        eventHandlers={{
          click: () => onRouteClick?.(route),
        }}
      >
        <Tooltip sticky>
          {route.routeNumber
            ? `${route.routeNumber} • ${route.name?.en ?? route.id}`
            : (route.name?.en ?? route.id)}
        </Tooltip>
      </Polyline>
    ))}
  </FeatureGroup>
);

// Helper to check if two points are close enough to be considered a closing point
const isClosingPoint = (
  point1: CoordinateTuple,
  point2: CoordinateTuple
): boolean => {
  const latDiff = Math.abs(point1[0] - point2[0]);
  const lngDiff = Math.abs(point1[1] - point2[1]);
  return latDiff < CLOSING_POINT_THRESHOLD && lngDiff < CLOSING_POINT_THRESHOLD;
};

// Helper to normalize path points (merge closing points)
const normalizePathPoints = (points: CoordinateTuple[]): CoordinateTuple[] => {
  if (points.length < 2) return points;
  const first = points[0];
  const last = points[points.length - 1];
  if (isClosingPoint(first, last)) {
    // Remove the last point if it's a closing point
    return points.slice(0, -1);
  }
  return points;
};

// Helper to get effective point count (accounting for closing points)
const getEffectivePointCount = (points: CoordinateTuple[]): number => {
  if (points.length < 2) return points.length;
  const normalized = normalizePathPoints(points);
  return normalized.length;
};

// Component to track map instance and prevent re-initialization
const MapInstanceTracker = ({
  onMapReady,
}: {
  onMapReady: (map: L.Map) => void;
}) => {
  const map = useMap();
  const calledRef = useRef(false);

  useEffect(() => {
    if (map && !calledRef.current) {
      calledRef.current = true;
      onMapReady(map);
    }
  }, [map, onMapReady]);

  return null;
};

export const MapEditor = ({
  data,
  isSaving,
  onResetDraft,
  onRefetch,
  className,
}: MapEditorProps) => {
  const { t, i18n } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  const stopMarkerIcon = useMemo(() => createStopMarkerIcon(), []);
  const defaultMarkerIcon = useMemo(() => createDefaultMarkerIcon(), []);

  // Mutation hooks
  const { mutateAsync: createBusLane, isPending: isCreatingLane } =
    useCreateBusLane();
  const { mutateAsync: updateBusLane, isPending: isUpdatingLane } =
    useUpdateBusLane();
  const { mutateAsync: deleteBusLane, isPending: isDeletingLane } =
    useDeleteBusLane();
  const { mutateAsync: updateBusStop, isPending: isUpdatingStop } =
    useUpdateBusStop();

  // Editor state
  const [editorMode, setEditorMode] = useState<"lane" | "stop">("lane");
  const [draftPath, setDraftPath] = useState<CoordinateTuple[]>([]);
  const [draftStops, setDraftStops] = useState<DraftStop[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#0066CC");
  const [serviceId, setServiceId] = useState<string | undefined>();
  const [selectedLane, setSelectedLane] = useState<MapLane | null>(null);
  const [selectedStop, setSelectedStop] = useState<MapStop | null>(null);
  const [editingMode, setEditingMode] = useState<"draft" | "edit">("draft");

  // Dialog states
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isStopDialogOpen, setIsStopDialogOpen] = useState(false);
  const [isUpdateStopDialogOpen, setIsUpdateStopDialogOpen] = useState(false);
  const [isZoneDialogOpen, setIsZoneDialogOpen] = useState(false);
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [laneToDelete, setLaneToDelete] = useState<string | null>(null);

  // Check if any dialog is open to hide map and prevent re-initialization
  const isAnyDialogOpen =
    isServiceDialogOpen ||
    isScheduleDialogOpen ||
    isStopDialogOpen ||
    isUpdateStopDialogOpen ||
    isZoneDialogOpen ||
    isRouteDialogOpen ||
    isDeleteDialogOpen;

  // Selection states for schedules and stops
  // Note: These are set when clicking routes/stops on the map
  // TODO: Enhance dialogs to accept initial values (routeId, stopId, latitude, longitude)
  // For now, users can manually select route/stop in the dialog
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [scheduleRoute, setScheduleRoute] = useState<MapRoute | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [scheduleStop, setScheduleStop] = useState<MapStop | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stopPosition, setStopPosition] = useState<CoordinateTuple | null>(
    null
  );

  // Map instance management
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapKey] = useState(() => `map-${Date.now()}`); // Stable key for the map lifetime

  const handleMapCreated = useMemo(
    () => (map: L.Map) => {
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = map;
      }
    },
    []
  );

  // Cleanup map instance when component unmounts
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (e) {
          console.warn("Map cleanup warning:", e);
        }
      }
    };
  }, []);

  const canSave =
    editorMode === "lane" && draftPath.length >= 2 && name.trim().length > 2;
  const isSavingLane = isCreatingLane || isUpdatingLane || isSaving;

  const handleAddPoint = (point: CoordinateTuple) => {
    if (editingMode === "edit" && selectedLane) {
      // In edit mode, add to the selected lane's path
      setDraftPath((prev) => {
        const newPath = [...prev, point];
        return normalizePathPoints(newPath);
      });
    } else {
      // In draft mode, add normally
      setDraftPath((prev) => {
        const newPath = [...prev, point];
        return normalizePathPoints(newPath);
      });
    }
  };

  const handleAddStop = (point: CoordinateTuple) => {
    setDraftStops((prev) => [
      ...prev,
      { latitude: point[0], longitude: point[1] },
    ]);
  };

  const handleUndoPoint = () => {
    setDraftPath((prev) => prev.slice(0, prev.length - 1));
  };

  const handleRemovePoint = (index: number) => {
    setDraftPath((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePointDrag = (index: number, newPosition: LatLng) => {
    setDraftPath((prev) => {
      const updated = [...prev];
      updated[index] = [newPosition.lat, newPosition.lng];
      return normalizePathPoints(updated);
    });
  };

  const handleLaneClick = (lane: MapLane) => {
    setSelectedLane(lane);
    setEditingMode("edit");
    setDraftPath(normalizePathPoints(lane.path || []));
    setName(lane.name?.en || "");
    setDescription("");
    setColor(lane.color || "#0066CC");
    setServiceId(lane.serviceId || undefined);
    setDraftStops([]);
  };

  const handleResetDraft = () => {
    setDraftPath([]);
    setDraftStops([]);
    setSelectedLane(null);
    setEditingMode("draft");
    setName("");
    setDescription("");
    setColor("#0066CC");
    setServiceId(undefined);
    onResetDraft?.();
  };

  const handleCancelEdit = () => {
    if (editingMode === "edit") {
      handleResetDraft();
    }
  };

  const handleCancelStopEdit = () => {
    setSelectedStop(null);
  };

  const handleSaveStopPosition = async () => {
    if (!selectedStop) return;

    try {
      await updateBusStop({
        id: selectedStop.id,
        latitude: selectedStop.latitude,
        longitude: selectedStop.longitude,
      });
      toast.success(t("Success.Updated"));
      setSelectedStop(null);
      onRefetch?.();
    } catch (error) {
      console.error("Error updating stop position:", error);
      toast.error(t("Error.UpdateFailed"));
    }
  };

  const handleOpenStopDialog = () => {
    if (selectedStop) {
      setIsUpdateStopDialogOpen(true);
    }
  };

  const handleSubmit = async () => {
    if (!canSave) return;
    const normalizedPath = normalizePathPoints(draftPath);

    if (editingMode === "edit" && selectedLane) {
      // Update existing lane
      try {
        await updateBusLane({
          id: selectedLane.id,
          nameFields: {
            en: name.trim(),
            ar: null,
            ckb: null,
          },
          descriptionFields: description.trim()
            ? { en: description.trim(), ar: null, ckb: null }
            : undefined,
          color,
          serviceId: serviceId || null,
          path: normalizedPath,
          weight: 5,
          opacity: 0.8,
          isActive: true,
        });
        toast.success(t("Success.Updated"));
        handleResetDraft();
        onRefetch?.();
      } catch (error) {
        console.error("Error updating lane:", error);
        toast.error(t("Error.UpdateFailed"));
      }
    } else {
      // Create new lane
      try {
        await createBusLane({
          nameFields: {
            en: name.trim(),
            ar: null,
            ckb: null,
          },
          descriptionFields: description.trim()
            ? { en: description.trim(), ar: null, ckb: null }
            : undefined,
          color,
          serviceId: serviceId || null,
          path: normalizedPath,
          draftStops: draftStops.map((s) => ({
            latitude: s.latitude,
            longitude: s.longitude,
            name: s.name,
          })),
          weight: 5,
          opacity: 0.8,
          isActive: true,
        });
        toast.success(t("Success.Created"));
        handleResetDraft();
        onRefetch?.();
      } catch (error) {
        console.error("Error creating lane:", error);
        toast.error(t("Error.CreateFailed"));
      }
    }
  };

  const handleDeleteLane = async () => {
    if (!laneToDelete) return;

    try {
      await deleteBusLane({ id: laneToDelete });
      toast.success(t("Success.Deleted"));
      setIsDeleteDialogOpen(false);
      setLaneToDelete(null);
      if (selectedLane?.id === laneToDelete) {
        handleResetDraft();
      }
      onRefetch?.();
    } catch (error) {
      console.error("Error deleting lane:", error);
      toast.error(t("Error.DeleteFailed"));
    }
  };

  const handleStopClick = (point: CoordinateTuple) => {
    if (editorMode === "stop") {
      setStopPosition(point);
      setIsStopDialogOpen(true);
    }
  };

  const handleRouteClick = () => {
    // Routes can be clicked to view, but not for schedule creation in editor
  };

  const handleStopMarkerClick = (stop: MapStop) => {
    if (editorMode === "stop") {
      // Select stop for position editing
      setSelectedStop(stop);
    }
  };

  const handleStopDrag = (stopId: string, newPosition: LatLng) => {
    // Update the stop position immediately in the UI
    if (selectedStop && selectedStop.id === stopId) {
      setSelectedStop({
        ...selectedStop,
        latitude: newPosition.lat,
        longitude: newPosition.lng,
      });
    }
  };

  // Memoize center to prevent unnecessary re-renders
  const lastDraftPoint =
    draftPath.length > 0 ? draftPath[draftPath.length - 1] : null;
  const firstStop = data?.stops?.[0];
  const center = useMemo(() => {
    if (lastDraftPoint) {
      return [lastDraftPoint[0], lastDraftPoint[1]] as LatLngExpression;
    }
    if (firstStop) {
      return [firstStop.latitude, firstStop.longitude] as LatLngExpression;
    }
    return DEFAULT_CENTER;
  }, [lastDraftPoint, firstStop]);

  return (
    <div
      className={cn("grid gap-6 lg:grid-cols-[340px,1fr]", className)}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Card className="border-border/70 bg-background/90 shadow-sm">
        <CardHeader>
          <div className="space-y-2">
            <div>
              <h3 className="text-base font-semibold">
                {editorMode === "lane" ? t("EditBusLanes") : t("EditBusStops")}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {editorMode === "lane"
                  ? t("DrawOrEditBusLanesOnTheMap")
                  : t("SelectOrMoveBusStopsOnTheMap")}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Selector - Prominent */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">
              {t("WhatDoYouWantToEdit")}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={editorMode === "lane" ? "default" : "outline"}
                className="h-auto py-3"
                onClick={() => {
                  setEditorMode("lane");
                  setSelectedStop(null);
                  setSelectedLane(null);
                  setEditingMode("draft");
                }}
              >
                <div className="flex flex-col items-center gap-1">
                  <Route className="h-5 w-5" />
                  <span className="text-xs font-medium">{t("BusLanes")}</span>
                </div>
              </Button>
              <Button
                type="button"
                variant={editorMode === "stop" ? "default" : "outline"}
                className="h-auto py-3"
                onClick={() => {
                  setEditorMode("stop");
                  setSelectedLane(null);
                  setEditingMode("draft");
                }}
              >
                <div className="flex flex-col items-center gap-1">
                  <MapPin className="h-5 w-5" />
                  <span className="text-xs font-medium">{t("BusStops")}</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Quick Actions - Only show when not editing */}
          {!selectedLane && !selectedStop && (
            <>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("QuickActions")}
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsServiceDialogOpen(true)}
                    className="justify-start"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("CreateTransportService")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsZoneDialogOpen(true)}
                    className="justify-start"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("CreateZone")}
                  </Button>
                  {editorMode === "stop" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsStopDialogOpen(true)}
                      className="justify-start"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("CreateNewStop")}
                    </Button>
                  )}
                </div>
              </div>
              <div className="border-t" />
            </>
          )}

          {/* Stop Editing Panel - Shows when a stop is selected */}
          {selectedStop && editorMode === "stop" && (
            <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    {selectedStop.name?.en ?? selectedStop.id}
                  </p>
                  <p className="text-xs text-green-700">
                    {t("EditingStopPosition")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleCancelStopEdit}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-green-700">
                  {t("CurrentPosition")}
                </Label>
                <div className="rounded border border-green-200 bg-white p-2 text-xs">
                  <p className="text-green-900">
                    {t("Latitude")}: {selectedStop.latitude.toFixed(6)}
                  </p>
                  <p className="text-green-900">
                    {t("Longitude")}: {selectedStop.longitude.toFixed(6)}
                  </p>
                </div>
                <p className="text-xs text-green-600">
                  {t("DragMarkerToUpdatePosition")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenStopDialog}
                >
                  {t("EditDetails")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveStopPosition}
                  disabled={isUpdatingStop}
                >
                  {isUpdatingStop && (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  )}
                  {t("SavePosition")}
                </Button>
              </div>
            </div>
          )}

          {/* Lane Details Panel - Shows when a lane is selected */}
          {selectedLane && editingMode === "edit" && (
            <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    {selectedLane.name?.en ?? selectedLane.id}
                  </p>
                  <p className="text-xs text-blue-700">{t("LaneDetails")}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleCancelEdit}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Related Entities */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {t("RelatedEntities")}
                </Label>

                {/* Service */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-800">
                      {t("TransportService")}
                    </span>
                    {!selectedLane.serviceId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => setIsServiceDialogOpen(true)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        {t("Create")}
                      </Button>
                    )}
                  </div>
                  {selectedLane.serviceId && selectedLane.service && (
                    <div className="rounded border border-blue-200 bg-white p-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor:
                              selectedLane.service.color ?? "#0066CC",
                          }}
                        />
                        <span className="text-xs">
                          {selectedLane.service.type}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Routes */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-800">{t("Routes")}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setIsRouteDialogOpen(true)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      {t("CreateRoute")}
                    </Button>
                  </div>
                  {data?.routes?.filter((route) =>
                    route.laneIds?.includes(selectedLane.id)
                  ).length ? (
                    <ScrollArea className="max-h-24 rounded border border-blue-200 bg-white">
                      <div className="space-y-1 p-2">
                        {data.routes
                          .filter((route) =>
                            route.laneIds?.includes(selectedLane.id)
                          )
                          .map((route) => (
                            <div
                              key={route.id}
                              className="flex items-center gap-2 rounded p-1.5 text-xs hover:bg-blue-50"
                            >
                              <Route className="h-3 w-3" />
                              <span>
                                {route.routeNumber
                                  ? `${route.routeNumber} • `
                                  : ""}
                                {route.name?.en ?? route.id}
                              </span>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-xs text-blue-600">
                      {t("NoRoutesAssigned")}
                    </p>
                  )}
                </div>

                {/* Schedules */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-800">
                      {t("Schedules")}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        // Find a route for this lane to pre-select
                        const laneRoute = data?.routes?.find((r) =>
                          r.laneIds?.includes(selectedLane.id)
                        );
                        if (laneRoute) {
                          setScheduleRoute(laneRoute);
                        }
                        setIsScheduleDialogOpen(true);
                      }}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      {t("CreateSchedule")}
                    </Button>
                  </div>
                  <p className="text-xs text-blue-600">{t("SchedulesInfo")}</p>
                </div>
              </div>
            </div>
          )}

          {/* Entity List Panel */}
          {!selectedLane &&
            !selectedStop &&
            (data?.lanes?.length ||
              data?.stops?.length ||
              data?.routes?.length) && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("ExistingEntities")}
                </Label>
                <ScrollArea className="max-h-48 rounded border">
                  <div className="space-y-1 p-2">
                    {data?.lanes?.map((lane) => (
                      <div
                        key={lane.id}
                        className="flex items-center justify-between rounded p-2 hover:bg-muted"
                      >
                        <span className="text-sm">
                          {lane.name?.en ?? lane.id}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleLaneClick(lane)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setLaneToDelete(lane.id);
                              setIsDeleteDialogOpen(true);
                            }}
                            disabled={isDeletingLane}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

          {/* Lane Editor (only shown when mode is lane and not editing existing) */}
          {editorMode === "lane" && !selectedLane && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    {t("LaneName")}
                  </Label>
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t("E.g.AirportExpressLane")}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    {t("Description")}
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder={t("OptionalDetailsAboutThisLane")}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    {t("TransportService")}
                  </Label>
                  <ServicesSelect
                    services={data?.services ?? []}
                    current={serviceId}
                    onChange={(value) => setServiceId(value)}
                    placeholder={t("AssignTransportService")}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    {t("LaneColor")}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      className="h-10 w-16 p-1"
                      value={color}
                      onChange={(event) => setColor(event.target.value)}
                    />
                    <Input
                      value={color}
                      onChange={(event) => setColor(event.target.value)}
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>

              {draftPath.length > 0 && (
                <>
                  <div className="border-t" />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">
                        {t("PathPoints")}
                      </Label>
                      <Badge variant="secondary">
                        {getEffectivePointCount(draftPath)} {t("Points")}
                      </Badge>
                    </div>
                    <ScrollArea className="max-h-32 rounded border">
                      <div className="divide-y text-sm">
                        {draftPath.map((point, index) => {
                          const isClosing =
                            index === draftPath.length - 1 &&
                            draftPath.length > 1 &&
                            isClosingPoint(
                              draftPath[0],
                              draftPath[draftPath.length - 1]
                            );
                          return (
                            <div
                              key={`point-${index}`}
                              className="flex items-center justify-between px-3 py-2"
                            >
                              <div>
                                <p className="font-medium">
                                  {isClosing
                                    ? t("ClosingPoint")
                                    : t("PointNumber", { number: index + 1 })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {point[0].toFixed(5)}, {point[1].toFixed(5)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemovePoint(index)}
                                disabled={draftPath.length <= 2}
                                className="h-7 w-7"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                </>
              )}

              <div className="border-t" />

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUndoPoint}
                    disabled={!draftPath.length}
                    size="sm"
                  >
                    <Undo2 className="mr-2 h-4 w-4" />
                    {t("Undo")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetDraft}
                    disabled={!draftPath.length && !draftStops.length}
                    size="sm"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("Clear")}
                  </Button>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!canSave || isSavingLane}
                  className="w-full"
                  size="lg"
                >
                  {isSavingLane && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("SaveLane")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateTransportServiceDialog
        isOpen={isServiceDialogOpen}
        onOpenChange={setIsServiceDialogOpen}
        onSuccess={() => {
          onRefetch?.();
        }}
      />

      <CreateBusScheduleDialog
        isOpen={isScheduleDialogOpen}
        onOpenChange={(open) => {
          setIsScheduleDialogOpen(open);
          if (!open) {
            setScheduleRoute(null);
            setScheduleStop(null);
          }
        }}
        onSuccess={() => {
          setScheduleRoute(null);
          setScheduleStop(null);
          onRefetch?.();
        }}
      />

      <CreateBusStopDialog
        isOpen={isStopDialogOpen}
        onOpenChange={(open) => {
          setIsStopDialogOpen(open);
          if (!open) {
            setStopPosition(null);
          }
        }}
        onSuccess={() => {
          setStopPosition(null);
          onRefetch?.();
        }}
      />

      {selectedStop && (
        <UpdateBusStopDialog
          isOpen={isUpdateStopDialogOpen}
          onOpenChange={(open) => {
            setIsUpdateStopDialogOpen(open);
            if (!open) {
              setSelectedStop(null);
            }
          }}
          data={selectedStop as unknown as BusStopWithRelations}
          onSuccess={() => {
            setSelectedStop(null);
            onRefetch?.();
          }}
        />
      )}

      <CreateZoneDialog
        isOpen={isZoneDialogOpen}
        onOpenChange={setIsZoneDialogOpen}
        onSuccess={() => {
          onRefetch?.();
        }}
      />

      <CreateBusRouteDialog
        isOpen={isRouteDialogOpen}
        onOpenChange={(open) => {
          setIsRouteDialogOpen(open);
        }}
        onSuccess={() => {
          onRefetch?.();
        }}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("Actions.DeleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("Actions.DeleteConfirmMessage")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLane}
              disabled={isDeletingLane}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingLane ? t("Actions.Deleting") : t("Actions.Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="border-border/70 bg-background/90 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("MapWorkspace")}
            </p>
            <p className="text-xs text-muted-foreground">
              {editorMode === "lane"
                ? t("ClickMapToAddPoints")
                : t("ClickStopToEditOrDragToMove")}
            </p>
          </div>
          <Badge variant="secondary">
            {editorMode === "lane" ? (
              <>
                {getEffectivePointCount(draftPath)} {t("Points")}
                {editingMode === "edit" && selectedLane && (
                  <span className="ml-2">• {t("Editing")}</span>
                )}
              </>
            ) : (
              <>
                {data?.stops?.length ?? 0} {t("Stops")}
                {selectedStop && (
                  <span className="ml-2">• {t("Selected")}</span>
                )}
              </>
            )}
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative h-[640px] w-full overflow-hidden rounded-b-lg">
            {isAnyDialogOpen ? (
              <div className="flex h-full w-full items-center justify-center bg-muted/30">
                <div className="text-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {t("MapHiddenWhileDialogOpen")}
                  </p>
                </div>
              </div>
            ) : (
              <MapContainer
                key={mapKey}
                center={center}
                zoom={14}
                scrollWheelZoom
                zoomControl={false}
                className="h-full w-full"
              >
                <MapInstanceTracker onMapReady={handleMapCreated} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ExistingLayers
                  stops={data?.stops ?? []}
                  lanes={data?.lanes ?? []}
                  routes={data?.routes ?? []}
                  stopIcon={stopMarkerIcon}
                  defaultIcon={defaultMarkerIcon}
                  onLaneClick={handleLaneClick}
                  onStopClick={handleStopMarkerClick}
                  onRouteClick={handleRouteClick}
                  selectedLaneId={selectedLane?.id}
                  selectedStopId={selectedStop?.id}
                  selectedStop={selectedStop}
                  editorMode={editorMode}
                  onStopDrag={handleStopDrag}
                />
                <FeatureGroup>
                  <MapClickHandler
                    onAddPoint={handleAddPoint}
                    onAddStop={handleAddStop}
                    mode={editorMode}
                    onStopClick={handleStopClick}
                  />
                  {draftPath.length > 0 && (
                    <>
                      <Polyline
                        positions={draftPath}
                        pathOptions={{
                          color,
                          weight: 5,
                          opacity: editingMode === "edit" ? 0.9 : 0.7,
                        }}
                      />
                      {draftPath.map((point, index) => {
                        const isClosing =
                          index === draftPath.length - 1 &&
                          draftPath.length > 1 &&
                          isClosingPoint(
                            draftPath[0],
                            draftPath[draftPath.length - 1]
                          );
                        return (
                          <Marker
                            key={`${point[0]}-${point[1]}-${index}`}
                            position={point}
                            icon={defaultMarkerIcon}
                            draggable
                            eventHandlers={{
                              dragend: (e) => {
                                const marker = e.target;
                                const position = marker.getLatLng();
                                handlePointDrag(index, position);
                              },
                            }}
                          >
                            <Tooltip sticky>
                              {isClosing
                                ? t("ClosingPoint")
                                : t("PointNumber", { number: index + 1 })}
                            </Tooltip>
                          </Marker>
                        );
                      })}
                    </>
                  )}
                  {draftStops.map((stop, index) => (
                    <Marker
                      key={`${stop.latitude}-${stop.longitude}-${index}`}
                      position={[stop.latitude, stop.longitude]}
                      icon={stopMarkerIcon}
                    >
                      <Tooltip sticky>
                        {t("DraftStopNumber", { number: index + 1 })}
                      </Tooltip>
                    </Marker>
                  ))}
                </FeatureGroup>
              </MapContainer>
            )}
            {!isAnyDialogOpen && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="rounded-full border border-dashed border-border/60 bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-sm">
                  {editorMode === "lane"
                    ? t("ClickOnMapToAddPoints")
                    : t("ClickStopToSelectDragToMove")}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapEditor;
