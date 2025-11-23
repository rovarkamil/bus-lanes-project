# Map Editor Improvements & Bug Fixes

## Overview

This document outlines the improvements and bug fixes needed for the new map editor at `/dashboard/editor`.

## Current Issues

### 1. Map Icon Selector Layout Issues

**Problem:**

- Icons at the bottom are too large
- Takes up too much space
- Requires scrolling to see all icons
- Not compact enough

**Solution:**

- Reduce icon size from current to smaller dimensions
- Increase grid columns for more icons per row
- Reduce padding and spacing
- Optimize height to fit without scrolling
- Make icons more compact overall

**Files to Modify:**

- `app/dashboard/editor/components/map-icon-selector.tsx`
- `app/dashboard/editor/page.tsx`

### 2. Lane Editing Mode Not Working

**Problem:**

- Clicking on an existing lane places a marker instead of entering edit mode
- Should be able to edit existing lane paths
- Should be able to add/remove points from existing lanes
- Should be able to drag existing points

**Solution:**

- Implement proper lane click handling
- Create edit mode state for lanes
- Allow point manipulation on selected lanes
- Show visual feedback for selected lane
- Prevent marker placement when clicking lanes

**Files to Modify:**

- `app/dashboard/editor/components/existing-layers.tsx`
- `app/dashboard/editor/components/lane-drawing-tool.tsx`
- `app/dashboard/editor/components/map-editor-sidebar.tsx`
- `app/dashboard/editor/page.tsx`

### 3. Limited Point Placement (Only 2 Points)

**Problem:**

- Can only place 2 points on the map
- After 2 points, cannot add more
- Lane drawing stops prematurely
- Logic incorrectly limits path points

**Solution:**

- Fix the lane drawing logic
- Remove the 2-point limitation
- Allow continuous point addition
- Properly handle path array updates
- Reference old map editor logic

**Files to Modify:**

- `app/dashboard/editor/components/lane-drawing-tool.tsx`

### 4. Cannot Place Stop Signs

**Problem:**

- Stop sign placement not working
- No mode to place stops
- Missing stop placement functionality
- Stop icon selector not connected

**Solution:**

- Implement stop placement mode
- Add mode toggle between "lane" and "stop"
- Connect stop placement to map clicks
- Show stop markers on placement
- Add stop management UI

**Files to Modify:**

- `app/dashboard/editor/page.tsx`
- `app/dashboard/editor/components/map-editor-canvas.tsx`
- `app/dashboard/editor/components/map-editor-sidebar.tsx`
- Create new component: `app/dashboard/editor/components/stop-drawing-tool.tsx`

## Implementation Plan

### Phase 1: Fix Map Icon Selector Layout ✓

1. Reduce icon button size
2. Increase grid columns from 10 to 12-14
3. Reduce padding and margins
4. Adjust container height
5. Test responsive layout

### Phase 2: Fix Lane Drawing Logic ✓

1. Review and fix the lane drawing condition
2. Remove 2-point limitation
3. Allow unlimited point addition
4. Test continuous drawing
5. Ensure path normalization works correctly

### Phase 3: Implement Lane Edit Mode ✓

1. Add lane selection state
2. Create edit mode toggle
3. Implement point editing for selected lanes
4. Add visual feedback for selected lane
5. Allow dragging points on selected lanes
6. Add/remove points from selected lanes
7. Save edited lane paths

### Phase 4: Implement Stop Placement ✓

1. Add editor mode state (lane/stop)
2. Create mode toggle UI
3. Implement stop drawing tool component
4. Connect stop placement to map clicks
5. Show draft stops on map
6. Add stop management in sidebar
7. Integrate stop creation with bulk dialogs

## Reference Implementation

### Old Map Editor Features to Port

From `components/map/map-editor.tsx`:

1. **Editor Mode Toggle**

```typescript
const [editorMode, setEditorMode] = useState<"lane" | "stop">("lane");
```

2. **Draft Stops Management**

```typescript
const [draftStops, setDraftStops] = useState<DraftStop[]>([]);
const handleAddStop = (point: CoordinateTuple) => {
  setDraftStops((prev) => [
    ...prev,
    { latitude: point[0], longitude: point[1] },
  ]);
};
```

3. **Lane Editing**

```typescript
const handleLaneClick = (lane: MapLane) => {
  setSelectedLane(lane);
  setEditingMode("edit");
  setDraftPath(normalizePathPoints(lane.path || []));
  setName(lane.name?.en || "");
  // ... other fields
};
```

4. **Proper Point Addition Logic**

```typescript
const handleAddPoint = (point: CoordinateTuple) => {
  if (editingMode === "edit" && selectedLane) {
    // In edit mode, add to the selected lane's path
    setDraftPath((prev) => {
      const newPath = [...prev, point];
      return normalizePathPoints(newPath);
    });
  } else {
    // In draft mode, add normally
    setDraftPath((prev) => {
      const newPath = [...prev, point];
      return normalizePathPoints(newPath);
    });
  }
};
```

5. **Map Click Handler**

```typescript
const MapClickHandler = ({
  onAddPoint,
  onAddStop,
  mode,
  onStopClick,
}: {
  onAddPoint: (point: CoordinateTuple) => void;
  onAddStop: (point: CoordinateTuple) => void;
  mode: "lane" | "stop";
  onStopClick?: (point: CoordinateTuple) => void;
}) => {
  useMapEvents({
    click: (event) => {
      const point: CoordinateTuple = [event.latlng.lat, event.latlng.lng];

      if (mode === "stop" && onStopClick) {
        onStopClick(point);
        return;
      }

      if ((event.originalEvent as MouseEvent)?.shiftKey) {
        onAddStop(point);
        return;
      }

      if (mode === "lane") {
        onAddPoint(point);
      }
    },
  });
  return null;
};
```

## Files Structure

```
app/dashboard/editor/
├── components/
│   ├── map-editor-canvas.tsx       [UPDATE] Add mode support
│   ├── map-editor-sidebar.tsx      [UPDATE] Add mode toggle & stop management
│   ├── lane-drawing-tool.tsx       [FIX] Remove 2-point limit, add edit mode
│   ├── stop-drawing-tool.tsx       [NEW] Stop placement functionality
│   ├── existing-layers.tsx         [UPDATE] Add proper lane click handling
│   ├── map-editor-controls.tsx     [KEEP] No changes needed
│   └── map-icon-selector.tsx       [UPDATE] Make icons smaller & more compact
└── page.tsx                        [UPDATE] Add mode state management
```

## Testing Checklist

### Map Icon Selector

- [ ] Icons are smaller and more compact
- [ ] All icons visible without scrolling
- [ ] Grid shows more icons per row
- [ ] Selection state is clear
- [ ] Responsive on different screen sizes

### Lane Drawing

- [ ] Can place unlimited points (not just 2)
- [ ] Points are draggable
- [ ] Can undo last point
- [ ] Can remove individual points
- [ ] Path displays correctly on map
- [ ] Can complete and save lanes

### Lane Editing

- [ ] Clicking lane enters edit mode
- [ ] Selected lane is highlighted
- [ ] Can drag existing points
- [ ] Can add new points to selected lane
- [ ] Can remove points from selected lane
- [ ] Can save edited lane
- [ ] Can cancel edit mode
- [ ] No marker placed when clicking lane

### Stop Placement

- [ ] Mode toggle works (lane/stop)
- [ ] Can place stop signs on map
- [ ] Draft stops visible on map
- [ ] Can remove draft stops
- [ ] Can save stops with bulk dialog
- [ ] Stop icon displays correctly
- [ ] Stop position is accurate

### Overall Functionality

- [ ] No conflicts between lane and stop modes
- [ ] Dialogs open and close correctly
- [ ] Map doesn't remount unnecessarily
- [ ] All state updates work correctly
- [ ] No console errors
- [ ] Performance is acceptable

## Translation Keys Needed

Add to `i18n/locales/{lang}/Map.json`:

```json
{
  "EditorMode": "Editor Mode",
  "LaneMode": "Lane Mode",
  "StopMode": "Stop Mode",
  "ClickMapToDrawLanes": "Click on the map to draw lanes",
  "ClickMapToPlaceStops": "Click on the map to place stops",
  "DraftStops": "Draft Stops",
  "EditingLane": "Editing Lane",
  "AddPointsToLane": "Add points to lane",
  "DragPointsToMove": "Drag points to move them",
  "ClickLaneToEdit": "Click a lane to edit it",
  "StopNumber": "Stop {number}",
  "RemoveStop": "Remove Stop",
  "SaveStops": "Save Stops",
  "ClearStops": "Clear Stops"
}
```

## Performance Considerations

1. **Memoization**: Use `useMemo` for expensive calculations
2. **Callback Stability**: Use `useCallback` for event handlers
3. **Prevent Remounts**: Stable keys and refs for map components
4. **Efficient Updates**: Update only changed state
5. **Debouncing**: Debounce frequent updates if needed

## Success Criteria

1. ✅ Map icons are smaller and all visible without scrolling
2. ✅ Can place unlimited points for lanes (not just 2)
3. ✅ Can click lane to edit it without placing markers
4. ✅ Can add/remove/drag points on selected lanes
5. ✅ Can place stop signs on the map
6. ✅ Mode toggle works between lane and stop modes
7. ✅ All existing functionality still works
8. ✅ No regressions or new bugs introduced
9. ✅ Individual edit icons for each lane/stop
10. ✅ Improved icon visibility with proper z-index
11. ✅ Selected lane highlights on map
12. ✅ Mode-specific entity lists
13. ✅ Map pans to entity location when editing
14. ✅ Dialogs appear above map (z-index fixed)
15. ✅ Smooth animations when panning to locations
16. ✅ Update dialog opens when editing existing lanes
17. ✅ Create dialog opens when creating new lanes
18. ✅ Can drag stop markers to reposition them
19. ✅ Visual feedback for stop editing mode
20. ✅ Stop position updates when dragging
21. ✅ "Save Position" button appears when stop is moved
22. ✅ New coordinates displayed in real-time
23. ✅ Can save stop position directly without opening dialog
24. ✅ Can cancel position changes
25. ✅ Loading state during position save

## Latest Improvements (Phase 5)

### Individual Edit Icons ✅

**Problem:**

- Had bulk "Update Lanes" button that was confusing
- No way to edit individual lanes/stops directly
- Required selecting all lanes to update

**Solution:**

- Added edit icon beside each existing lane in sidebar
- Added edit icon beside each existing stop in sidebar
- Removed bulk "Update Lanes" button
- Click lane item to highlight on map
- Click edit icon to edit that specific entity

**Changes:**

1. Each lane/stop now has an edit button (pencil icon)
2. Clicking lane item highlights it on map with visual feedback
3. Selected lane is thicker (weight 8) and fully opaque
4. Selected lane shows in sidebar with accent background and border
5. Removed `UpdateBusLanesMapEditorDialog` and related code
6. Shows "(Selected)" in tooltip for selected lane

### Improved Icon Visibility ✅

**Problem:**

- Map icons at bottom were barely visible
- Map layer was covering the icon selector
- No clear separation between map and icons

**Solution:**

- Added `z-10` positioning to icon selector container
- Added `shadow-lg` for visual separation
- Added white background to individual icon buttons
- Added visible borders to icon buttons
- Added background colors to ensure visibility
- Made icon selector "float" above map

**Changes:**

1. Icon selector has `relative z-10` positioning
2. Individual icons have white background with borders
3. Better visual hierarchy with shadows
4. Icons always visible regardless of map content

### Mode-Specific Entity Lists ✅

**Problem:**

- Sidebar showed all entities regardless of mode
- Cluttered interface
- Confusing which entities to work with

**Solution:**

- Show "Existing Lanes" only in Lane Mode
- Show "Existing Stops" only in Stop Mode
- Each mode shows only relevant entities
- Cleaner, more focused interface

**Changes:**

1. Wrapped "Existing Lanes" section in `editorMode === "lane"` check
2. Added new "Existing Stops" section for Stop Mode
3. Each section has its own count badge
4. Better organization and clarity

## Notes

- Follow existing code patterns from `components/map/map-editor.tsx`
- Maintain type safety throughout
- Keep components modular and reusable
- Test thoroughly before considering complete
- Update this document as tasks are completed

## Latest Updates (Phase 6) ✅

### Implemented Edit Functionality

**Lane Edit Icon:**

- Clicking the edit icon now loads the lane into draft state
- Lane path is displayed on the map for editing
- Lane is automatically selected and highlighted
- Can now add/remove/drag points on the edited lane
- All lane properties are loaded (color, weight, opacity, name, etc.)

**Stop Edit Icon:**

- Clicking the edit icon opens the UpdateBusStopDialog
- Stop data is converted from MapStop to BusStopWithRelations format
- All stop properties are editable (name, position, amenities, etc.)
- Dialog handles saving changes back to database
- Map refreshes after successful update

**Implementation Details:**

1. Lane edit: Loads lane data into `draftLanes` state array
2. Stop edit: Opens `UpdateBusStopDialog` with converted stop data
3. Both maintain proper type safety with casting where needed
4. Both refresh data after successful edits

## Latest Updates (Phase 7) ✅

### Map Panning on Edit

**Problem:**

- When clicking edit icon, couldn't see where the lane/stop was located
- Had to manually pan the map to find the edited entity
- Poor user experience for editing

**Solution:**

- Added programmatic map control using `useMap` hook from react-leaflet
- Created `MapController` component with `useImperativeHandle` to expose `panTo` method
- Added `onPanToLocation` callback to sidebar
- Map automatically pans to entity when edit icon is clicked

**Implementation:**

1. **MapController Component**: Wraps `useMap` hook and exposes `panTo` method via ref
2. **mapControllerRef**: Ref in page.tsx to control map programmatically
3. **handlePanToLocation**: Callback that uses ref to pan map
4. **Lane Edit**: Calculates center of lane path and pans to it (zoom 15)
5. **Stop Edit**: Pans directly to stop coordinates (zoom 16)

**Changes:**

- Lane edit: Pans to center of all path points with smooth animation
- Stop edit: Pans to exact stop location with smooth animation
- Animation duration: 0.5 seconds for smooth transition
- Zoom levels optimized for visibility

### Dialog Z-Index Fix

**Problem:**

- Dialog was hidden behind the map
- Couldn't interact with "Save Drafts" dialog
- Map's z-index was higher than dialog

**Solution:**

- Added explicit `z-0` to map container and wrapper
- Dialogs use `z-50` (shadcn default)
- Ensures proper stacking order: Map (z-0) < Dialogs (z-50)

**Changes:**

1. Map wrapper div: Added `z-0` class
2. MapContainer: Added `z-0` class
3. Dialogs automatically appear above map (z-50 > z-0)
4. No impact on other UI elements

## Latest Updates (Phase 8) ✅

### Smart Dialog Selection: Update vs Create

**Problem:**

- When editing an existing lane, clicking "Save Drafts" was opening the create dialog
- This would create a duplicate lane instead of updating the existing one
- User expected update dialog when in edit mode, create dialog when creating new lanes

**Solution:**

- Added optional `id` field to `MapEditorLaneDraft` type to track existing lanes
- When clicking edit icon on a lane, the draft now includes the lane's ID
- "Save Drafts" button now checks if drafts have IDs:
  - **Has IDs** → Opens `UpdateBusLanesMapEditorDialog`
  - **No IDs** → Opens `CreateBusLanesMapEditorDialog`
- Properly converts `MapLane` to `BusLaneWithRelations` format for update dialog

**Implementation:**

1. Modified `MapEditorLaneDraft` interface to include optional `id` field
2. When loading lane for edit, include `id: lane.id` in draft
3. Added `handleCreateLanes` logic to detect editing vs creating
4. Added state for `lanesForUpdate` and `isUpdateLanesDialogOpen`
5. Render both dialogs conditionally based on mode

**User Experience:**

- Edit lane → Modify path → Save Drafts → **Updates existing lane** ✅
- Draw new lane → Save Drafts → **Creates new lane** ✅

### Stop Position Editing

**Problem:**

- Clicking edit icon on stops only opened the dialog
- No way to move/reposition a stop on the map
- Had to manually enter latitude/longitude coordinates

**Solution:**

- Implemented two-step stop editing workflow:
  1. **First click** on edit icon → Enters "position editing mode"
     - Stop marker becomes draggable
     - Can drag marker to new position on map
     - Visual feedback: highlighted in sidebar, "Editing Position" label, filled edit button
  2. **Second click** on edit icon → Opens update dialog with new position
     - Save changes to persist new position

**Implementation:**

1. Added `editingStopId` state to track which stop is being repositioned
2. Added `onEditingStopChange` callback prop to sidebar
3. Modified stop edit button to toggle between editing mode and dialog
4. Made stop markers draggable when `editingStopId` matches
5. Added `dragend` event handler to update position in real-time
6. Visual indicators:
   - Highlighted row in sidebar with primary border
   - "(Editing Position)" text next to stop name
   - Filled edit button instead of ghost
   - Tooltip shows "(Drag to reposition)" on marker

**User Experience:**

1. Click edit icon on stop → Stop becomes draggable, map pans to stop
2. Drag stop marker to new position → Position updates in real-time
3. Click edit icon again → Opens update dialog with new coordinates
4. Save → Position persisted to database

**Technical Details:**

- Pass `editingStopId` through: Page → Sidebar & Canvas → ExistingLayers
- Marker receives `draggable={editingStopId === stop.id}`
- Event handler: `dragend` → `onStopPositionUpdate(stopId, [lat, lng])`
- Position updates happen on drag, but only persist when dialog saved

## Latest Updates (Phase 9) ✅

### Save Stop Position Button

**Problem:**

- When dragging a stop to a new position, there was no explicit save button
- Users had to click edit icon again to open dialog to save
- No clear indication that position had changed
- No easy way to cancel position changes

**Solution:**

- Added "Save Position" button that appears when stop is dragged
- Shows new coordinates in real-time
- Dedicated save button with loading state
- Cancel button to discard changes
- Prominent banner with primary color highlighting
- Direct API call to update only position (fast and efficient)

**Implementation:**

1. Added `editingStopNewPosition` state in page.tsx to track new coordinates
2. Updated `handleStopPositionUpdate` to store position when dragged
3. Added `onCancelStopEdit` callback to reset editing state
4. Created `handleSaveStopPosition` function using `useUpdateBusStop` hook
5. Added prominent banner UI in sidebar with:
   - "Position Changed" heading
   - New coordinates display (6 decimal precision)
   - "Save Position" button with check icon
   - Cancel button with X icon
   - Loading state during save
   - Success/error toast notifications

**User Experience:**

1. Click edit icon on stop → Stop becomes draggable
2. Drag stop to new location → Banner appears showing new coordinates
3. Click **"Save Position"** → Position saved to database immediately
4. Or click **Cancel (X)** → Discard changes and exit editing mode

**Visual Design:**

- **Banner**: Primary color background with border for high visibility
- **Coordinates**: Shown with 6 decimal places for precision
- **Loading State**: Spinner + "Saving..." text during API call
- **Icons**: Check mark for save, X for cancel
- **Responsive**: Full-width button layout with proper spacing

**Technical Details:**

- Only updates `latitude` and `longitude` fields (minimal payload)
- Uses existing `useUpdateBusStop` mutation hook
- Clears editing state on success: `editingStopId` + `editingStopNewPosition`
- Refreshes map data to show updated position
- Toast notifications for user feedback
- Disabled buttons during save operation

## Known Issues / TODO

1. ✅ **Edit Icon Functionality**: COMPLETED - Edit icons now open dialogs/load data
2. ✅ **Lane Path Editing**: COMPLETED - Can edit path after clicking edit icon
3. ✅ **Stop Edit Dialog**: COMPLETED - Connected to UpdateBusStopDialog
4. ✅ **Map Panning**: COMPLETED - Map pans to entity when editing
5. ✅ **Dialog Z-Index**: COMPLETED - Dialogs now appear above map
6. ✅ **Smart Dialog Selection**: COMPLETED - Opens update dialog when editing, create when creating new
7. ✅ **Stop Position Editing**: COMPLETED - Can drag stops to reposition them
8. ✅ **Persist Stop Position**: COMPLETED - Save Position button added with direct API call
9. **Multiple Lane Editing**: Currently only supports editing one lane at a time
10. **Create New Lane Button**: Need to add button to start creating a new lane from sidebar
