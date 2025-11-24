# Map Page Improvements - iZurvive Style Interface

## Overview

This document outlines the improvements needed to transform the public map page (`/map`) into a full-screen, iZurvive-style interface with advanced filtering capabilities and progressive lane disclosure.

## Reference

- **iZurvive**: https://www.izurvive.com/#c=54;-14;2
- **Map Editor Reference**: `app/dashboard/map-editor/page.tsx` (for starting position logic)

## Current Issues

### 1. Map Page Layout Not Full-Screen

**Problem:**

- Map is embedded in a card with padding and margins
- Takes up only portion of screen
- Has header section with stats cards above map
- Not immersive like iZurvive

**Solution:**

- Make map full-screen (100vh)
- Remove header section and stats cards
- Minimal UI overlay on top of map
- Clean, immersive experience

### 2. Starting Position Not Using Settings

**Problem:**

- Map always starts at hardcoded default position
- Doesn't respect admin settings
- Doesn't use localStorage cache

**Solution:**

- Implement same starting position logic as map editor
- Check localStorage first (faster)
- Fallback to settings
- Cache position in localStorage

### 3. No Advanced Filter System

**Problem:**

- Current filter system is basic
- No way to filter individual services/lanes/stops
- No popover-style filter UI

**Solution:**

- Create Android messenger-style popover
- Show all transport services individually
- Show all lanes individually
- Show stops toggle
- Use client hooks for data fetching

### 4. Lanes Always Visible

**Problem:**

- All lanes shown immediately on map
- Cluttered interface
- No progressive disclosure

**Solution:**

- Only show starting point markers initially
- When starting point clicked, reveal:
  - All lanes for that service
  - End point marker
- Collapsible lane groups

## Implementation Plan

### Phase 1: Full-Screen Map Layout ✅

**Tasks:**

1. Remove header section with stats cards
2. Make map container full-screen (100vh)
3. Remove padding and margins from main container
4. Position filter button as floating overlay
5. Remove summary cards section

**Files to Modify:**

- `app/map/page.tsx`

**Expected Result:**

- Map takes up entire viewport
- Clean, minimal interface
- Filter button floating on map

### Phase 2: Starting Position from Settings ✅

**Tasks:**

1. Import `useSettingsStore` and `settingsMap`
2. Implement `initialCenter` logic (same as map editor)
3. Check localStorage first with cache key
4. Fallback to settings if no cache
5. Save to localStorage when loaded from settings
6. Pass `initialCenter` to `InteractiveBusMap`

**Files to Modify:**

- `app/map/page.tsx`

**Implementation:**

```typescript
const STARTING_POSITION_CACHE_KEY = "map-starting-position";
const { getSetting } = useSettingsStore();

const initialCenter = useMemo(() => {
  // Check localStorage first
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(STARTING_POSITION_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as { lat: number; lng: number };
        if (isValidCoordinate(parsed)) {
          return [parsed.lat, parsed.lng] as CoordinateTuple;
        }
      }
    } catch {}
  }

  // Fallback to settings
  const value = getSetting(settingsMap.STARTING_POSITION);
  if (value) {
    try {
      const parsed = JSON.parse(value) as { lat: number; lng: number };
      if (isValidCoordinate(parsed)) {
        // Cache for next time
        localStorage.setItem(
          STARTING_POSITION_CACHE_KEY,
          JSON.stringify(parsed)
        );
        return [parsed.lat, parsed.lng] as CoordinateTuple;
      }
    } catch {}
  }

  return null; // Use default
}, [getSetting]);
```

**Expected Result:**

- Map starts at position from settings
- Fast loading from localStorage cache
- Respects admin configuration

### Phase 3: Filter Popover Component ✅

**Tasks:**

1. Create `MapFilterPopover` component
2. Android messenger-style design
3. Fetch data using client hooks:
   - `useFetchTransportServices` - for services
   - `useFetchBusLanes` - for lanes
   - `useFetchBusStops` - for stops (optional)
4. Show checkboxes for each service
5. Show checkboxes for each lane
6. Show toggle for stops
7. Floating button to open popover
8. Close on outside click

**Files to Create:**

- `components/map/public/map-filter-popover.tsx`

**Files to Modify:**

- `app/map/page.tsx`

**Design:**

- Floating filter button (bottom-right or top-right)
- Popover opens on click
- Scrollable list of filters
- Checkboxes for services and lanes
- Toggle for stops
- "Clear All" / "Select All" buttons
- Shows count of active filters

**Expected Result:**

- Clean filter button overlay
- Popover with all filter options
- Individual service/lane filtering
- Easy to use on mobile

### Phase 4: Progressive Lane Disclosure ✅

**Tasks:**

1. Modify `InteractiveBusMap` to support lane visibility state
2. Group lanes by service
3. Show only starting point markers initially
4. Track which services/lanes are expanded
5. On starting point click:
   - Show all lanes for that service
   - Show end point markers
   - Mark service as expanded
6. Allow collapsing expanded services

**Files to Modify:**

- `components/map/interactive-bus-map.client.tsx`
- `app/map/page.tsx`

**State Management:**

```typescript
const [expandedServices, setExpandedServices] = useState<Set<string>>(
  new Set()
);
const [expandedLanes, setExpandedLanes] = useState<Set<string>>(new Set());

const handleStartingPointClick = (serviceId: string, laneId: string) => {
  // Expand service to show all lanes
  setExpandedServices((prev) => new Set(prev).add(serviceId));
  setExpandedLanes((prev) => new Set(prev).add(laneId));
};
```

**Lane Rendering Logic:**

```typescript
// Only show starting point if service not expanded
const shouldShowStartingPoint = !expandedServices.has(lane.serviceId);
const shouldShowLane =
  expandedServices.has(lane.serviceId) || expandedLanes.has(lane.id);
```

**Expected Result:**

- Clean map with only starting points
- Click starting point → reveals lanes
- Progressive disclosure reduces clutter
- Better performance with fewer visible elements

### Phase 5: Filter Integration ✅

**Tasks:**

1. Connect filter state to map rendering
2. Filter lanes by selected services
3. Filter lanes by selected lanes
4. Filter stops by toggle
5. Update map when filters change
6. Persist filter state in localStorage (optional)

**Files to Modify:**

- `components/map/public/map-filter-popover.tsx`
- `components/map/interactive-bus-map.client.tsx`
- `app/map/page.tsx`

**Filter Logic:**

```typescript
const filteredLanes = useMemo(() => {
  return lanes.filter((lane) => {
    // Service filter
    if (
      selectedServices.length > 0 &&
      !selectedServices.includes(lane.serviceId)
    ) {
      return false;
    }
    // Lane filter
    if (selectedLanes.length > 0 && !selectedLanes.includes(lane.id)) {
      return false;
    }
    return true;
  });
}, [lanes, selectedServices, selectedLanes]);
```

**Expected Result:**

- Filters work in real-time
- Map updates when filters change
- Smooth transitions
- Clear visual feedback

## Component Structure

```
app/map/
└── page.tsx                    [UPDATE] Full-screen layout, starting position, filter integration

components/map/
├── interactive-bus-map.client.tsx  [UPDATE] Progressive lane disclosure, filter support
└── public/
    └── map-filter-popover.tsx      [NEW] Filter popover component
```

## Data Fetching Strategy

### Client Hooks Usage

1. **Transport Services**: `useFetchTransportServices`
   - Fetch all services for filter list
   - No pagination needed (usually < 20 services)

2. **Bus Lanes**: `useFetchBusLanes`
   - Fetch all lanes for filter list
   - May need pagination if many lanes

3. **Bus Stops**: `useFetchBusStops` (optional)
   - For stop count/filtering
   - May not need individual stop filters

### Caching Strategy

- Use React Query caching (already in hooks)
- Filter state in component state
- No need for separate cache layer

## UI/UX Design

### Filter Button

- Floating button (bottom-right corner)
- Icon: Filter or Layers
- Badge showing active filter count
- Rounded, shadowed, prominent

### Filter Popover

- Bottom sheet style (mobile) or popover (desktop)
- Max height: 70vh
- Scrollable content
- Sections:
  1. Transport Services (checkboxes)
  2. Bus Lanes (checkboxes)
  3. Stops (toggle)
- "Clear All" button at bottom
- Close button (X) at top

### Starting Point Markers

- Use service icon if available
- Default starting marker if no icon
- Clickable with hover effect
- Tooltip: "Click to show lanes"

### Expanded Lanes

- Show all polylines for service
- Show end point markers
- Different color/weight for expanded lanes
- Smooth animation on expand

## Translation Keys

Add to `i18n/locales/{lang}/Map.json`:

```json
{
  "Filters": "Filters",
  "ActiveFilters": "Active Filters",
  "TransportServices": "Transport Services",
  "BusLanes": "Bus Lanes",
  "Stops": "Stops",
  "ShowAll": "Show All",
  "ClearAll": "Clear All",
  "ClickToShowLanes": "Click to show lanes",
  "NoServices": "No services available",
  "NoLanes": "No lanes available",
  "FilterCount": "{count} active",
  "ExpandLanes": "Expand lanes",
  "CollapseLanes": "Collapse lanes"
}
```

## Testing Checklist

### Full-Screen Layout

- [ ] Map takes up 100vh
- [ ] No padding/margins
- [ ] Filter button visible
- [ ] Responsive on mobile

### Starting Position

- [ ] Uses localStorage cache
- [ ] Falls back to settings
- [ ] Uses default if no settings
- [ ] Caches position correctly

### Filter Popover

- [ ] Opens on button click
- [ ] Shows all services
- [ ] Shows all lanes
- [ ] Shows stops toggle
- [ ] Closes on outside click
- [ ] Updates map when filters change
- [ ] Shows active filter count

### Progressive Lane Disclosure

- [ ] Only starting points visible initially
- [ ] Clicking starting point shows lanes
- [ ] End points appear when expanded
- [ ] Can collapse expanded services
- [ ] Smooth animations

### Filter Integration

- [ ] Service filter works
- [ ] Lane filter works
- [ ] Stop toggle works
- [ ] Multiple filters work together
- [ ] Map updates in real-time

### Performance

- [ ] No lag when expanding lanes
- [ ] Smooth animations
- [ ] Efficient re-renders
- [ ] No memory leaks

## Success Criteria

1. ✅ Map is full-screen and immersive
2. ✅ Starting position from settings/localStorage
3. ✅ Filter popover with all options
4. ✅ Progressive lane disclosure
5. ✅ Smooth animations and transitions
6. ✅ Mobile-friendly interface
7. ✅ Fast performance
8. ✅ No regressions

## Implementation Order

1. **Phase 1**: Full-screen layout (quick win)
2. **Phase 2**: Starting position (foundation)
3. **Phase 3**: Filter popover (UI component)
4. **Phase 4**: Progressive disclosure (core feature)
5. **Phase 5**: Filter integration (connect everything)

## Latest Updates (Phase 7) ✅

### Fixed Scrolling and Zoom Issues

**Problem:**

- Page was scrollable when it shouldn't be
- Map was too large, requiring scrolling
- Starting position always zoomed out too far ("starting at the sky")

**Solution:**

- Made page completely non-scrollable with fixed positioning
- Prevented body/html scrolling with useEffect
- Increased zoom level to 15 when initialCenter is provided (from settings)
- Disabled auto-fit bounds when initialCenter is set (prevents zooming out)
- Removed fixed height constraints from map container

**Changes:**

1. **Page Container**: Fixed positioning with `overflow-hidden` and `100vh/100vw`
2. **Body Scrolling**: useEffect prevents body and html scrolling
3. **Zoom Logic**:
   - Default zoom: 13 (when using default center)
   - Position zoom: 15 (when initialCenter from settings is used)
4. **Auto-fit**: Only enabled when no initialCenter is provided
5. **Map Container**: Removed fixed height, uses `h-full` for flexibility

**Expected Result:**

- No scrolling possible on map page
- Map fits perfectly in viewport
- Proper zoom level when starting position is set
- No "starting at the sky" issue

## Latest Updates (Phase 6) ✅

### Fixed Filter Behavior

**Problem:**

- When filtering by transport service, starting points were hidden
- Couldn't collapse expanded lanes
- Filter popover was hidden behind map (z-index issue)

**Solution:**

- Starting points always visible regardless of filter state
- Click starting point again to collapse expanded lanes
- Fixed z-index: Filter button (z-1500), Popover (z-2000)
- Starting points use all lanes (not filtered) for grouping

**Changes:**

1. `lanesByService` now uses all lanes instead of filtered lanes
2. Starting point markers always render (even when service expanded)
3. Tooltip changes: "Click to show lanes" → "Click to collapse lanes"
4. Z-index hierarchy: Map (z-0) < Filter Button (z-1500) < Popover (z-2000)

### Transport Service Popup

**Problem:**

- No way to see full service details
- No information about schedules, stops, routes, images
- Clicking service marker only expanded lanes

**Solution:**

- Created `TransportServicePopup` component
- Shows comprehensive service information:
  - Service name, type, color, icon
  - All lanes (with images)
  - All routes
  - All stops
  - Schedules (grouped by route)
  - Images from lanes (with previewer)
- Opens when clicking starting point marker
- Uses ImagePreviewer for image viewing

**Implementation:**

1. Created `components/map/public/transport-service-popup.tsx`
2. Fetches schedules using `useFetchBusSchedules`
3. Fetches full lane details with images using `useFetchBusLanes`
4. Groups schedules by route for better organization
5. Shows first 10 stops with "+X more" indicator
6. Image gallery with click-to-preview functionality

**Data Displayed:**

- **Service Info**: Name, type, color badge, icon
- **Lanes**: List of all lanes with color indicators
- **Routes**: List of all routes with route numbers
- **Stops**: List of related stops (first 10 shown)
- **Schedules**: Grouped by route, shows departure times and days
- **Images**: Grid of lane images, clickable for full preview

**User Experience:**

1. Click starting point marker → Popup opens with service details
2. Click again on marker → Toggles lane expansion (show/hide lanes)
3. Click image in popup → Opens ImagePreviewer for full-screen viewing
4. Scroll through schedules, stops, routes in organized sections

## Notes

- Follow existing code patterns from map editor
- Maintain type safety throughout
- Use React Query for data fetching
- Optimize for mobile devices
- Test on different screen sizes
- Update this document as tasks are completed
