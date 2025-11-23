"use client";

import { useSession } from "next-auth/react";
import { Permission } from "@prisma/client";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useMapEditorData } from "@/hooks/employee-hooks/use-map";
import { hasPermission } from "@/lib/utils";
import { useTranslation } from "@/i18n/client";
import { PageHeader } from "@/components/page-header";
// import { MapIconWithRelations } from "@/types/models/map-icon";
import { CoordinateTuple } from "@/types/map";
import { MapEditorLaneDraft } from "@/types/models/bus-lane";
import type { MapControllerHandle } from "@/components/map/dashboard/map-editor-canvas";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { settingsMap } from "@/lib/settings";
import { useDeleteBusStop } from "@/hooks/employee-hooks/use-bus-stop";
import { toast } from "sonner";

// Dynamically import all components that depend on Leaflet with no SSR
const MapEditorCanvas = dynamic(
  () =>
    import("@/components/map/dashboard/map-editor-canvas").then((mod) => ({
      default: mod.MapEditorCanvas,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-2 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    ),
  }
);

const MapEditorSidebar = dynamic(
  () =>
    import("@/components/map/dashboard/map-editor-sidebar").then((mod) => ({
      default: mod.MapEditorSidebar,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center border-r w-80">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    ),
  }
);

// Map Icon Selector - COMMENTED OUT FOR NOW
// const MapIconSelector = dynamic(
//   () =>
//     import("@/components/map/dashboard/map-icon-selector").then((mod) => ({
//       default: mod.MapIconSelector,
//     })),
//   {
//     ssr: false,
//   }
// );

export default function MapEditorPage() {
  const { t, i18n } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  const { data: session } = useSession();
  const canEdit = hasPermission(session, Permission.EDIT_MAP);
  const { data, isPending, error, refetch } = useMapEditorData({
    enabled: canEdit,
  });
  const { getSetting } = useSettingsStore();

  // Get starting location from settings
  const initialCenter = useMemo(() => {
    const value = getSetting(settingsMap.STARTING_POSITION);
    if (!value) return null;
    try {
      const parsed = JSON.parse(value) as { lat: number; lng: number };
      if (
        typeof parsed.lat === "number" &&
        typeof parsed.lng === "number" &&
        !isNaN(parsed.lat) &&
        !isNaN(parsed.lng)
      ) {
        return [parsed.lat, parsed.lng] as CoordinateTuple;
      }
    } catch {
      // Invalid JSON
    }
    return null;
  }, [getSetting]);

  // Icon placement state - COMMENTED OUT FOR NOW
  // const [selectedIcon, setSelectedIcon] = useState<MapIconWithRelations | null>(
  //   null
  // );
  // const [placedIcons, setPlacedIcons] = useState<
  //   Array<{
  //     id: string;
  //     icon: MapIconWithRelations;
  //     position: CoordinateTuple;
  //   }>
  // >([]);

  // Draft lanes state
  const [draftLanes, setDraftLanes] = useState<MapEditorLaneDraft[]>([]);

  // Undo/Redo history for lanes
  const [laneHistory, setLaneHistory] = useState<MapEditorLaneDraft[][]>([[]]);
  const [laneHistoryIndex, setLaneHistoryIndex] = useState(0);

  // Editor mode state
  const [editorMode, setEditorMode] = useState<"lane" | "stop">("lane");

  // Selected lane for editing
  const [selectedLaneId, setSelectedLaneId] = useState<string | null>(null);

  // Selected point for deletion (laneIndex, pointIndex)
  const [selectedPoint, setSelectedPoint] = useState<{
    laneIndex: number;
    pointIndex: number;
  } | null>(null);

  // Selected stop for position editing
  const [editingStopId, setEditingStopId] = useState<string | null>(null);
  const [editingStopNewPosition, setEditingStopNewPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Draft stops state
  interface DraftStop {
    id: string;
    latitude: number;
    longitude: number;
    name?: string;
  }
  const [draftStops, setDraftStops] = useState<DraftStop[]>([]);

  // Undo/Redo history for stops
  const [stopHistory, setStopHistory] = useState<DraftStop[][]>([[]]);
  const [stopHistoryIndex, setStopHistoryIndex] = useState(0);

  // Delete hooks
  const { mutateAsync: deleteBusStop } = useDeleteBusStop();

  // Map controller ref for programmatic control
  const mapControllerRef = useRef<MapControllerHandle>(null);

  // Pan to location callback
  const handlePanToLocation = useCallback(
    (lat: number, lng: number, zoom?: number) => {
      if (mapControllerRef.current) {
        mapControllerRef.current.panTo(lat, lng, zoom);
      }
    },
    []
  );

  // const handlePlacedIconUpdate = (
  //   iconId: string,
  //   position: CoordinateTuple
  // ) => {
  //   setPlacedIcons((prev) =>
  //     prev.map((icon) => (icon.id === iconId ? { ...icon, position } : icon))
  //   );
  // };

  const handleLaneSelect = (laneId: string) => {
    setSelectedLaneId(laneId);
    // Find the lane and set it as draft for editing
    const lane = data?.data?.lanes.find((l) => l.id === laneId);
    if (lane) {
      setDraftLanes([
        {
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
      setEditorMode("lane");
    }
  };

  const handleStopPositionUpdate = useCallback(
    (stopId: string, position: CoordinateTuple) => {
      // Store the new position for the editing stop
      if (editingStopId === stopId) {
        setEditingStopNewPosition({
          latitude: position[0],
          longitude: position[1],
        });
      }
    },
    [editingStopId]
  );

  // Track if we're performing undo/redo to prevent saving history
  const isUndoRedoRef = useRef(false);

  // Save state to history
  const saveLaneHistory = useCallback(
    (lanes: MapEditorLaneDraft[], skipIfUndoRedo = true) => {
      if (skipIfUndoRedo && isUndoRedoRef.current) {
        return;
      }
      setLaneHistory((prev) => {
        const newHistory = prev.slice(0, laneHistoryIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(lanes)));
        return newHistory.slice(-50); // Keep last 50 states
      });
      setLaneHistoryIndex((prev) => {
        const newIndex = Math.min(prev + 1, 49);
        return newIndex;
      });
    },
    [laneHistoryIndex]
  );

  const saveStopHistory = useCallback(
    (stops: DraftStop[], skipIfUndoRedo = true) => {
      if (skipIfUndoRedo && isUndoRedoRef.current) {
        return;
      }
      setStopHistory((prev) => {
        const newHistory = prev.slice(0, stopHistoryIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(stops)));
        return newHistory.slice(-50); // Keep last 50 states
      });
      setStopHistoryIndex((prev) => {
        const newIndex = Math.min(prev + 1, 49);
        return newIndex;
      });
    },
    [stopHistoryIndex]
  );

  // Undo/Redo handlers
  const handleUndoLanes = useCallback(() => {
    if (laneHistoryIndex > 0) {
      isUndoRedoRef.current = true;
      const newIndex = laneHistoryIndex - 1;
      setLaneHistoryIndex(newIndex);
      setDraftLanes(JSON.parse(JSON.stringify(laneHistory[newIndex])));
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 100);
    }
  }, [laneHistory, laneHistoryIndex]);

  const handleRedoLanes = useCallback(() => {
    if (laneHistoryIndex < laneHistory.length - 1) {
      isUndoRedoRef.current = true;
      const newIndex = laneHistoryIndex + 1;
      setLaneHistoryIndex(newIndex);
      setDraftLanes(JSON.parse(JSON.stringify(laneHistory[newIndex])));
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 100);
    }
  }, [laneHistory, laneHistoryIndex]);

  const handleUndoStops = useCallback(() => {
    if (stopHistoryIndex > 0) {
      isUndoRedoRef.current = true;
      const newIndex = stopHistoryIndex - 1;
      setStopHistoryIndex(newIndex);
      setDraftStops(JSON.parse(JSON.stringify(stopHistory[newIndex])));
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 100);
    }
  }, [stopHistory, stopHistoryIndex]);

  const handleRedoStops = useCallback(() => {
    if (stopHistoryIndex < stopHistory.length - 1) {
      isUndoRedoRef.current = true;
      const newIndex = stopHistoryIndex + 1;
      setStopHistoryIndex(newIndex);
      setDraftStops(JSON.parse(JSON.stringify(stopHistory[newIndex])));
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 100);
    }
  }, [stopHistory, stopHistoryIndex]);

  // Delete handlers - Delete selected point from lane
  const handleDeletePoint = useCallback(() => {
    if (!selectedPoint) {
      return;
    }

    const { laneIndex, pointIndex } = selectedPoint;

    if (laneIndex >= 0 && laneIndex < draftLanes.length) {
      const lane = draftLanes[laneIndex];
      if (pointIndex >= 0 && pointIndex < lane.path.length) {
        // Don't allow deleting if it's the only point left
        if (lane.path.length <= 1) {
          toast.error(
            t("Error.CannotDeleteLastPoint") || "Cannot delete the last point"
          );
          return;
        }

        // Remove the point from the path
        const updatedPath = lane.path.filter((_, idx) => idx !== pointIndex);
        const updatedLanes = draftLanes.map((l, idx) => {
          if (idx === laneIndex) {
            return { ...l, path: updatedPath };
          }
          return l;
        });

        setDraftLanes(updatedLanes);
        saveLaneHistory(updatedLanes, false); // Save history for delete operation
        setSelectedPoint(null); // Clear selection after deletion
      }
    }
  }, [selectedPoint, draftLanes, saveLaneHistory, t]);

  const handleDeleteStop = useCallback(async () => {
    if (editingStopId && data?.data) {
      const stop = data.data.stops.find((s) => s.id === editingStopId);
      if (stop) {
        // Delete existing stop
        try {
          await deleteBusStop({ id: editingStopId });
          toast.success(t("Success.Deleted"));
          setEditingStopId(null);
          setEditingStopNewPosition(null);
          refetch();
        } catch (error) {
          console.error("Error deleting stop:", error);
          toast.error(t("Error.DeleteFailed"));
        }
      }
    } else if (draftStops.length > 0) {
      // Delete last draft stop
      const newStops = draftStops.slice(0, -1);
      setDraftStops(newStops);
      saveStopHistory(newStops);
    }
  }, [
    editingStopId,
    data,
    draftStops,
    deleteBusStop,
    refetch,
    t,
    saveStopHistory,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete key or Ctrl+D - Delete selected point or stop
      if (e.key === "Delete" || (e.ctrlKey && e.key === "d")) {
        e.preventDefault();
        if (editorMode === "lane" && selectedPoint) {
          handleDeletePoint();
        } else if (editorMode === "stop") {
          handleDeleteStop();
        }
      }
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (editorMode === "lane") {
          handleUndoLanes();
        } else {
          handleUndoStops();
        }
      }
      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if (
        (e.ctrlKey && e.shiftKey && e.key === "z") ||
        (e.ctrlKey && e.key === "y")
      ) {
        e.preventDefault();
        if (editorMode === "lane") {
          handleRedoLanes();
        } else {
          handleRedoStops();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    editorMode,
    selectedPoint,
    handleDeletePoint,
    handleDeleteStop,
    handleUndoLanes,
    handleRedoLanes,
    handleUndoStops,
    handleRedoStops,
  ]);

  const handleAddDraftStop = (position: CoordinateTuple) => {
    const newStop: DraftStop = {
      id: `draft-stop-${Date.now()}`,
      latitude: position[0],
      longitude: position[1],
    };
    const newStops = [...draftStops, newStop];
    setDraftStops(newStops);
    saveStopHistory(newStops, false); // Save history immediately for new stop
  };

  // const handleIconPlace = (
  //   icon: MapIconWithRelations,
  //   position: CoordinateTuple
  // ) => {
  //   const newPlacedIcon = {
  //     id: `placed-icon-${Date.now()}`,
  //     icon,
  //     position,
  //   };
  //   setPlacedIcons((prev) => [...prev, newPlacedIcon]);
  //   // Clear selection after placing
  //   setSelectedIcon(null);
  // };

  if (!canEdit) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">{t("AccessDenied")}</p>
          <p className="text-muted-foreground">
            {t("YouDontHavePermissionToEditTheMap")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex h-screen flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader
        title={t("MapEditor")}
        description={t("DrawAndEditBusLanesOnTheMap")}
      />
      <div className="flex flex-1 overflow-hidden">
        <MapEditorSidebar
          data={data?.data}
          draftLanes={draftLanes}
          onDraftLanesChange={(lanes) => {
            setDraftLanes(lanes);
            // Save history immediately when lanes change (not during undo/redo)
            saveLaneHistory(lanes, true);
          }}
          draftStops={draftStops}
          onDraftStopsChange={(setter) => {
            setDraftStops((prev) => {
              const newStops =
                typeof setter === "function" ? setter(prev) : setter;
              saveStopHistory(newStops, true);
              return newStops;
            });
          }}
          editorMode={editorMode}
          onEditorModeChange={setEditorMode}
          selectedLaneId={selectedLaneId}
          onSelectedLaneChange={setSelectedLaneId}
          onPanToLocation={handlePanToLocation}
          editingStopId={editingStopId}
          onEditingStopChange={setEditingStopId}
          editingStopNewPosition={editingStopNewPosition}
          onCancelStopEdit={() => {
            setEditingStopId(null);
            setEditingStopNewPosition(null);
          }}
          onRefetch={refetch}
          onDeletePoint={handleDeletePoint}
          onDeleteStop={handleDeleteStop}
          selectedPoint={selectedPoint}
          canUndoLanes={laneHistoryIndex > 0}
          canRedoLanes={laneHistoryIndex < laneHistory.length - 1}
          onUndoLanes={handleUndoLanes}
          onRedoLanes={handleRedoLanes}
          canUndoStops={stopHistoryIndex > 0}
          canRedoStops={stopHistoryIndex < stopHistory.length - 1}
          onUndoStops={handleUndoStops}
          onRedoStops={handleRedoStops}
          className="w-80 border-r"
        />
        <div className="flex-1 overflow-hidden">
          <MapEditorCanvas
            data={data?.data}
            isPending={isPending}
            error={error}
            className="h-full"
            initialCenter={initialCenter}
            // selectedIcon={selectedIcon}
            // onIconPlace={handleIconPlace}
            // placedIcons={placedIcons}
            // onPlacedIconUpdate={handlePlacedIconUpdate}
            draftLanes={draftLanes}
            onDraftLanesChange={(lanes) => {
              setDraftLanes(lanes);
              // Save history immediately when lanes change from map interactions
              saveLaneHistory(lanes, true);
            }}
            draftStops={draftStops}
            onAddDraftStop={handleAddDraftStop}
            editorMode={editorMode}
            selectedLaneId={selectedLaneId}
            onLaneSelect={handleLaneSelect}
            editingStopId={editingStopId}
            editingStopNewPosition={editingStopNewPosition}
            onStopPositionUpdate={handleStopPositionUpdate}
            mapControllerRef={mapControllerRef}
            selectedPoint={selectedPoint}
            onSelectedPointChange={setSelectedPoint}
          />
        </div>
        {/* Map Icon Selector - COMMENTED OUT FOR NOW */}
        {/* <div className="flex-shrink-0 relative z-10">
          <MapIconSelector
            onIconSelect={setSelectedIcon}
            selectedIconId={selectedIcon?.id}
            className="w-64 h-full"
          />
        </div> */}
      </div>
    </main>
  );
}
