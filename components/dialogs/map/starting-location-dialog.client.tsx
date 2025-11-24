"use client";

import { useEffect, useMemo, useState } from "react";
import { Marker, Tooltip, useMapEvents } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LeafletMap } from "@/components/map/leaflet-map";
import { useTranslation } from "@/i18n/client";
import { MapPin, Check } from "lucide-react";

type LocationData = {
  lat: number;
  lng: number;
};

export interface StartingLocationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialLocation?: LocationData | null;
  onLocationSelect: (location: LocationData) => void;
  isSubmitting?: boolean;
}

const DEFAULT_CENTER: LatLngExpression = [36.1911, 44.0092];

const MapClickHandler = ({
  onLocationSelect,
}: {
  onLocationSelect: (location: LocationData) => void;
}) => {
  useMapEvents({
    click: (event) => {
      onLocationSelect({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });
  return null;
};

export const StartingLocationDialog = ({
  isOpen,
  onOpenChange,
  initialLocation,
  onLocationSelect,
  isSubmitting = false,
}: StartingLocationDialogProps) => {
  const { t: mapT, i18n } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    initialLocation || null
  );
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setSelectedLocation(initialLocation || null);
    if (initialLocation) {
      setLatInput(initialLocation.lat.toString());
      setLngInput(initialLocation.lng.toString());
    } else {
      setLatInput("");
      setLngInput("");
    }
  }, [isOpen, initialLocation]);

  const center = useMemo<LatLngExpression>(() => {
    if (selectedLocation) {
      return [selectedLocation.lat, selectedLocation.lng];
    }
    return DEFAULT_CENTER;
  }, [selectedLocation]);

  const handleMapClick = (location: LocationData) => {
    setSelectedLocation(location);
    setLatInput(location.lat.toString());
    setLngInput(location.lng.toString());
  };

  const handleInputChange = (type: "lat" | "lng", value: string) => {
    const numValue = parseFloat(value);
    if (type === "lat") {
      setLatInput(value);
      if (!isNaN(numValue) && numValue >= -90 && numValue <= 90) {
        setSelectedLocation((prev) => ({
          lat: numValue,
          lng: prev?.lng ?? DEFAULT_CENTER[0],
        }));
      }
    } else {
      setLngInput(value);
      if (!isNaN(numValue) && numValue >= -180 && numValue <= 180) {
        setSelectedLocation((prev) => ({
          lat: prev?.lat ?? DEFAULT_CENTER[0],
          lng: numValue,
        }));
      }
    }
  };

  const handleApply = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    }
  };

  const canApply =
    selectedLocation !== null &&
    !isNaN(selectedLocation.lat) &&
    !isNaN(selectedLocation.lng) &&
    selectedLocation.lat >= -90 &&
    selectedLocation.lat <= 90 &&
    selectedLocation.lng >= -180 &&
    selectedLocation.lng <= 180;

  return (
    <CustomDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={mapT("StartingLocationDialog.Title") || "Select Starting Location"}
      description={
        mapT("StartingLocationDialog.Description") ||
        "Click on the map or enter coordinates to set the starting location"
      }
      icon={MapPin}
      maxWidth="4xl"
      rtl={isRTL}
    >
      <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
        <div className="space-y-4">
          <Card className="space-y-4 p-4">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {mapT("StartingLocationDialog.Coordinates") || "Coordinates"}
            </Label>

            <div className="space-y-2">
              <Label>
                {mapT("StartingLocationDialog.Latitude") || "Latitude"}
              </Label>
              <Input
                type="number"
                step="any"
                value={latInput}
                onChange={(e) => handleInputChange("lat", e.target.value)}
                placeholder="36.1911"
                min={-90}
                max={90}
              />
            </div>

            <div className="space-y-2">
              <Label>
                {mapT("StartingLocationDialog.Longitude") || "Longitude"}
              </Label>
              <Input
                type="number"
                step="any"
                value={lngInput}
                onChange={(e) => handleInputChange("lng", e.target.value)}
                placeholder="44.0092"
                min={-180}
                max={180}
              />
            </div>

            {selectedLocation && (
              <div className="rounded-md bg-primary/5 p-3 text-sm">
                <p className="text-xs text-muted-foreground mb-1">
                  {mapT("StartingLocationDialog.SelectedLocation") ||
                    "Selected Location"}
                </p>
                <p className="font-mono text-xs">
                  {selectedLocation.lat.toFixed(5)},{" "}
                  {selectedLocation.lng.toFixed(5)}
                </p>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <p className="text-xs text-muted-foreground">
              {mapT("StartingLocationDialog.Instructions") ||
                "Click on the map to select a location, or enter coordinates manually."}
            </p>
          </Card>
        </div>

        <div className="relative">
          {isOpen ? (
            <LeafletMap center={center} zoom={13} className="h-[540px]">
              <MapClickHandler onLocationSelect={handleMapClick} />

              {selectedLocation && (
                <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                  <Tooltip sticky>
                    {mapT("StartingLocationDialog.MarkerTooltip") ||
                      "Starting Location"}
                  </Tooltip>
                </Marker>
              )}
            </LeafletMap>
          ) : (
            <div className="flex h-[540px] items-center justify-center rounded-lg border">
              <p className="text-sm text-muted-foreground">
                {mapT("StartingLocationDialog.Loading") || "Loading map..."}
              </p>
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
            <div className="rounded-full border border-dashed border-border/60 bg-background/80 px-4 py-1 text-xs text-muted-foreground shadow-sm">
              {mapT("StartingLocationDialog.ClickToSelect") ||
                "Click on the map to select location"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {mapT("Common.Cancel") || "Cancel"}
        </Button>
        <Button onClick={handleApply} disabled={!canApply || isSubmitting}>
          {isSubmitting ? (
            mapT("Common.Updating") || "Updating..."
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              {mapT("StartingLocationDialog.Apply") || "Apply"}
            </>
          )}
        </Button>
      </div>
    </CustomDialog>
  );
};

export default StartingLocationDialog;
