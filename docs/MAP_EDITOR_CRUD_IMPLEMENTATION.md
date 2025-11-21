# Map Editor CRUD Implementation Guide

This document outlines the step-by-step implementation plan for adding full CRUD (Create, Read, Update, Delete) functionality for multiple entities directly within the map editor page.

## Overview

The map editor should evolve from a lane-drawing tool into a comprehensive map management interface where users can:
- Create and edit bus lanes with visual path editing
- Create and manage transport services
- Create and manage bus schedules
- Create and manage bus stops (with draft stops)
- Create and manage zones
- All while working directly on the map interface

## Current State

### Existing Functionality
- ✅ Basic lane path drawing (click to add points, Shift+Click for draft stops)
- ✅ Visual point editing (drag markers, remove points)
- ✅ Closing point detection (when first and last points connect)
- ✅ Lane selection and editing (click lane to load into editor)
- ✅ Draft lane creation with name, description, color, service assignment
- ✅ Map data fetching via `useMapEditorData` hook

### Existing Infrastructure
- ✅ API routes for all entities (`/api/employee/*`)
- ✅ Business logic helpers for all entities
- ✅ React hooks for mutations (`useCreateBusLane`, `useUpdateBusLane`, etc.)
- ✅ Type definitions for all models
- ✅ Translation system (i18n) for all features

## Implementation Goals

### Phase 1: Enhanced Lane Management
1. **Update Existing Lanes**
   - Save edited lane paths back to database
   - Update lane metadata (name, description, color, service)
   - Handle path normalization (closing points)

2. **Delete Lanes**
   - Remove lanes from map
   - Soft delete with confirmation dialog

### Phase 2: Transport Service Management
1. **Create Transport Service**
   - Dialog/form for service creation
   - Assign to lanes during creation
   - Visual service selection in lane editor

2. **Update Transport Service**
   - Edit service properties
   - Update service assignments

### Phase 3: Bus Schedule Management
1. **Create Schedule**
   - Select route and stop from map
   - Set departure time, day of week
   - Link to existing routes/stops

2. **View/Edit Schedules**
   - Display schedules for selected route/stop
   - Edit schedule times and days

### Phase 4: Bus Stop Management
1. **Create Bus Stop**
   - Click map to place stop
   - Form for stop details (amenities, zone, icon)
   - Link to lanes/routes

2. **Edit Bus Stop**
   - Update stop position (drag marker)
   - Edit stop properties

### Phase 5: Zone Management
1. **Create Zone**
   - Draw polygon on map
   - Assign color and name
   - Link stops to zones

2. **Edit Zone**
   - Modify polygon shape
   - Update zone properties

## Step-by-Step Implementation

### Step 1: Update Map Editor Component Structure

**File**: `components/map/map-editor.tsx`

**Changes**:
1. Add state management for different editor modes:
   ```tsx
   type EditorMode = "draft" | "edit-lane" | "create-stop" | "create-zone" | "create-service" | "create-schedule";
   const [editorMode, setEditorMode] = useState<EditorMode>("draft");
   ```

2. Add selected entity state:
   ```tsx
   const [selectedLane, setSelectedLane] = useState<MapLane | null>(null);
   const [selectedStop, setSelectedStop] = useState<MapStop | null>(null);
   const [selectedRoute, setSelectedRoute] = useState<MapRoute | null>(null);
   ```

3. Add mutation hooks:
   ```tsx
   const { mutateAsync: updateBusLane } = useUpdateBusLane();
   const { mutateAsync: createBusLane } = useCreateBusLane();
   const { mutateAsync: deleteBusLane } = useDeleteBusLane();
   const { mutateAsync: createTransportService } = useCreateTransportService();
   const { mutateAsync: createBusSchedule } = useCreateBusSchedule();
   const { mutateAsync: createBusStop } = useCreateBusStop();
   ```

### Step 2: Implement Lane Update Functionality

**File**: `components/map/map-editor.tsx`

**Implementation**:

1. Modify `handleSubmit` to handle both create and update:
   ```tsx
   const handleSubmit = async () => {
     if (!canSave) return;
     
     const normalizedPath = normalizePathPoints(draftPath);
     
     if (editingMode === "edit" && selectedLane) {
       // Update existing lane
       try {
         await updateBusLane({
           id: selectedLane.id,
           nameFields: {
             en: name.trim(),
             ar: null,
             ckb: null,
           },
           descriptionFields: description.trim() 
             ? { en: description.trim(), ar: null, ckb: null }
             : undefined,
           color,
           serviceId: serviceId || null,
           path: normalizedPath,
           weight: 5,
           opacity: 0.8,
           isActive: true,
         });
         toast.success(t("Success.Updated"));
         handleResetDraft();
       } catch (error) {
         toast.error(t("Error.UpdateFailed"));
       }
     } else {
       // Create new lane
       try {
         await createBusLane({
           nameFields: {
             en: name.trim(),
             ar: null,
             ckb: null,
           },
           descriptionFields: description.trim()
             ? { en: description.trim(), ar: null, ckb: null }
             : undefined,
           color,
           serviceId: serviceId || null,
           path: normalizedPath,
           draftStops: draftStops.map(s => ({
             latitude: s.latitude,
             longitude: s.longitude,
             name: s.name,
           })),
           weight: 5,
           opacity: 0.8,
           isActive: true,
         });
         toast.success(t("Success.Created"));
         handleResetDraft();
         // Refetch map data to show new lane
         // This should be handled by React Query invalidation
       } catch (error) {
         toast.error(t("Error.CreateFailed"));
       }
     }
   };
   ```

2. Add delete functionality:
   ```tsx
   const handleDeleteLane = async (laneId: string) => {
     if (!confirm(t("Actions.DeleteConfirmMessage"))) return;
     
     try {
       await deleteBusLane({ id: laneId });
       toast.success(t("Success.Deleted"));
       // Refetch map data
     } catch (error) {
       toast.error(t("Error.DeleteFailed"));
     }
   };
   ```

### Step 3: Add Transport Service Creation Dialog

**File**: `components/map/map-editor.tsx`

**Implementation**:

1. Add state for service creation:
   ```tsx
   const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
   ```

2. Import and use the existing `CreateTransportServiceDialog`:
   ```tsx
   import { CreateTransportServiceDialog } from "@/components/dialogs/transport-service/create-transport-service-dialog";
   
   // In JSX:
   <CreateTransportServiceDialog
     isOpen={isServiceDialogOpen}
     onOpenChange={setIsServiceDialogOpen}
     onSuccess={() => {
       // Refetch map data to include new service
       // React Query should handle this automatically
     }}
   />
   ```

3. Add button to open service dialog:
   ```tsx
   <Button
     type="button"
     variant="outline"
     onClick={() => setIsServiceDialogOpen(true)}
   >
     {t("CreateTransportService")}
   </Button>
   ```

### Step 4: Add Bus Schedule Creation

**File**: `components/map/map-editor.tsx`

**Implementation**:

1. Add state for schedule creation:
   ```tsx
   const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
   const [scheduleRoute, setScheduleRoute] = useState<MapRoute | null>(null);
   const [scheduleStop, setScheduleStop] = useState<MapStop | null>(null);
   ```

2. Make routes and stops clickable to set schedule context:
   ```tsx
   // In ExistingLayers component, add click handlers:
   {routes.map((route) => (
     <Polyline
       key={route.id}
       positions={route.path}
       eventHandlers={{
         click: () => {
           setScheduleRoute(route);
           setIsScheduleDialogOpen(true);
         },
       }}
     />
   ))}
   ```

3. Import and use `CreateBusScheduleDialog`:
   ```tsx
   import { CreateBusScheduleDialog } from "@/components/dialogs/bus-schedule/create-bus-schedule-dialog";
   
   <CreateBusScheduleDialog
     isOpen={isScheduleDialogOpen}
     onOpenChange={setIsScheduleDialogOpen}
     initialRouteId={scheduleRoute?.id}
     initialStopId={scheduleStop?.id}
     onSuccess={() => {
       // Refetch if needed
     }}
   />
   ```

### Step 5: Add Bus Stop Creation from Map

**File**: `components/map/map-editor.tsx`

**Implementation**:

1. Modify `MapClickHandler` to support stop creation mode:
   ```tsx
   const MapClickHandler = ({
     onAddPoint,
     onAddStop,
     mode,
   }: {
     onAddPoint: (point: CoordinateTuple) => void;
     onAddStop: (point: CoordinateTuple) => void;
     mode: "lane" | "stop" | "zone";
   }) => {
     useMapEvents({
       click: (event) => {
         const point: CoordinateTuple = [event.latlng.lat, event.latlng.lng];
         
         if (mode === "stop") {
           setDraftStopPosition(point);
           setIsStopDialogOpen(true);
           return;
         }
         
         if ((event.originalEvent as MouseEvent)?.shiftKey) {
           onAddStop(point);
           return;
         }
         onAddPoint(point);
       },
     });
     return null;
   };
   ```

2. Add stop creation dialog:
   ```tsx
   const [isStopDialogOpen, setIsStopDialogOpen] = useState(false);
   const [draftStopPosition, setDraftStopPosition] = useState<CoordinateTuple | null>(null);
   
   <CreateBusStopDialog
     isOpen={isStopDialogOpen}
     onOpenChange={setIsStopDialogOpen}
     initialLatitude={draftStopPosition?.[0]}
     initialLongitude={draftStopPosition?.[1]}
     onSuccess={() => {
       // Refetch map data
     }}
   />
   ```

### Step 6: Add Zone Creation

**File**: `components/map/map-editor.tsx`

**Implementation**:

1. Add polygon drawing mode:
   ```tsx
   const [zonePoints, setZonePoints] = useState<CoordinateTuple[]>([]);
   const [isZoneMode, setIsZoneMode] = useState(false);
   
   // Modify MapClickHandler to support zone mode
   // When in zone mode, clicks add points to zone polygon
   ```

2. Add zone creation dialog:
   ```tsx
   const [isZoneDialogOpen, setIsZoneDialogOpen] = useState(false);
   
   <CreateZoneDialog
     isOpen={isZoneDialogOpen}
     onOpenChange={setIsZoneDialogOpen}
     initialPolygon={zonePoints}
     onSuccess={() => {
       setZonePoints([]);
       setIsZoneMode(false);
       // Refetch map data
     }}
   />
   ```

### Step 7: Add Mode Selector UI

**File**: `components/map/map-editor.tsx`

**Implementation**:

Add a mode selector in the sidebar:
```tsx
<div className="space-y-2">
  <Label>{t("EditorMode")}</Label>
  <Select value={editorMode} onValueChange={setEditorMode}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="draft">{t("Mode.DrawLane")}</SelectItem>
      <SelectItem value="stop">{t("Mode.CreateStop")}</SelectItem>
      <SelectItem value="zone">{t("Mode.CreateZone")}</SelectItem>
      <SelectItem value="schedule">{t("Mode.CreateSchedule")}</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Step 8: Update Map Data Refetching

**File**: `app/dashboard/map-editor/page.tsx`

**Implementation**:

1. Add query invalidation after mutations:
   ```tsx
   import { useQueryClient } from "@tanstack/react-query";
   
   const queryClient = useQueryClient();
   
   // After successful mutations:
   queryClient.invalidateQueries({ queryKey: ["employee-map-data"] });
   ```

2. Pass refetch function to MapEditor:
   ```tsx
   <MapEditorClient
     data={payload}
     onSave={handleSave}
     onRefetch={refetch}
   />
   ```

### Step 9: Add Context Menu for Entities

**File**: `components/map/map-editor.tsx`

**Implementation**:

Add right-click context menus for lanes, stops, routes:
```tsx
const handleLaneContextMenu = (lane: MapLane, event: MouseEvent) => {
  event.preventDefault();
  // Show context menu with options:
  // - Edit
  // - Delete
  // - View Details
};
```

### Step 10: Add Entity List Panel

**File**: `components/map/map-editor.tsx`

**Implementation**:

Add a collapsible panel showing all entities:
```tsx
<div className="space-y-2">
  <Label>{t("ExistingEntities")}</Label>
  <ScrollArea className="max-h-64 rounded border">
    <div className="space-y-1 p-2">
      {data?.lanes?.map((lane) => (
        <div
          key={lane.id}
          className="flex items-center justify-between rounded p-2 hover:bg-muted"
        >
          <span>{lane.name?.en ?? lane.id}</span>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleLaneClick(lane)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleDeleteLane(lane.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  </ScrollArea>
</div>
```

## Technical Considerations

### 1. State Management
- Use React state for UI state (modes, selections, dialogs)
- Use React Query for server state (data fetching, mutations)
- Consider Zustand if state becomes too complex

### 2. Performance
- Memoize expensive computations (path normalization, bounds calculation)
- Use React.memo for map components
- Debounce map interactions if needed

### 3. Error Handling
- Wrap all mutations in try-catch blocks
- Show user-friendly error messages
- Log errors for debugging

### 4. Data Synchronization
- Invalidate queries after mutations
- Optimistically update UI where appropriate
- Handle race conditions in concurrent edits

### 5. User Experience
- Show loading states during mutations
- Provide clear feedback on actions
- Confirm destructive operations
- Allow undo where possible

## Integration Points

### API Routes
All routes follow the pattern: `/api/employee/{entity}`
- `GET` - List with pagination and filters
- `POST` - Create
- `PUT` - Update
- `DELETE` - Soft delete

### Business Logic Helpers
All helpers follow the pattern: `{entity}-helpers.ts`
- `create{Entity}WithBusinessLogic`
- `update{Entity}WithBusinessLogic`
- `delete{Entity}WithBusinessLogic`

### React Hooks
All hooks follow the pattern: `use-{entity}.ts`
- `useFetch{Entity}s` - Query hook
- `useCreate{Entity}` - Mutation hook
- `useUpdate{Entity}` - Mutation hook
- `useDelete{Entity}` - Mutation hook

## Testing Checklist

### Lane Management
- [ ] Create new lane from map
- [ ] Edit existing lane path
- [ ] Update lane metadata
- [ ] Delete lane with confirmation
- [ ] Handle closing points correctly
- [ ] Save draft stops with lane

### Transport Service
- [ ] Create service from map editor
- [ ] Assign service to lane
- [ ] Update service properties
- [ ] Service appears in lane editor dropdown

### Bus Schedule
- [ ] Create schedule from route/stop selection
- [ ] Set departure time and day
- [ ] Link to existing route and stop
- [ ] View schedules for route/stop

### Bus Stop
- [ ] Create stop by clicking map
- [ ] Set stop properties (amenities, zone, icon)
- [ ] Link stop to lanes/routes
- [ ] Edit stop position by dragging
- [ ] Update stop properties

### Zone
- [ ] Draw zone polygon on map
- [ ] Set zone color and name
- [ ] Assign stops to zone
- [ ] Edit zone polygon

### General
- [ ] All mutations refetch map data
- [ ] Error messages display correctly
- [ ] Loading states show during operations
- [ ] Confirmations for destructive actions
- [ ] Translations work for all new UI elements

## Translation Keys Needed

Add to `i18n/locales/{lang}/Map.json`:

```json
{
  "EditorMode": "Editor Mode",
  "Mode.DrawLane": "Draw Lane",
  "Mode.CreateStop": "Create Stop",
  "Mode.CreateZone": "Create Zone",
  "Mode.CreateSchedule": "Create Schedule",
  "CreateTransportService": "Create Transport Service",
  "ExistingEntities": "Existing Entities",
  "Success.Created": "Created successfully",
  "Success.Updated": "Updated successfully",
  "Success.Deleted": "Deleted successfully",
  "Error.CreateFailed": "Failed to create",
  "Error.UpdateFailed": "Failed to update",
  "Error.DeleteFailed": "Failed to delete",
  "Actions.DeleteConfirmMessage": "Are you sure you want to delete this item?",
  "Actions.DeleteConfirmTitle": "Confirm Delete"
}
```

## Next Steps

1. **Start with Phase 1** (Lane Update/Delete) - Most critical, builds on existing code
2. **Add Transport Service creation** - Simplest addition, uses existing dialog
3. **Implement Schedule creation** - Requires route/stop selection logic
4. **Add Stop creation** - Requires map click handling
5. **Add Zone creation** - Most complex, requires polygon drawing

## References

- [Leaflet Setup Guide](./LEAFLET_SETUP.md)
- [Bus Lanes Implementation](./BUS_LANES_IMPLEMENTATION.md)
- [Project Structure](./PROJECT_STRUCTURE.md)
- React Leaflet Documentation: https://react-leaflet.js.org/
- Leaflet API Reference: https://leafletjs.com/reference.html

