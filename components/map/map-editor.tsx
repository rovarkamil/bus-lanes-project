"use client";

import { useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Tooltip,
  FeatureGroup,
  useMapEvents,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
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
} from "@/types/map";
import { cn } from "@/lib/utils";
import { Loader2, Trash2, Undo2 } from "lucide-react";
import { useTranslation } from "@/i18n/client";

const DEFAULT_CENTER: LatLngExpression = [36.1911, 44.0092];

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
  className?: string;
}

const MapClickHandler = ({
  onAddPoint,
  onAddStop,
}: {
  onAddPoint: (point: CoordinateTuple) => void;
  onAddStop: (point: CoordinateTuple) => void;
}) => {
  useMapEvents({
    click: (event) => {
      const point: CoordinateTuple = [event.latlng.lat, event.latlng.lng];
      if ((event.originalEvent as MouseEvent)?.shiftKey) {
        onAddStop(point);
        return;
      }
      onAddPoint(point);
    },
  });
  return null;
};

const DraftStopsList = ({
  draftStops,
  onRemove,
  emptyLabel,
  getDraftStopLabel,
}: {
  draftStops: DraftStop[];
  onRemove: (index: number) => void;
  emptyLabel: string;
  getDraftStopLabel: (index: number, stop: DraftStop) => string;
}) => {
  if (!draftStops.length) {
    return <p className="text-xs text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ScrollArea className="max-h-40 rounded border">
      <ul className="divide-y text-sm">
        {draftStops.map((stop, index) => (
          <li
            key={`${stop.latitude}-${stop.longitude}-${index}`}
            className="flex items-center justify-between px-3 py-2"
          >
            <div>
              <p className="font-medium">
                {stop.name || getDraftStopLabel(index, stop)}
              </p>
              <p className="text-xs text-muted-foreground">
                {stop.latitude.toFixed(5)}, {stop.longitude.toFixed(5)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
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
}: {
  stops: MapStop[];
  lanes: MapLane[];
}) => (
  <FeatureGroup>
    {stops.map((stop) => (
      <Marker key={stop.id} position={[stop.latitude, stop.longitude]}>
        <Tooltip sticky>{stop.name?.en ?? stop.id}</Tooltip>
      </Marker>
    ))}
    {lanes.map((lane) => (
      <Polyline
        key={lane.id}
        positions={lane.path}
        pathOptions={{
          color: lane.color ?? lane.service?.color ?? "#1d4ed8",
          weight: lane.weight ?? 4,
          opacity: 0.6,
        }}
      >
        <Tooltip sticky>{lane.name?.en ?? lane.id}</Tooltip>
      </Polyline>
    ))}
  </FeatureGroup>
);

export const MapEditor = ({
  data,
  isSaving,
  onSave,
  onResetDraft,
  className,
}: MapEditorProps) => {
  const { t, i18n } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  const [draftPath, setDraftPath] = useState<CoordinateTuple[]>([]);
  const [draftStops, setDraftStops] = useState<DraftStop[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#0066CC");
  const [serviceId, setServiceId] = useState<string | undefined>();

  const canSave = draftPath.length >= 2 && name.trim().length > 2;

  const handleAddPoint = (point: CoordinateTuple) => {
    setDraftPath((prev) => [...prev, point]);
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

  const handleResetDraft = () => {
    setDraftPath([]);
    setDraftStops([]);
    onResetDraft?.();
  };

  const handleSubmit = () => {
    if (!canSave) return;
    onSave?.({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      serviceId,
      path: draftPath,
      draftStops,
    });
  };

  const center = useMemo(() => {
    if (draftPath.length) {
      return draftPath[draftPath.length - 1];
    }
    if (data?.stops?.length) {
      return [
        data.stops[0].latitude,
        data.stops[0].longitude,
      ] as LatLngExpression;
    }
    return DEFAULT_CENTER;
  }, [draftPath, data?.stops]);

  return (
    <div
      className={cn("grid gap-6 lg:grid-cols-[340px,1fr]", className)}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Card className="border-border/70 bg-background/90 shadow-sm">
        <CardHeader>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("DraftLaneConfiguration")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("ClickTheMapToAddPointsShiftClickToAddDraftStops")}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("LaneName")}</Label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("E.g.AirportExpressLane")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("Description")}</Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t("OptionalDetailsAboutThisLane")}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("TransportService")}</Label>
            <ServicesSelect
              services={data?.services ?? []}
              current={serviceId}
              onChange={(value) => setServiceId(value)}
              placeholder={t("AssignTransportService")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("LaneColor")}</Label>
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

          <div className="space-y-2">
            <Label>{t("DraftStops")}</Label>
            <DraftStopsList
              draftStops={draftStops}
              onRemove={(index) =>
                setDraftStops((prev) => prev.filter((_, idx) => idx !== index))
              }
              emptyLabel={t("ShiftClickToAddDraftStops")}
              getDraftStopLabel={(index) =>
                t("DraftStopNumber", { number: index + 1 })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleUndoPoint}
              disabled={!draftPath.length}
            >
              <Undo2 className="mr-2 h-4 w-4" />
              {t("UndoPoint")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleResetDraft}
              disabled={!draftPath.length && !draftStops.length}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("ResetDraft")}
            </Button>
          </div>

          <Button onClick={handleSubmit} disabled={!canSave || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("SaveDraftLane")}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-background/90 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("MapWorkspace")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("ClickToAddLanePointsHoldShiftToAddDraftStops")}
            </p>
          </div>
          <Badge variant="secondary">
            {draftPath.length} {t("Points")} • {draftStops.length}{" "}
            {t("DraftStops")}
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative h-[640px] w-full overflow-hidden rounded-b-lg">
            <MapContainer
              center={center}
              zoom={14}
              scrollWheelZoom
              className="h-full w-full"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <ExistingLayers
                stops={data?.stops ?? []}
                lanes={data?.lanes ?? []}
              />
              <FeatureGroup>
                <MapClickHandler
                  onAddPoint={handleAddPoint}
                  onAddStop={handleAddStop}
                />
                {draftPath.length > 0 && (
                  <>
                    <Polyline
                      positions={draftPath}
                      pathOptions={{
                        color,
                        weight: 5,
                      }}
                    />
                    {draftPath.map((point, index) => (
                      <Marker
                        key={`${point[0]}-${point[1]}-${index}`}
                        position={point}
                      >
                        <Tooltip sticky>
                          {t("PointNumber", { number: index + 1 })}
                        </Tooltip>
                      </Marker>
                    ))}
                  </>
                )}
                {draftStops.map((stop, index) => (
                  <Marker
                    key={`${stop.latitude}-${stop.longitude}-${index}`}
                    position={[stop.latitude, stop.longitude]}
                  >
                    <Tooltip sticky>
                      {t("DraftStopNumber", { number: index + 1 })}
                    </Tooltip>
                  </Marker>
                ))}
              </FeatureGroup>
            </MapContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-full border border-dashed border-border/60 bg-background/80 px-4 py-1 text-xs text-muted-foreground shadow-sm">
                {t("ClickToPlotLaneShiftClickToAddStop")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapEditor;
