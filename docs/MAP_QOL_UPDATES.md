# Map Filter Quality-of-Life Updates

## Overview

This document captures the latest round of improvements for the public map filter system. The goal is to make filtering intuitive, visually rich, and resilient across sessions, mirroring the polish outlined in `MAP_PAGE_IMPROVEMENTS.md`.

## Highlights

### 1. Persistent Filter Preferences

- State for selected transport services, lanes, and stop visibility now persists via `map-filters-preferences-v1` in `localStorage` (`app/map/page.tsx`).
- New services or lanes that appear later are auto-selected so guests always see fresh data without extra clicks.

### 2. Rich Filter UI

- `components/map/public/map-filter-popover.tsx` now receives hydrated data from the map payload instead of re-fetching.
- Each transport service row shows its icon/color chip and type, while lanes display their stroke color for at-a-glance recognition.
- Section headers gained icons (`Compass`, `Layers3`, `MapPin`), counts, and one-tap “Show all / Clear all” controls.

### 2.1 Map Style Popover

- Introduced a dedicated `MapStylePopover` floating beside the filter button so users can swap basemaps without digging through filters.
- Added extra presets (Minimal, Contrast, Terrain, Detailed) powered by the new `lib/map/tile-styles.ts` catalog—each label-free and tuned for different contrast levels so the “Minimal” option isn’t the only choice.
- The selection still persists with the rest of the filter preferences and drives both the public map and the admin map editor so what you preview is what you edit.

### 3. Correct Visibility Logic

- Filters default to “all checked” when the map loads, satisfying the requirement that nothing is hidden by default.
- Service deselection now hides starting markers, lanes, and associated stops/routes inside `components/map/interactive-bus-map.client.tsx`.
- Filtering is only applied when the user actually deselects something—selecting every service no longer hides unassigned stops.

### 4. Stored Filter Hydration Flow

- Map page bootstraps selections once data arrives, cleans up orphaned IDs, and backfills new ones.
- A dedicated effect writes every change back to storage, ensuring mobile and desktop sessions stay in sync.

### 5. UX Details

- Filter button badge counts only the filters that materially change output (e.g., hiding stops or deselecting services).
- Popover layout now matches the refreshed iZurvive-inspired aesthetic with rounded cards, muted surfaces, and consistent spacing.

### 6. Editor Safety & Submission Feedback

- Map editor delete actions (selected points, stop edits, draft lanes/stops) now show confirmation dialogs so accidental taps don’t wipe progress.
- Bulk create/update dialogs for lanes and stops display a guarded loading state that locks the primary action button until each request completes, preventing duplicate submissions.

### 7. Next Wave of Map Editor QOL Ideas

- **Guided snapping for geometry**: allow lane points and stop placements to snap to existing roads or previously drawn geometries, reducing manual coordinate tweaking.
- **Mini-map + bookmarks**: surface a collapsible overview map and user-defined bookmarks so editors can jump between high-activity corridors without panning across the whole city.
- **Bulk import/export flows**: support CSV/GeoJSON uploads for lanes/stops and downloadable change-sets, enabling planners to prep edits offline and re-use data between environments.
- **Conflict dashboard**: highlight overlapping lane segments, duplicated stop coordinates, or orphaned routes in a dedicated panel so data issues are caught before publishing.
- **Contextual keyboard palette**: expose a command palette (e.g., `Ctrl+K`) with shortcuts for toggling modes, centering on last selection, or opening creation dialogs to speed up power users.

## Testing Checklist

- [x] Refresh `/map` and confirm every filter starts checked.
- [x] Toggle a service off → corresponding starting markers, lanes, routes, and stops vanish.
- [x] Reload page → selections persist from the previous session.
- [x] Toggle stops off → stop markers disappear, toggle text updates.
- [x] Add or remove transport services in the dataset → new ones auto-select, removed ones are cleaned from stored preferences.

## Files Touched

- `app/map/page.tsx`
- `components/map/public/map-filter-popover.tsx`
- `components/map/interactive-bus-map.client.tsx`

These changes collectively deliver a more polished, stateful filter experience aligned with the rest of the map modernization effort.
