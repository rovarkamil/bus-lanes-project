"use client";

import React from "react";
import { Polyline, Marker, Tooltip } from "react-leaflet";
import { MapLane, MapStop, MapRoute } from "@/types/map";
import L from "leaflet";

interface ExistingLayersProps {
  lanes: MapLane[];
  stops: MapStop[];
  routes: MapRoute[];
  selectedLaneId?: string | null;
  onLaneClick?: (laneId: string) => void;
  editingStopId?: string | null;
  editingStopNewPosition?: { latitude: number; longitude: number } | null;
  onStopPositionUpdate?: (stopId: string, position: [number, number]) => void;
}

export function ExistingLayers({
  lanes,
  stops,
  routes,
  selectedLaneId,
  onLaneClick,
  editingStopId,
  editingStopNewPosition,
  onStopPositionUpdate,
}: ExistingLayersProps) {
  return (
    <>
      {/* Render existing lanes */}
      {lanes.map((lane) => {
        if (!lane.path?.length) return null;

        // Helper to get icon for start/end markers
        const getMarkerIcon = (isStart: boolean): L.Icon | undefined => {
          // Check if service has icon
          if (lane.service?.icon?.fileUrl) {
            try {
              const size = lane.service.icon.iconSize ?? 32;
              return L.icon({
                iconUrl: lane.service.icon.fileUrl,
                iconSize: [size, size],
                iconAnchor: [
                  lane.service.icon.iconAnchorX ?? size / 2,
                  lane.service.icon.iconAnchorY ?? size,
                ],
                popupAnchor: [
                  lane.service.icon.popupAnchorX ?? 0,
                  lane.service.icon.popupAnchorY ?? -size / 2,
                ],
              });
            } catch (error) {
              console.warn(
                `Failed to create service icon for lane ${lane.id}:`,
                error
              );
            }
          }

          // Use default markers
          if (typeof window !== "undefined") {
            try {
              const fallbackIconUrl = isStart
                ? "/markers/starting.png"
                : "/markers/end.png";
              return L.icon({
                iconUrl: fallbackIconUrl,
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

        const startIcon = getMarkerIcon(true);
        const endIcon = getMarkerIcon(false);
        const startPoint = lane.path[0];
        const endPoint = lane.path[lane.path.length - 1];

        return (
          <React.Fragment key={`lane-${lane.id}`}>
            <Polyline
              positions={lane.path}
              pathOptions={{
                color: lane.color ?? lane.service?.color ?? "#0066CC",
                weight: selectedLaneId === lane.id ? 8 : (lane.weight ?? 5),
                opacity: selectedLaneId === lane.id ? 1 : (lane.opacity ?? 0.7),
              }}
              eventHandlers={{
                click: () => onLaneClick?.(lane.id),
              }}
            >
              <Tooltip sticky>
                {lane.name?.en ?? lane.id}
                {selectedLaneId === lane.id && " (Selected)"}
              </Tooltip>
            </Polyline>

            {/* Start marker */}
            {startIcon && startPoint && (
              <Marker position={startPoint} icon={startIcon}>
                <Tooltip sticky>Start: {lane.name?.en ?? lane.id}</Tooltip>
              </Marker>
            )}

            {/* End marker (only if different from start) */}
            {endIcon &&
              endPoint &&
              (startPoint[0] !== endPoint[0] ||
                startPoint[1] !== endPoint[1]) && (
                <Marker position={endPoint} icon={endIcon}>
                  <Tooltip sticky>End: {lane.name?.en ?? lane.id}</Tooltip>
                </Marker>
              )}
          </React.Fragment>
        );
      })}

      {/* Render existing routes */}
      {routes.map((route) =>
        route.path?.length ? (
          <Polyline
            key={`route-${route.id}`}
            positions={route.path}
            pathOptions={{
              color: route.color ?? route.service?.color ?? "#f97316",
              weight: 3,
              opacity: 0.6,
              dashArray: "8 4",
            }}
          >
            <Tooltip sticky>
              {route.routeNumber
                ? `Route ${route.routeNumber}`
                : (route.name?.en ?? route.id)}
            </Tooltip>
          </Polyline>
        ) : null
      )}

      {/* Render existing stops */}
      {stops.map((stop) => {
        // Create custom icon if available, otherwise use stop-sign
        let icon: L.Icon | undefined;
        if (stop.icon?.fileUrl) {
          try {
            const size = stop.icon.iconSize ?? 32;
            icon = L.icon({
              iconUrl: stop.icon.fileUrl,
              iconSize: [size, size],
              iconAnchor: [
                stop.icon.iconAnchorX ?? size / 2,
                stop.icon.iconAnchorY ?? size,
              ],
              popupAnchor: [
                stop.icon.popupAnchorX ?? 0,
                stop.icon.popupAnchorY ?? -size / 2,
              ],
            });
          } catch (error) {
            console.warn(`Failed to create icon for stop ${stop.id}:`, error);
          }
        }

        // If no custom icon, use the stop-sign icon
        if (!icon && typeof window !== "undefined") {
          try {
            icon = L.icon({
              iconUrl: "/markers/stop-sign.png",
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32],
            });
          } catch (error) {
            console.warn(`Failed to create default stop icon:`, error);
          }
        }

        // Only pass icon prop if it exists
        const markerProps = icon ? { icon } : {};

        // Make marker draggable if this stop is being edited
        const isDraggable = editingStopId === stop.id;

        // Use new position if stop is being edited, otherwise use original position
        const stopPosition =
          isDraggable && editingStopNewPosition
            ? [
                editingStopNewPosition.latitude,
                editingStopNewPosition.longitude,
              ]
            : [stop.latitude, stop.longitude];

        return (
          <Marker
            key={`stop-${stop.id}`}
            position={stopPosition as [number, number]}
            {...markerProps}
            draggable={isDraggable}
            eventHandlers={{
              dragend: (event) => {
                if (isDraggable && onStopPositionUpdate) {
                  const marker = event.target;
                  const position = marker.getLatLng();
                  onStopPositionUpdate(stop.id, [position.lat, position.lng]);
                }
              },
            }}
          >
            <Tooltip sticky>
              {stop.name?.en ?? stop.id}
              {isDraggable && " (Drag to reposition)"}
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}
