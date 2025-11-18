# Leaflet Integration Guide

Follow this checklist to get Leaflet working consistently across the dashboard and the public map experience.

## 1. Install dependencies

```bash
pnpm add leaflet react-leaflet
pnpm add -D @types/leaflet
```

React Leaflet wraps the Leaflet map primitives and handles context so we can stay within React’s render model while still using Leaflet’s tile, marker, path, and control APIs.[^leaflet-download]

## 2. Import Leaflet CSS globally

Leaflet’s default controls and markers rely on the built-in stylesheet. Make sure it is loaded before Tailwind layers in `app/globals.css`.

```diff
@@
-@tailwind base;
+@import "leaflet/dist/leaflet.css";
+
+@tailwind base;
```

## 3. Provide a reusable map component

Use `components/map/leaflet-map.tsx` to render `MapContainer`, apply the OpenStreetMap tile layer, and normalize default marker icons. The component:

- Runs as a client component (`"use client"`).
- Fixes missing marker images by merging icon URLs from `leaflet/dist/images`.
- Accepts common props (`center`, `zoom`, `tileUrl`, `children`) so other features can inject markers, polylines, and popups without duplicating setup.

Example usage:

```tsx
import LeafletMap from "@/components/map/leaflet-map";
import { Marker, Popup } from "react-leaflet";

export function DepotPreview() {
  return (
    <LeafletMap center={[36.1911, 44.0092]} zoom={13}>
      <Marker position={[36.1911, 44.0092]}>
        <Popup>Central Depot</Popup>
      </Marker>
    </LeafletMap>
  );
}
```

## 4. SSR-safe imports

`react-leaflet` must run on the client only. Any dashboard page that includes `LeafletMap` should either:

- Render inside a client component (`"use client"` at the top of the file), or
- Dynamically import the component with `ssr: false` (e.g., `const Map = dynamic(() => import("./leaflet-map"), { ssr: false });`).

## 5. Tile layers and attribution

Keep the default OpenStreetMap tile attribution unless you switch to a provider that requires a different attribution string. You can override `tileUrl`/`tileAttribution` when calling `LeafletMap` if you move to Mapbox, Carto, etc.[^leaflet-reference]

## 6. Adding overlays

Use `react-leaflet` primitives to add geometry:

| Overlay  | Component                        | Common usage                           |
| -------- | -------------------------------- | -------------------------------------- |
| Marker   | `<Marker position={...} />`      | Bus stops, landmarks                   |
| Polyline | `<Polyline positions={...} />`   | Simple bus lanes                       |
| Polygon  | `<Polygon positions={...} />`    | Zones / service areas                  |
| Circle   | `<Circle center={...} radius />` | Coverage radius around a stop          |
| Popup    | `<Popup>...</Popup>`             | Rich tooltips for markers or polylines |

All of these map directly to Leaflet’s core API, so you can check the Leaflet reference when you need fine-grained options such as custom stroke styles, dash arrays, or hit detection.[^leaflet-reference]

## 7. Handling dynamic data

1. Use SWR/React Query hooks to fetch bus stops, lanes, and routes from the employee APIs.
2. Transform coordinates into `LatLngExpression` arrays.
3. Render them as markers/polylines inside `LeafletMap`.
4. Keep map state (selected stop, hovered lane) in a client component, not inside the Leaflet instance.

## 8. Testing checklist

- Map renders without console warnings in dev mode.
- Default marker icons appear (proves CSS + icon override works).
- Zoom/pan interactions are smooth on desktop and mobile simulators.
- Popups/markers are accessible (keyboard focus, ARIA roles).

Once these steps are in place, the Leaflet setup is ready for integration with the bus lane CRUD flows and the public interactive map.

---

[^leaflet-reference]: Leaflet API Reference, “Map” and “Vector Layers”, https://leafletjs.com/reference.html

[^leaflet-download]: Leaflet Download & Build instructions, https://leafletjs.com/download.html
