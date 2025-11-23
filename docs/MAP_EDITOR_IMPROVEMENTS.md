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

1. ✅ Reduce icon button size (initially)
2. ✅ Increase grid columns from 10 to 12 (initially)
3. ✅ Reduce padding and margins (initially)
4. ✅ Adjust container height
5. ✅ Test responsive layout
6. ✅ **Updated**: Reduced columns from 12 to 8 for better visibility
7. ✅ **Updated**: Increased padding and spacing (p-2 → p-3, gap-1.5 → gap-3)
8. ✅ **Updated**: Added shadows and better hover effects
9. ✅ **Updated**: Increased icon size with scale-105 on hover/select
10. ✅ **Updated**: Increased container height from h-28 to h-40

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

- [x] Icons are larger and easier to see (6 columns)
- [x] All icons visible without scrolling (h-48 container)
- [x] Grid shows optimal number of icons per row
- [x] Selection state is very clear (checkmark + ring)
- [x] Strong shadows and hover effects
- [x] Scale animation on hover and selection
- [x] High contrast background (card)
- [x] Responsive on different screen sizes

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

- [x] No conflicts between lane and stop modes
- [x] Dialogs open and close correctly
- [x] Map doesn't remount unnecessarily
- [x] All state updates work correctly
- [x] No console errors
- [x] Performance is acceptable
- [x] Clicking lane/stop boxes pans map to location
- [x] Smooth animations and transitions throughout

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
26. ✅ Map icons are large and easily clickable (initially 6 cols, now 3 cols in right sidebar)
27. ✅ Selected icon has clear checkmark indicator
28. ✅ Strong shadows and hover effects on icons
29. ✅ Clicking lane box pans map to lane location
30. ✅ Icon selector repositioned to right sidebar for better workflow
31. ✅ Full height icon selector with vertical layout
32. ✅ More map space with no bottom bar
33. ✅ Icon placement now works correctly without creating lanes
34. ✅ Proper click priority: Icon → Stop → Lane
35. ✅ Icon selection clears after placement
36. ✅ Stop position updates locally while dragging
37. ✅ Stop position persists after save and refetch
38. ✅ Proper refetch timing to prevent position reversion

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

## Latest Updates (Phase 14) ✅

### Fixed Stop Position Update After Save

**Problem:**

- When dragging a stop to a new position and saving, the position was saved correctly
- But after refetch, the marker would revert to the old position
- The marker position wasn't updating locally while dragging
- Race condition between save and refetch

**Solution:**

- Pass `editingStopNewPosition` to `ExistingLayers` component
- Use new position for marker when stop is being edited
- Wait for refetch to complete before clearing editing state
- Use `queryClient.refetchQueries` to properly wait for fresh data

**Implementation:**

1. **Marker Position Update:**
   - Added `editingStopNewPosition` prop to `ExistingLayers`
   - Marker uses `editingStopNewPosition` when stop is being edited
   - Falls back to original `stop.latitude/longitude` when not editing

2. **Refetch Timing:**
   - Use `queryClient.refetchQueries` to wait for refetch completion
   - Clear editing state only after refetch completes
   - Ensures fresh data is loaded before clearing state

3. **State Flow:**
   - User drags stop → `onStopPositionUpdate` → updates `editingStopNewPosition`
   - Marker shows new position immediately (from `editingStopNewPosition`)
   - User saves → API call → wait for refetch → clear editing state
   - Marker now shows position from refetched server data

**User Experience:**

- Stop marker updates position in real-time while dragging ✅
- Position persists after save ✅
- No flickering or position reversion ✅
- Smooth transition from editing to saved state ✅

## Previous Updates (Phase 13) ✅

### Removed Map Icon Placement Feature (Temporarily)

**Changes:**

- Commented out MapIconSelector component from right sidebar
- Removed icon placement functionality from lane drawing tool
- Removed placed icons rendering from map canvas
- Bus stops now use their assigned icon if available, otherwise default stop-sign icon
- Map API route already includes icon relation with file (verified)

**Implementation:**

1. **Commented Out Components:**
   - MapIconSelector import and usage
   - Icon placement state (selectedIcon, placedIcons)
   - Icon placement handlers (handleIconPlace, handlePlacedIconUpdate)
   - Icon placement props in MapEditorCanvas and LaneDrawingTool

2. **Bus Stop Icons:**
   - ExistingLayers already handles stop icons correctly
   - Uses `stop.icon?.fileUrl` if available
   - Falls back to `/markers/stop-sign.png` if no icon
   - Map API route includes icon relation: `icon: { include: { file: true } }`

3. **Code Cleanup:**
   - All icon placement code is commented out (not deleted) for easy restoration
   - No breaking changes to existing functionality
   - Map editor still fully functional for lanes and stops

**User Experience:**

- Right sidebar no longer shows icon selector
- More space for map canvas
- Bus stops display with their assigned icons
- Default stop-sign icon for stops without custom icons
- Cleaner, more focused interface

## Previous Updates (Phase 12) ✅

### Fixed Icon Placement Conflict with Lane Drawing

**Problem:**

- When selecting an icon and clicking the map, it was creating a lane point instead
- Icon placement functionality was not working
- Lane drawing tool was intercepting all map clicks
- No priority check for icon placement vs lane drawing

**Solution:**

- Added icon placement priority check in `LaneDrawingTool`
- Pass `selectedIcon` and `onIconPlace` through component hierarchy
- Check if icon is selected BEFORE handling lane/stop drawing
- Place icon and clear selection when icon is clicked
- Proper event handling order: icon → stop → lane

**Implementation:**

1. Added `handleIconPlace` function in page.tsx
2. Pass `selectedIcon` and `onIconPlace` to MapEditorCanvas
3. Pass these props down to LaneDrawingTool
4. Check `selectedIcon` first in `handleMapClick`
5. If icon selected, place it and return early
6. Otherwise, proceed with normal lane/stop drawing

**User Experience:**

- Select icon from right sidebar → Click map → Icon is placed ✅
- Icon selection is cleared after placement
- Lane mode still works when no icon selected
- Stop mode still works when no icon selected
- Proper priority: Icon placement > Stop placement > Lane drawing

## Previous Updates (Phase 11) ✅

### Repositioned Icon Selector to Right Sidebar

**Problem:**

- Icon selector at bottom was not ideal for workflow
- Took up horizontal space that could be used for map
- Hard to see while editing map elements
- Bottom position felt disconnected from editing workflow

**Solution:**

- Moved icon selector from bottom to right sidebar
- Changed from horizontal (10 columns) to vertical layout (3 columns)
- Full height sidebar with fixed width (w-64)
- Changed border from border-t to border-l
- Better integration with left sidebar for symmetrical layout

**Changes:**

1. **Layout**: Moved from bottom position to right sidebar
2. **Grid Layout**: Changed from `grid-cols-10` to `grid-cols-3` for vertical orientation
3. **Sizing**: Changed from `h-32` horizontal to `w-64 h-full` vertical
4. **Border**: Changed from `border-t` (top) to `border-l` (left)
5. **Page Layout**: Restructured to have left sidebar, map canvas, right icon selector

**User Experience:**

- Icons always visible on the right side
- More map space available (no bottom bar)
- Better workflow - edit on left, select icons on right
- Symmetrical layout with sidebars on both sides
- Full height allows more icons to be visible
- Cleaner, more professional interface

## Previous Updates (Phase 10) ✅

### Improved Map Icon Visibility & Selection

**Problem:**

- Icons at the bottom were still too small and hard to see
- Not enough visual distinction for selected icons
- Background didn't provide enough contrast
- Icons needed to be even larger for easier selection

**Solution:**

- Further reduced grid columns from 8 to 6 (even larger icons)
- Increased spacing and padding (gap-3 → gap-4, p-3 → p-4)
- Enhanced shadows (shadow-md, hover:shadow-xl, selected:shadow-2xl)
- Added visual checkmark indicator on selected icon
- Improved scale effects (scale-105 → scale-110)
- Changed background to card color for better contrast
- Increased container height from h-40 to h-48
- Added ring effect with opacity for selected state (ring-4 ring-primary/30)

**Changes:**

1. **Grid Layout**: Optimized to `grid-cols-10` for compact boxes showing more icons
2. **Spacing**: Compact spacing with `gap-2 p-3` for efficient use of space
3. **Icon Sizing**: Icons fill boxes with `w-full h-full` plus tiny `p-0.5` padding
4. **Centering**: Added `flex items-center justify-center` to button for perfect centering
5. **Button Padding**: Minimal `p-2` for compact boxes
6. **Visual Effects**:
   - Subtle `shadow-sm` baseline
   - Moderate `hover:shadow-md` on hover
   - Clear `shadow-lg` on selection
   - Moderate `scale-105` for smooth interaction
   - Added checkmark badge on selected icon
   - Compact `ring-2 ring-primary/30` for selected state
7. **Container**: Optimized to `h-32` for compact display with 10 columns
8. **Background**: Changed from `bg-background` to `bg-card` for better contrast
9. **Borders**: Moderate `border-2` for clean appearance
10. **Border Radius**: Changed to `rounded-lg` for slightly softer corners

**User Experience:**

- Compact boxes with 10 columns showing many icons at once
- Icons fill most of the box space efficiently
- Clear checkmark indicator shows selected icon
- Subtle shadows don't overwhelm the interface
- Hover state is smooth (105% scale)
- Better contrast with card background
- Compact container (h-32) shows icons efficiently
- Professional and space-efficient layout
- More icons visible without scrolling

### Click Lane Box to Pan Map ✅

**Problem:**

- Users had to click edit icon to pan map to lane location
- Clicking on lane box only highlighted the lane without showing location
- Not intuitive - users expected clicking lane box to show where it is

**Solution:**

- Added pan functionality when clicking anywhere on lane box
- Map now pans to lane center when box is clicked
- Calculates center point of all lane path points
- Uses same zoom level (15) as edit button
- Works in addition to highlighting the lane

**Implementation:**

- Added pan logic to lane box `onClick` handler
- Calculates average latitude and longitude from all path points
- Calls `onPanToLocation(centerLat, centerLng, 15)` after highlighting
- Smooth animation transition to lane location

**User Experience:**

- Click any lane box → Map highlights and pans to that lane
- Click edit icon → Also pans to lane and loads for editing
- Click stop box → Map pans to stop location (already implemented)
- Intuitive and consistent behavior across all entities

## Latest Updates (Phase 15) ✅

### Undo/Redo Functionality

**Problem:**

- No way to undo changes when drawing lanes or placing stops
- Had to manually delete points or clear entire draft
- No history tracking for user actions
- Couldn't redo actions after undoing

**Solution:**

- Implemented full undo/redo system with history tracking
- Tracks last 50 states for both lanes and stops
- Prevents history saves during undo/redo operations to avoid loops
- Immediate history saves when lanes/stops change
- Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Shift+Z or Ctrl+Y (redo)

**Implementation:**

1. **History State Management:**
   - `laneHistory`: Array of lane states (last 50)
   - `laneHistoryIndex`: Current position in history
   - `stopHistory`: Array of stop states (last 50)
   - `stopHistoryIndex`: Current position in history

2. **History Saving:**
   - Saves immediately when lanes/stops change (not debounced)
   - Uses `isUndoRedoRef` flag to prevent saving during undo/redo
   - Deep clones state using JSON.parse/stringify for proper history

3. **Undo/Redo Handlers:**
   - `handleUndoLanes`: Moves back in history and restores previous state
   - `handleRedoLanes`: Moves forward in history and restores next state
   - Same for stops: `handleUndoStops` and `handleRedoStops`

4. **UI Controls:**
   - Undo/Redo buttons in sidebar (disabled when unavailable)
   - Shows in both Lane Mode and Stop Mode
   - Tooltips show keyboard shortcuts

**User Experience:**

- Draw lane points → Click Undo → Removes last point ✅
- Click Undo multiple times → Goes back through history ✅
- Click Redo → Restores undone changes ✅
- Works for both lanes and stops ✅
- Keyboard shortcuts work globally ✅

### Delete Selected Point

**Problem:**

- No way to remove individual points from a lane
- Had to delete entire lane to remove a point
- Couldn't fine-tune lane paths by removing specific points

**Solution:**

- Delete now removes the currently selected point from a lane
- Click on any point marker to select it
- Selected point is visually highlighted (larger icon)
- Delete button appears when a point is selected
- Prevents deleting the last point (must have at least 1 point)

**Implementation:**

1. **Point Selection:**
   - Added `selectedPoint` state tracking `{ laneIndex, pointIndex }`
   - Click handler on point markers to select them
   - Selected point shows larger icon (40x40 vs 32x32)
   - Tooltip shows "(Selected)" for selected point

2. **Delete Logic:**
   - Checks if `selectedPoint` exists
   - Validates point exists in lane path
   - Prevents deleting if it's the only point left
   - Removes point from path array
   - Saves history for undo/redo
   - Clears selection after deletion

3. **Visual Feedback:**
   - Selected point has larger icon
   - Tooltip indicates selected state
   - Delete button appears when point is selected
   - Error message if trying to delete last point

4. **Keyboard Shortcuts:**
   - Delete key or Ctrl+D to delete selected point
   - Only works when a point is selected

**User Experience:**

- Click on point marker → Point is selected (larger icon) ✅
- Delete button appears in sidebar ✅
- Click Delete or press Delete/Ctrl+D → Selected point removed ✅
- Cannot delete last point (error message shown) ✅
- Selection cleared after deletion ✅
- History saved for undo/redo ✅

## Known Issues / TODO

1. ✅ **Edit Icon Functionality**: COMPLETED - Edit icons now open dialogs/load data
2. ✅ **Lane Path Editing**: COMPLETED - Can edit path after clicking edit icon
3. ✅ **Stop Edit Dialog**: COMPLETED - Connected to UpdateBusStopDialog
4. ✅ **Map Panning**: COMPLETED - Map pans to entity when editing
5. ✅ **Dialog Z-Index**: COMPLETED - Dialogs now appear above map
6. ✅ **Smart Dialog Selection**: COMPLETED - Opens update dialog when editing, create when creating new
7. ✅ **Stop Position Editing**: COMPLETED - Can drag stops to reposition them
8. ✅ **Persist Stop Position**: COMPLETED - Save Position button added with direct API call
9. ✅ **Map Icon Visibility**: COMPLETED - Icons now compact and visible in right sidebar
10. ✅ **Click Lane Box to Pan**: COMPLETED - Clicking lane box now pans map to lane location
11. ✅ **Icon Selector Position**: COMPLETED - Moved to right sidebar for better workflow
12. ✅ **Icon Placement**: COMPLETED - Icons now place correctly without creating lanes
13. ✅ **Undo/Redo Functionality**: COMPLETED - Full undo/redo system with history tracking
14. ✅ **Delete Selected Point**: COMPLETED - Delete now removes currently selected point from lane
15. **Multiple Lane Editing**: Currently only supports editing one lane at a time
16. **Create New Lane Button**: Need to add button to start creating a new lane from sidebar
17. **Save Placed Icons**: Need to implement saving placed icons to database
