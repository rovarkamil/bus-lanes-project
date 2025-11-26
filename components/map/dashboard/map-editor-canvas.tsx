"use client";

import {
  useState,
  useMemo,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import L from "leaflet";
import { MapDataPayload, CoordinateTuple } from "@/types/map";
import { LaneDrawingTool } from "./lane-drawing-tool";
import { MapEditorControls } from "./map-editor-controls";
import { ExistingLayers } from "./existing-layers";
// import { MapIconWithRelations } from "@/types/models/map-icon";
import { MapEditorLaneDraft } from "@/types/models/bus-lane";
import { Marker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: LatLngExpression = [36.1911, 44.0092];

// Helper to create stop marker icon
const createStopMarkerIcon = () => {
  if (typeof window === "undefined") return null;

  return L.icon({
    iconUrl: "/markers/stop-sign.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Map controller component to handle panning
interface MapControllerHandle {
  panTo: (lat: number, lng: number, zoom?: number) => void;
}

const MapController = forwardRef<MapControllerHandle>((_, ref) => {
  const map = useMap();

  useImperativeHandle(ref, () => ({
    panTo: (lat: number, lng: number, zoom?: number) => {
      map.setView([lat, lng], zoom || map.getZoom(), {
        animate: true,
        duration: 0.5,
      });
    },
  }));

  return null;
});

MapController.displayName = "MapController";

interface DraftStop {
  id: string;
  latitude: number;
  longitude: number;
  name?: {
    en: string;
    ar?: string | null;
    ckb?: string | null;
  };
}

interface MapEditorCanvasProps {
  data?: MapDataPayload;
  isPending?: boolean;
  error?: Error | null;
  className?: string;
  initialCenter?: CoordinateTuple | null;
  // selectedIcon?: MapIconWithRelations | null;
  // onIconPlace?: (icon: MapIconWithRelations, position: CoordinateTuple) => void;
  // placedIcons?: Array<{
  //   id: string;
  //   icon: MapIconWithRelations;
  //   position: CoordinateTuple;
  // }>;
  // onPlacedIconUpdate?: (iconId: string, position: CoordinateTuple) => void;
  // onPlacedIconRemove?: (iconId: string) => void;
  draftLanes: MapEditorLaneDraft[];
  onDraftLanesChange: (lanes: MapEditorLaneDraft[]) => void;
  draftStops?: DraftStop[];
  onAddDraftStop?: (position: CoordinateTuple) => void;
  editorMode?: "lane" | "stop";
  selectedLaneId?: string | null;
  onLaneSelect?: (laneId: string) => void;
  editingStopId?: string | null;
  editingStopNewPosition?: { latitude: number; longitude: number } | null;
  onStopPositionUpdate?: (stopId: string, position: CoordinateTuple) => void;
  mapControllerRef?: React.RefObject<MapControllerHandle>;
  selectedPoint?: { laneIndex: number; pointIndex: number } | null;
  onSelectedPointChange?: (
    point: { laneIndex: number; pointIndex: number } | null
  ) => void;
}

export type { MapControllerHandle };

export function MapEditorCanvas({
  data,
  isPending,
  error,
  className,
  initialCenter: propInitialCenter,
  // selectedIcon,
  // onIconPlace,
  // placedIcons,
  // onPlacedIconUpdate,
  draftLanes,
  onDraftLanesChange,
  draftStops = [],
  onAddDraftStop,
  editorMode = "lane",
  selectedLaneId: propSelectedLaneId,
  onLaneSelect,
  editingStopId,
  editingStopNewPosition,
  onStopPositionUpdate,
  mapControllerRef,
  selectedPoint,
  onSelectedPointChange,
}: MapEditorCanvasProps) {
  const [selectedLaneId, setSelectedLaneId] = useState<string | null>(null);
  const [isLeafletReady, setIsLeafletReady] = useState(false);

  // Use prop selectedLaneId if provided
  const effectiveSelectedLaneId =
    propSelectedLaneId !== undefined ? propSelectedLaneId : selectedLaneId;
  const isDrawingMode = editorMode === "lane";

  // Fix Leaflet's default icon path issue
  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setIsLeafletReady(true);
    }
  }, []);

  const center = useMemo(() => {
    // Use initial center from settings if provided
    if (propInitialCenter) {
      return propInitialCenter as LatLngExpression;
    }
    // Calculate center from data or use default
    if (data?.stops?.length) {
      const firstStop = data.stops[0];
      return [firstStop.latitude, firstStop.longitude] as LatLngExpression;
    }
    return DEFAULT_CENTER;
  }, [propInitialCenter, data]);

  // Helper to create Leaflet icon from MapIcon - COMMENTED OUT FOR NOW
  // const createIconFromMapIcon = (
  //   mapIcon: MapIconWithRelations
  // ): L.Icon | null => {
  //   if (!mapIcon.file?.url || typeof window === "undefined") return null;

  //   try {
  //     const size = mapIcon.iconSize ?? 32;
  //     return L.icon({
  //       iconUrl: mapIcon.file.url,
  //       iconSize: [size, size],
  //       iconAnchor: [
  //         mapIcon.iconAnchorX ?? size / 2,
  //         mapIcon.iconAnchorY ?? size,
  //       ],
  //       popupAnchor: [
  //         mapIcon.popupAnchorX ?? 0,
  //         mapIcon.popupAnchorY ?? -size / 2,
  //       ],
  //     });
  //   } catch (error) {
  //     console.warn(`Failed to create icon for ${mapIcon.id}:`, error);
  //     return null;
  //   }
  // };

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">{error.message}</p>
      </div>
    );
  }

  if (isPending || !isLeafletReady) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-2 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">
            {isPending ? "Loading map data..." : "Initializing map..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className} z-0`}>
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom
        className="h-full w-full z-0 "
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {mapControllerRef && <MapController ref={mapControllerRef} />}

        <ExistingLayers
          lanes={data?.lanes ?? []}
          stops={data?.stops ?? []}
          routes={data?.routes ?? []}
          selectedLaneId={effectiveSelectedLaneId}
          onLaneClick={(laneId: string) => {
            if (onLaneSelect) {
              onLaneSelect(laneId);
            } else {
              setSelectedLaneId(laneId);
            }
          }}
          editingStopId={editingStopId}
          editingStopNewPosition={editingStopNewPosition}
          onStopPositionUpdate={onStopPositionUpdate}
        />

        <LaneDrawingTool
          draftLanes={draftLanes}
          onDraftLanesChange={onDraftLanesChange}
          selectedLaneId={effectiveSelectedLaneId}
          onLaneSelect={(laneId) => {
            if (laneId) {
              if (onLaneSelect) {
                onLaneSelect(laneId);
              } else {
                setSelectedLaneId(laneId);
              }
            } else {
              setSelectedLaneId(null);
            }
          }}
          isDrawingMode={isDrawingMode}
          editorMode={editorMode}
          onAddDraftStop={onAddDraftStop}
          selectedPoint={selectedPoint}
          onSelectedPointChange={onSelectedPointChange}
          services={data?.services?.map((s) => ({
            id: s.id,
            icon: s.icon
              ? {
                  fileUrl: s.icon.fileUrl,
                  iconSize: s.icon.iconSize ?? undefined,
                  iconAnchorX: s.icon.iconAnchorX ?? undefined,
                  iconAnchorY: s.icon.iconAnchorY ?? undefined,
                  popupAnchorX: s.icon.popupAnchorX ?? undefined,
                  popupAnchorY: s.icon.popupAnchorY ?? undefined,
                }
              : undefined,
          }))}
          // selectedIcon={selectedIcon}
          // onIconPlace={onIconPlace}
        />

        {/* Render draft stops */}
        {draftStops.map((stop) => {
          const stopIcon = createStopMarkerIcon();
          if (!stopIcon) return null;

          return (
            <Marker
              key={stop.id}
              position={[stop.latitude, stop.longitude]}
              icon={stopIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const newPosition = marker.getLatLng();
                  // Update stop position
                  console.log("Stop dragged:", stop.id, newPosition);
                },
              }}
            >
              <Tooltip sticky>{stop.name?.en || "Draft Stop"}</Tooltip>
            </Marker>
          );
        })}

        {/* Render placed icons - COMMENTED OUT FOR NOW */}
        {/* {placedIcons
          ?.map((placedIcon) => {
            const customIcon = createIconFromMapIcon(placedIcon.icon);
            if (!customIcon) return null;

            return {
              ...placedIcon,
              customIcon,
            };
          })
          .filter((item) => item !== null)
          .map((item) => (
            <Marker
              key={item.id}
              position={item.position}
              icon={item.customIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const newPosition = marker.getLatLng();
                  onPlacedIconUpdate?.(item.id, [
                    newPosition.lat,
                    newPosition.lng,
                  ]);
                },
              }}
            >
              <Tooltip sticky>{item.icon.name?.en ?? item.icon.id}</Tooltip>
            </Marker>
          ))} */}

        <MapEditorControls />
      </MapContainer>
    </div>
  );
}
