"use client";

import React from "react";
import { useMapEvents, Marker, Polyline, Tooltip } from "react-leaflet";
import { LatLng } from "leaflet";
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
  // selectedIcon,
  // onIconPlace,
}: LaneDrawingToolProps) {
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

        return (
          <React.Fragment key={laneId}>
            {lane.path.length > 1 && (
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

            {/* Render markers for each point */}
            {lane.path.map((point, pointIndex) => {
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
                  eventHandlers={{
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
                      const updatedLanes = draftLanes.map((l, idx) => {
                        if (idx === laneIndex) {
                          const updatedPath = [...l.path];
                          updatedPath[pointIndex] = [
                            newPosition.lat,
                            newPosition.lng,
                          ];
                          return { ...l, path: updatedPath };
                        }
                        return l;
                      });
                      onDraftLanesChange(updatedLanes);
                    },
                  }}
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
