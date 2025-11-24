"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FeatureGroup,
  Marker,
  Polyline,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { LeafletMap } from "@/components/map/leaflet-map";
import { CoordinateTuple, MapLane, MapRoute, MapStop } from "@/types/map";
import { useTranslation } from "@/i18n/client";
import { Undo2, Trash2, Map as MapIcon } from "lucide-react";

type DraftStop = {
  latitude: number;
  longitude: number;
  name?: string;
};

export interface MapLinesDialogResult {
  path: CoordinateTuple[];
  draftStops: DraftStop[];
  color: string;
  weight: number;
  opacity: number;
}

export interface MapLinesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (result: MapLinesDialogResult) => void;
  initialPath?: CoordinateTuple[];
  initialDraftStops?: DraftStop[];
  initialColor?: string;
  initialWeight?: number;
  initialOpacity?: number;
  referenceStops?: MapStop[];
  referenceLanes?: MapLane[];
  referenceRoutes?: MapRoute[];
  isSubmitting?: boolean;
}

const DEFAULT_CENTER: LatLngExpression = [36.1911, 44.0092];

const MapClickHandler = ({
  onAddPoint,
  onAddStop,
}: {
  onAddPoint: (point: CoordinateTuple) => void;
  onAddStop: (point: CoordinateTuple) => void;
}) => {
  useMapEvents({
    click: (event) => {
      const nextPoint: CoordinateTuple = [event.latlng.lat, event.latlng.lng];
      if ((event.originalEvent as MouseEvent)?.shiftKey) {
        onAddStop(nextPoint);
        return;
      }
      onAddPoint(nextPoint);
    },
  });
  return null;
};

const DraftStopsList = ({
  draftStops,
  onRemove,
  emptyLabel,
}: {
  draftStops: DraftStop[];
  onRemove: (index: number) => void;
  emptyLabel: string;
}) => {
  if (!draftStops.length) {
    return <p className="text-xs text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ScrollArea className="max-h-40 rounded-md border">
      <ul className="divide-y text-sm">
        {draftStops.map((stop, index) => (
          <li
            key={`${stop.latitude}-${stop.longitude}-${index}`}
            className="flex items-center justify-between px-3 py-2"
          >
            <div>
              <p className="font-medium">{stop.name || `Stop ${index + 1}`}</p>
              <p className="text-xs text-muted-foreground">
                {stop.latitude.toFixed(5)}, {stop.longitude.toFixed(5)}
              </p>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => onRemove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
};

export const MapLinesDialog = ({
  isOpen,
  onOpenChange,
  onApply,
  initialPath = [],
  initialDraftStops = [],
  initialColor = "#0066CC",
  initialWeight = 5,
  initialOpacity = 0.8,
  referenceStops = [],
  referenceLanes = [],
  referenceRoutes = [],
  isSubmitting = false,
}: MapLinesDialogProps) => {
  const { t: busT, i18n } = useTranslation("BusLanes");
  const { t: mapT } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  const [draftPath, setDraftPath] = useState<CoordinateTuple[]>(initialPath);
  const [draftStops, setDraftStops] = useState<DraftStop[]>(initialDraftStops);
  const [color, setColor] = useState(initialColor);
  const [weight, setWeight] = useState(initialWeight);
  const [opacity, setOpacity] = useState(initialOpacity);

  useEffect(() => {
    if (!isOpen) return;
    setDraftPath(initialPath);
    setDraftStops(initialDraftStops);
    setColor(initialColor);
    setWeight(initialWeight);
    setOpacity(initialOpacity);
  }, [
    isOpen,
    initialPath,
    initialDraftStops,
    initialColor,
    initialWeight,
    initialOpacity,
  ]);

  const center = useMemo<LatLngExpression>(() => {
    if (draftPath.length) {
      return draftPath[draftPath.length - 1];
    }
    if (referenceStops.length) {
      return [
        referenceStops[0].latitude,
        referenceStops[0].longitude,
      ] as CoordinateTuple;
    }
    return DEFAULT_CENTER;
  }, [draftPath, referenceStops]);

  const canApply = draftPath.length >= 2;

  const handleUndoPoint = () => {
    setDraftPath((prev) => prev.slice(0, prev.length - 1));
  };

  const handleReset = () => {
    setDraftPath([]);
    setDraftStops([]);
  };

  const handleApply = () => {
    if (!canApply) return;
    onApply?.({
      path: draftPath,
      draftStops,
      color,
      weight,
      opacity,
    });
  };

  return (
    <CustomDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={busT("MapDialog.Title")}
      description={busT("MapDialog.Description")}
      icon={MapIcon}
      maxWidth="6xl"
      rtl={isRTL}
    >
      <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
        <div className="space-y-4">
          <Card className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {mapT("DraftLaneConfiguration")}
              </Label>
              <Badge variant="secondary">
                {draftPath.length} {mapT("Points")} • {draftStops.length}{" "}
                {mapT("DraftStops")}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label>{busT("CreateDialog.Color")}</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  className="h-10 w-16 rounded-md border"
                />
                <Input
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  maxLength={7}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{busT("CreateDialog.Weight")}</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={weight}
                  onChange={(event) =>
                    setWeight(Math.max(1, Number(event.target.value) || 1))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{busT("CreateDialog.Opacity")}</Label>
                <Input
                  type="number"
                  step="0.1"
                  min={0.1}
                  max={1}
                  value={opacity}
                  onChange={(event) =>
                    setOpacity(
                      Math.min(
                        1,
                        Math.max(0.1, Number(event.target.value) || 0.8)
                      )
                    )
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{mapT("DraftStops")}</Label>
              <DraftStopsList
                draftStops={draftStops}
                onRemove={(index) =>
                  setDraftStops((prev) =>
                    prev.filter((_, stopIndex) => stopIndex !== index)
                  )
                }
                emptyLabel={mapT("ShiftClickToAddDraftStops")}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleUndoPoint}
                disabled={!draftPath.length}
              >
                <Undo2 className="mr-2 h-4 w-4" />
                {mapT("UndoPoint")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                disabled={!draftPath.length && !draftStops.length}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {mapT("ResetDraft")}
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {busT("MapDialog.ReferenceLayers")}
            </Label>
            <p className="mt-2 text-xs text-muted-foreground">
              {referenceLanes.length ||
              referenceRoutes.length ||
              referenceStops.length
                ? busT("MapDialog.ReferenceLayersDescription")
                : busT("MapDialog.NoReferenceLayers")}
            </p>
          </Card>
        </div>

        <div className="relative">
          {isOpen ? (
            <LeafletMap center={center} zoom={14} className="h-[540px]">
              <FeatureGroup>
                <MapClickHandler
                  onAddPoint={(point) =>
                    setDraftPath((prev) => [...prev, point])
                  }
                  onAddStop={(point) =>
                    setDraftStops((prev) => [
                      ...prev,
                      { latitude: point[0], longitude: point[1] },
                    ])
                  }
                />

                {referenceLanes.map((lane) =>
                  lane.path?.length ? (
                    <Polyline
                      key={`lane-${lane.id}`}
                      positions={lane.path}
                      pathOptions={{
                        color: lane.color ?? lane.service?.color ?? "#94a3b8",
                        weight: lane.weight ?? 4,
                        opacity: 0.45,
                      }}
                    />
                  ) : null
                )}

                {referenceRoutes.map((route) =>
                  route.path?.length ? (
                    <Polyline
                      key={`route-${route.id}`}
                      positions={route.path}
                      pathOptions={{
                        color: route.color ?? route.service?.color ?? "#f97316",
                        weight: 3,
                        opacity: 0.4,
                        dashArray: "6 6",
                      }}
                    />
                  ) : null
                )}

                {referenceStops.map((stop) => (
                  <Marker
                    key={`stop-${stop.id}`}
                    position={[stop.latitude, stop.longitude]}
                  >
                    <Tooltip sticky>{stop.name?.en ?? stop.id}</Tooltip>
                  </Marker>
                ))}

                {draftPath.length > 0 && (
                  <>
                    <Polyline
                      positions={draftPath}
                      pathOptions={{ color, weight, opacity }}
                    />
                    {draftPath.map((point, index) => (
                      <Marker key={`draft-${index}`} position={point}>
                        <Tooltip sticky>
                          {mapT("PointNumber", { number: index + 1 })}
                        </Tooltip>
                      </Marker>
                    ))}
                  </>
                )}

                {draftStops.map((stop, index) => (
                  <Marker
                    key={`draft-stop-${index}`}
                    position={[stop.latitude, stop.longitude]}
                  >
                    <Tooltip sticky>
                      {mapT("DraftStopNumber", { number: index + 1 })}
                    </Tooltip>
                  </Marker>
                ))}
              </FeatureGroup>
            </LeafletMap>
          ) : (
            <div className="flex h-[540px] items-center justify-center rounded-lg border">
              <p className="text-sm text-muted-foreground">
                {busT("LoadingBusLanes")}
              </p>
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
            <div className="rounded-full border border-dashed border-border/60 bg-background/80 px-4 py-1 text-xs text-muted-foreground shadow-sm">
              {mapT("ClickToPlotLaneShiftClickToAddStop")}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {busT("Cancel")}
        </Button>
        <Button onClick={handleApply} disabled={!canApply || isSubmitting}>
          {isSubmitting
            ? busT("Common.Updating")
            : busT("MapDialog.ApplyChanges")}
        </Button>
      </div>
    </CustomDialog>
  );
};

export default MapLinesDialog;
