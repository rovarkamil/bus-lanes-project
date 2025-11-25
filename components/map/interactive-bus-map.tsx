"use client";

import dynamic from "next/dynamic";
import type { InteractiveBusMapProps } from "./interactive-bus-map.client";

const InteractiveBusMapLazy = dynamic(
  () =>
    import("./interactive-bus-map.client").then((mod) => ({
      default: mod.InteractiveBusMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[520px] items-center justify-center rounded-xl border border-dashed border-border/40 bg-muted/20">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary/50 border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Loading interactive map…
          </p>
        </div>
      </div>
    ),
  }
);

export type { InteractiveBusMapProps };

export const InteractiveBusMap = (props: InteractiveBusMapProps) => (
  <InteractiveBusMapLazy {...props} />
);

export default InteractiveBusMap;
