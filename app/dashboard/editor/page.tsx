"use client";

import { useSession } from "next-auth/react";
import { Permission } from "@prisma/client";
import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useMapEditorData } from "@/hooks/employee-hooks/use-map";
import { hasPermission } from "@/lib/utils";
import { useTranslation } from "@/i18n/client";
import { PageHeader } from "@/components/page-header";
import { MapIconWithRelations } from "@/types/models/map-icon";
import { CoordinateTuple } from "@/types/map";
import { MapEditorLaneDraft } from "@/types/models/bus-lane";
import type { MapControllerHandle } from "./components/map-editor-canvas";

// Dynamically import all components that depend on Leaflet with no SSR
const MapEditorCanvas = dynamic(
  () =>
    import("./components/map-editor-canvas").then((mod) => ({
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
    import("./components/map-editor-sidebar").then((mod) => ({
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

const MapIconSelector = dynamic(
  () =>
    import("./components/map-icon-selector").then((mod) => ({
      default: mod.MapIconSelector,
    })),
  {
    ssr: false,
  }
);

export default function MapEditorPage() {
  const { t, i18n } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  const { data: session } = useSession();
  const canEdit = hasPermission(session, Permission.EDIT_MAP);
  const { data, isPending, error, refetch } = useMapEditorData({
    enabled: canEdit,
  });

  // Icon placement state
  const [selectedIcon, setSelectedIcon] = useState<MapIconWithRelations | null>(
    null
  );
  const [placedIcons, setPlacedIcons] = useState<
    Array<{
      id: string;
      icon: MapIconWithRelations;
      position: CoordinateTuple;
    }>
  >([]);

  // Draft lanes state
  const [draftLanes, setDraftLanes] = useState<MapEditorLaneDraft[]>([]);

  // Editor mode state
  const [editorMode, setEditorMode] = useState<"lane" | "stop">("lane");

  // Selected lane for editing
  const [selectedLaneId, setSelectedLaneId] = useState<string | null>(null);

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

  const handlePlacedIconUpdate = (
    iconId: string,
    position: CoordinateTuple
  ) => {
    setPlacedIcons((prev) =>
      prev.map((icon) => (icon.id === iconId ? { ...icon, position } : icon))
    );
  };

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

  const handleAddDraftStop = (position: CoordinateTuple) => {
    const newStop: DraftStop = {
      id: `draft-stop-${Date.now()}`,
      latitude: position[0],
      longitude: position[1],
    };
    setDraftStops((prev) => [...prev, newStop]);
  };

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
          onDraftLanesChange={setDraftLanes}
          draftStops={draftStops}
          onDraftStopsChange={setDraftStops}
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
          className="w-80 border-r"
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 min-h-0">
            <MapEditorCanvas
              data={data?.data}
              isPending={isPending}
              error={error}
              className="h-full"
              placedIcons={placedIcons}
              onPlacedIconUpdate={handlePlacedIconUpdate}
              draftLanes={draftLanes}
              onDraftLanesChange={setDraftLanes}
              draftStops={draftStops}
              onAddDraftStop={handleAddDraftStop}
              editorMode={editorMode}
              selectedLaneId={selectedLaneId}
              onLaneSelect={handleLaneSelect}
              editingStopId={editingStopId}
              onStopPositionUpdate={handleStopPositionUpdate}
              mapControllerRef={mapControllerRef}
            />
          </div>
          <div className="flex-shrink-0 relative z-10">
            <MapIconSelector
              onIconSelect={setSelectedIcon}
              selectedIconId={selectedIcon?.id}
              className="h-28"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
