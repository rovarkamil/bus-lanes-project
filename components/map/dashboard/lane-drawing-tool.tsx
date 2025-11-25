"use client";

import React from "react";
import { useMapEvents, Marker, Polyline, Tooltip } from "react-leaflet";
import { LatLng, LeafletEventHandlerFnMap } from "leaflet";
import { CoordinateTuple } from "@/types/map";
import { MapEditorLaneDraft } from "@/types/models/bus-lane";
// import { MapIconWithRelations } from "@/types/models/map-icon";
import L from "leaflet";

interface LaneDrawingToolProps {
  draftLanes: MapEditorLaneDraft[];
  onDraftLanesChange: (lanes: MapEditorLaneDraft[]) => void;
  selectedLaneId: string | null;
  onLaneSelect: (laneId: string | null) => void;
  isDrawingMode: boolean;
  editorMode?: "lane" | "stop";
  onAddDraftStop?: (position: CoordinateTuple) => void;
  selectedPoint?: { laneIndex: number; pointIndex: number } | null;
  onSelectedPointChange?: (
    point: { laneIndex: number; pointIndex: number } | null
  ) => void;
  services?: Array<{
    id: string;
    icon?: {
      fileUrl: string;
      iconSize?: number | null;
      iconAnchorX?: number | null;
      iconAnchorY?: number | null;
      popupAnchorX?: number | null;
      popupAnchorY?: number | null;
    } | null;
  }>;
  // selectedIcon?: MapIconWithRelations | null;
  // onIconPlace?: (icon: MapIconWithRelations, position: CoordinateTuple) => void;
}

// Create a custom marker icon - memoize it
let defaultMarkerIcon: L.Icon | null = null;

const getDefaultMarkerIcon = () => {
  if (defaultMarkerIcon) return defaultMarkerIcon;
  if (typeof window === "undefined") return null;

  defaultMarkerIcon = L.icon({
    iconUrl: "/markers/marker.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  return defaultMarkerIcon;
};

export function LaneDrawingTool({
  draftLanes,
  onDraftLanesChange,
  selectedLaneId,
  onLaneSelect,
  isDrawingMode,
  editorMode = "lane",
  onAddDraftStop,
  selectedPoint,
  onSelectedPointChange,
  services = [],
  // selectedIcon,
  // onIconPlace,
}: LaneDrawingToolProps) {
  const updateLanePoint = (
    laneIndex: number,
    pointIndex: number,
    position: LatLng
  ) => {
    const updatedLanes = draftLanes.map((lane, idx) => {
      if (idx !== laneIndex) return lane;
      const updatedPath = [...lane.path];
      updatedPath[pointIndex] = [position.lat, position.lng];
      return { ...lane, path: updatedPath };
    });
    onDraftLanesChange(updatedLanes);
  };

  const handleMapClick = (event: { latlng: LatLng }) => {
    const point: CoordinateTuple = [event.latlng.lat, event.latlng.lng];

    // Icon placement - COMMENTED OUT FOR NOW
    // if (selectedIcon && onIconPlace) {
    //   onIconPlace(selectedIcon, point);
    //   return;
    // }

    // If in stop mode, add draft stop
    if (editorMode === "stop" && onAddDraftStop) {
      onAddDraftStop(point);
      return;
    }

    // If in lane mode and drawing is enabled
    if (!isDrawingMode || editorMode !== "lane") return;

    if (draftLanes.length === 0) {
      // Create first lane
      const newLane: MapEditorLaneDraft = {
        path: [point],
        color: "#0066CC",
        weight: 5,
        opacity: 0.8,
        isActive: true,
      };
      onDraftLanesChange([newLane]);
    } else {
      // Add point to the last lane (current active lane)
      const updatedLanes = [...draftLanes];
      const lastLaneIndex = updatedLanes.length - 1;
      updatedLanes[lastLaneIndex] = {
        ...updatedLanes[lastLaneIndex],
        path: [...updatedLanes[lastLaneIndex].path, point],
      };
      onDraftLanesChange(updatedLanes);
    }
  };

  useMapEvents({
    click: handleMapClick,
  });

  const defaultIcon = getDefaultMarkerIcon();

  // Helper to get icon for start/end markers
  const getMarkerIcon = (
    lane: MapEditorLaneDraft,
    isStart: boolean
  ): L.Icon | undefined => {
    // Check if lane has service with icon
    if (lane.serviceId) {
      const service = services.find((s) => s.id === lane.serviceId);
      if (service?.icon?.fileUrl) {
        try {
          const size = service.icon.iconSize ?? 32;
          return L.icon({
            iconUrl: service.icon.fileUrl,
            iconSize: [size, size],
            iconAnchor: [
              service.icon.iconAnchorX ?? size / 2,
              service.icon.iconAnchorY ?? size,
            ],
            popupAnchor: [
              service.icon.popupAnchorX ?? 0,
              service.icon.popupAnchorY ?? -size / 2,
            ],
          });
        } catch (error) {
          console.warn(`Failed to create service icon for draft lane:`, error);
        }
      }
    }

    // Use default markers
    if (typeof window !== "undefined") {
      try {
        return L.icon({
          iconUrl: isStart ? "/markers/starting.png" : "/markers/end.png",
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });
      } catch (error) {
        console.warn(`Failed to create default marker icon:`, error);
      }
    }
    return undefined;
  };

  // Don't render markers if icon isn't ready yet
  if (!defaultIcon) {
    return null;
  }

  return (
    <>
      {/* Render draft lanes */}
      {draftLanes.map((lane, laneIndex) => {
        const laneId = `draft-lane-${laneIndex}`;
        const isSelected = selectedLaneId === laneId;
        const startPoint = lane.path[0];
        const endPoint = lane.path[lane.path.length - 1];
        const hasMultiplePoints = lane.path.length > 1;

        return (
          <React.Fragment key={laneId}>
            {hasMultiplePoints && (
              <Polyline
                positions={lane.path}
                pathOptions={{
                  color: lane.color || "#0066CC",
                  weight: lane.weight || 5,
                  opacity: isSelected ? 1 : lane.opacity || 0.7,
                }}
                eventHandlers={{
                  click: () => onLaneSelect(laneId),
                }}
              >
                <Tooltip sticky>
                  {lane.name?.en || `Draft Lane ${laneIndex + 1}`}
                </Tooltip>
              </Polyline>
            )}

            {/* Render start marker */}
            {startPoint && hasMultiplePoints && (
              <Marker
                key={`${laneId}-start`}
                position={startPoint}
                icon={getMarkerIcon(lane, true)}
                draggable={isDrawingMode}
                eventHandlers={
                  {
                    click: (e) => {
                      e.originalEvent.stopPropagation();
                      onSelectedPointChange?.({
                        laneIndex,
                        pointIndex: 0,
                      });
                    },
                    dragend: (e) => {
                      const marker = e.target;
                      const position = marker.getLatLng();
                      updateLanePoint(laneIndex, 0, position);
                    },
                  } as LeafletEventHandlerFnMap
                }
              >
                <Tooltip sticky>
                  Start: {lane.name?.en || `Draft Lane ${laneIndex + 1}`}
                </Tooltip>
              </Marker>
            )}

            {/* Render end marker (only if different from start) */}
            {endPoint &&
              hasMultiplePoints &&
              (startPoint[0] !== endPoint[0] ||
                startPoint[1] !== endPoint[1]) && (
                <Marker
                  key={`${laneId}-end`}
                  position={endPoint}
                  icon={getMarkerIcon(lane, false)}
                  draggable={isDrawingMode}
                  eventHandlers={
                    {
                      click: (e) => {
                        e.originalEvent.stopPropagation();
                        onSelectedPointChange?.({
                          laneIndex,
                          pointIndex: lane.path.length - 1,
                        });
                      },
                      dragend: (e) => {
                        const marker = e.target;
                        const position = marker.getLatLng();
                        updateLanePoint(
                          laneIndex,
                          lane.path.length - 1,
                          position
                        );
                      },
                    } as LeafletEventHandlerFnMap
                  }
                >
                  <Tooltip sticky>
                    End: {lane.name?.en || `Draft Lane ${laneIndex + 1}`}
                  </Tooltip>
                </Marker>
              )}

            {/* Render markers for intermediate points (if not start/end) */}
            {lane.path.map((point, pointIndex) => {
              const isStartPoint = pointIndex === 0;
              const isEndPoint = pointIndex === lane.path.length - 1;
              // Skip start and end points as they have special markers
              if (isStartPoint || isEndPoint) return null;

              const isPointSelected =
                selectedPoint?.laneIndex === laneIndex &&
                selectedPoint?.pointIndex === pointIndex;

              // Create a highlighted icon for selected point
              const selectedIcon =
                isPointSelected && typeof window !== "undefined"
                  ? L.icon({
                      iconUrl: "/markers/marker.png",
                      iconSize: [40, 40],
                      iconAnchor: [20, 40],
                      popupAnchor: [0, -40],
                    })
                  : defaultIcon;

              return (
                <Marker
                  key={`${laneId}-point-${pointIndex}`}
                  position={point}
                  icon={selectedIcon || defaultIcon}
                  draggable={isDrawingMode}
                  eventHandlers={
                    {
                      click: (e) => {
                        e.originalEvent.stopPropagation();
                        if (onSelectedPointChange) {
                          onSelectedPointChange({
                            laneIndex,
                            pointIndex,
                          });
                        }
                      },
                      dragend: (e) => {
                        const marker = e.target;
                        const newPosition = marker.getLatLng();
                        updateLanePoint(laneIndex, pointIndex, newPosition);
                      },
                    } as LeafletEventHandlerFnMap
                  }
                >
                  <Tooltip sticky>
                    Point {pointIndex + 1}
                    {isPointSelected && " (Selected)"}
                  </Tooltip>
                </Marker>
              );
            })}
          </React.Fragment>
        );
      })}
    </>
  );
}
