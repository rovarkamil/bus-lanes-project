"use client";

import dynamic from "next/dynamic";
import type {
  MapLinesDialogProps,
  MapLinesDialogResult,
} from "./map-lines-dialog.client";

const MapLinesDialogLazy = dynamic(
  () =>
    import("./map-lines-dialog.client").then((mod) => ({
      default: mod.MapLinesDialog,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[540px] items-center justify-center rounded-lg border border-dashed border-border/40 bg-muted/30">
        <p className="text-sm text-muted-foreground">Loading map tools…</p>
      </div>
    ),
  }
);

export { type MapLinesDialogProps, type MapLinesDialogResult };

export const MapLinesDialog = (props: MapLinesDialogProps) => (
  <MapLinesDialogLazy {...props} />
);
