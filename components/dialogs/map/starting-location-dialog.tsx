"use client";

import dynamic from "next/dynamic";
import type { StartingLocationDialogProps } from "./starting-location-dialog.client";

const StartingLocationDialogLazy = dynamic(
  () =>
    import("./starting-location-dialog.client").then((mod) => ({
      default: mod.StartingLocationDialog,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-lg border border-dashed border-border/40 bg-muted/30">
        <p className="text-sm text-muted-foreground">Loading map…</p>
      </div>
    ),
  }
);

export type { StartingLocationDialogProps };

export const StartingLocationDialog = (props: StartingLocationDialogProps) => (
  <StartingLocationDialogLazy {...props} />
);
