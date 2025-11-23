"use client";

import { useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, LocateFixed } from "lucide-react";
import { useTranslation } from "@/i18n/client";

interface MapEditorControlsProps {
  className?: string;
}

export function MapEditorControls({ className }: MapEditorControlsProps) {
  const map = useMap();
  const { t } = useTranslation("Map");

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const handleFitBounds = () => {
    // Fit map to show all markers/features
    const bounds = map.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds);
    }
  };

  const handleResetView = () => {
    // Reset to default center
    map.setView([36.1911, 44.0092], 14);
  };

  return (
    <div
      className={`absolute top-4 right-4 z-[1000] flex flex-col gap-2 ${className || ""}`}
    >
      <Button
        size="icon"
        variant="secondary"
        onClick={handleZoomIn}
        title={t("ZoomIn")}
        className="shadow-lg"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        onClick={handleZoomOut}
        title={t("ZoomOut")}
        className="shadow-lg"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        onClick={handleFitBounds}
        title={t("FitBounds")}
        className="shadow-lg"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        onClick={handleResetView}
        title={t("ResetView")}
        className="shadow-lg"
      >
        <LocateFixed className="h-4 w-4" />
      </Button>
    </div>
  );
}
