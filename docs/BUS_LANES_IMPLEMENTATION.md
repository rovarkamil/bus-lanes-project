# Bus Lanes Interactive Map Implementation Guide

This document outlines the step-by-step process for implementing the bus lanes interactive map feature using Leaflet.

## 📋 Overview

The bus lanes mapping system allows administrators to:

- Create and manage transport services (bus, minibus, taxi, etc.)
- Draw bus lanes on an interactive map
- Add bus stops with location, images, and descriptions
- Create routes that connect stops and lanes
- Display all information on a client-facing interactive map

## 🗄️ Database Models

### Models Created

1. **TransportService** - Types of transport (BUS, MINIBUS, TAXI, etc.) with capacity and operating hours
2. **BusStop** - Bus stop locations with coordinates, images, descriptions, amenities, and accessibility features
3. **BusLane** - Bus lane paths drawn on the map with coordinates
4. **BusRoute** - Routes connecting multiple stops and lanes with fare, frequency, and direction
5. **MapIcon** - Custom icons for map markers (uses File model for icon storage)
6. **Zone** - Geographic zones for organizing stops by area
7. **BusSchedule** - Timetable information for routes and stops

### Model Relationships

- `TransportService` → `BusRoute[]` (one-to-many)
- `TransportService` → `BusLane[]` (one-to-many)
- `TransportService` → `MapIcon` (many-to-one, optional)
- `BusStop` ↔ `BusLane[]` (many-to-many)
- `BusStop` ↔ `BusRoute[]` (many-to-many)
- `BusStop` → `MapIcon` (many-to-one, optional)
- `BusStop` → `Zone` (many-to-one, optional)
- `BusStop` → `BusSchedule[]` (one-to-many)
- `BusLane` ↔ `BusRoute[]` (many-to-many)
- `BusRoute` → `BusSchedule[]` (one-to-many)
- `BusStop` → `File[]` (many-to-many for images)
- `BusLane` → `File[]` (many-to-many for images)
- `MapIcon` → `File` (one-to-one, required)
- All models use `Language` for multilingual names and descriptions

## 🚀 Implementation Steps

### Step 1: Generate Prisma Client

After creating the schema models, generate the Prisma client:

```bash
npx prisma generate
npx prisma migrate dev --name add_bus_lanes_models
```

### Step 2: Create Type Definitions

Create type definition files following the project pattern:

#### 2.1 Transport Service Types

- File: `types/models/transport-service.ts`
- Define Zod schemas for validation
- Include form field configurations
- Define filter and search parameters

#### 2.2 Bus Stop Types

- File: `types/models/bus-stop.ts`
- Include latitude/longitude validation
- Image upload handling
- Language field configurations

#### 2.3 Bus Lane Types

- File: `types/models/bus-lane.ts`
- Path coordinate validation (JSON array of [lat, lng] pairs)
- Color, weight, opacity configurations
- Leaflet polyline format handling

#### 2.4 Bus Route Types

- File: `types/models/bus-route.ts`
- Route validation with stops and lanes
- Service type associations

#### 2.5 Map Icon Types

- File: `types/models/map-icon.ts`
- Icon file validation
- Icon size and anchor point configurations
- Leaflet icon configuration format

#### 2.6 Zone Types

- File: `types/models/zone.ts`
- Zone validation and color configuration

#### 2.7 Bus Schedule Types

- File: `types/models/bus-schedule.ts`
- Time validation (24-hour format)
- Day of week and date handling
- Schedule conflict detection

### Step 3: Create Custom Hooks

Create React Query hooks for data fetching and mutations:

#### 3.1 Transport Service Hook

- File: `hooks/employee-hooks/use-transport-service.ts`
- CRUD operations for transport services

#### 3.2 Bus Stop Hook

- File: `hooks/employee-hooks/use-bus-stop.ts`
- CRUD operations with location handling

#### 3.3 Bus Lane Hook

- File: `hooks/employee-hooks/use-bus-lane.ts`
- CRUD operations with path coordinate handling

#### 3.4 Bus Route Hook

- File: `hooks/employee-hooks/use-bus-route.ts`
- CRUD operations with route management

#### 3.5 Map Icon Hook

- File: `hooks/employee-hooks/use-map-icon.ts`
- CRUD operations with icon file handling
- Icon preview functionality

#### 3.6 Zone Hook

- File: `hooks/employee-hooks/use-zone.ts`
- CRUD operations for zone management

#### 3.7 Bus Schedule Hook

- File: `hooks/employee-hooks/use-bus-schedule.ts`
- CRUD operations with schedule management
- Time-based queries and filtering

### Step 4: Create API Routes

Create API routes using `createEmployeeModelRoutes`:

#### 4.1 Transport Service API

- File: `app/api/employee/transport-service/route.ts`
- Configure permissions (VIEW/CREATE/UPDATE/DELETE transport services)
- Handle service type validation

#### 4.2 Bus Stop API

- File: `app/api/employee/bus-stop/route.ts`
- Handle coordinate validation
- Image upload integration

#### 4.3 Bus Lane API

- File: `app/api/employee/bus-lane/route.ts`
- Validate path coordinates format
- Handle polyline data

#### 4.4 Bus Route API

- File: `app/api/employee/bus-route/route.ts`
- Manage route associations with stops and lanes

#### 4.5 Map Icon API

- File: `app/api/employee/map-icon/route.ts`
- Handle icon file uploads
- Validate icon file types (PNG, SVG, etc.)
- Icon size and anchor point validation

#### 4.6 Zone API

- File: `app/api/employee/zone/route.ts`
- Handle zone management
- Validate zone color and associations

#### 4.7 Bus Schedule API

- File: `app/api/employee/bus-schedule/route.ts`
- Handle schedule creation and updates
- Validate time format and day of week
- Handle special date overrides

### Step 5: Create Table Columns

Create table column definitions for admin dashboard:

#### 5.1 Transport Service Columns

- File: `components/columns/transport-service-table-columns.tsx`
- Display service type, name, color, status

#### 5.2 Bus Stop Columns

- File: `components/columns/bus-stop-table-columns.tsx`
- Display location, name, associated lanes/routes

#### 5.3 Bus Lane Columns

- File: `components/columns/bus-lane-table-columns.tsx`
- Display name, color, path preview, service type

#### 5.4 Bus Route Columns

- File: `components/columns/bus-route-table-columns.tsx`
- Display route name, service, stops count, lanes count

#### 5.5 Map Icon Columns

- File: `components/columns/map-icon-table-columns.tsx`
- Display icon preview, name, size, usage count

#### 5.6 Zone Columns

- File: `components/columns/zone-table-columns.tsx`
- Display zone name, color, stops count

#### 5.7 Bus Schedule Columns

- File: `components/columns/bus-schedule-table-columns.tsx`
- Display route, stop, time, day of week

### Step 6: Create Dialog Components

Create dialog components for CRUD operations:

#### 6.1 Transport Service Dialogs

- `components/dialogs/transport-service/create-transport-service-dialog.tsx`
- `components/dialogs/transport-service/update-transport-service-dialog.tsx`
- `components/dialogs/transport-service/view-transport-service-dialog.tsx`
- `components/dialogs/transport-service/filter-transport-service-dialog.tsx`

#### 6.2 Bus Stop Dialogs

- `components/dialogs/bus-stop/create-bus-stop-dialog.tsx`
- `components/dialogs/bus-stop/update-bus-stop-dialog.tsx`
- `components/dialogs/bus-stop/view-bus-stop-dialog.tsx`
- `components/dialogs/bus-stop/filter-bus-stop-dialog.tsx`
- Include map picker for location selection

#### 6.3 Bus Lane Dialogs

- `components/dialogs/bus-lane/create-bus-lane-dialog.tsx`
- `components/dialogs/bus-lane/update-bus-lane-dialog.tsx`
- `components/dialogs/bus-lane/view-bus-lane-dialog.tsx`
- `components/dialogs/bus-lane/filter-bus-lane-dialog.tsx`
- Include Leaflet map for drawing lanes

#### 6.4 Bus Route Dialogs

- `components/dialogs/bus-route/create-bus-route-dialog.tsx`
- `components/dialogs/bus-route/update-bus-route-dialog.tsx`
- `components/dialogs/bus-route/view-bus-route-dialog.tsx`
- `components/dialogs/bus-route/filter-bus-route-dialog.tsx`
- Include stop and lane selection

#### 6.5 Map Icon Dialogs

- `components/dialogs/map-icon/create-map-icon-dialog.tsx`
- `components/dialogs/map-icon/update-map-icon-dialog.tsx`
- `components/dialogs/map-icon/view-map-icon-dialog.tsx`
- `components/dialogs/map-icon/filter-map-icon-dialog.tsx`
- Include icon file upload, preview, and anchor point configuration

#### 6.6 Zone Dialogs

- `components/dialogs/zone/create-zone-dialog.tsx`
- `components/dialogs/zone/update-zone-dialog.tsx`
- `components/dialogs/zone/view-zone-dialog.tsx`
- `components/dialogs/zone/filter-zone-dialog.tsx`
- Include color picker and zone visualization

#### 6.7 Bus Schedule Dialogs

- `components/dialogs/bus-schedule/create-bus-schedule-dialog.tsx`
- `components/dialogs/bus-schedule/update-bus-schedule-dialog.tsx`
- `components/dialogs/bus-schedule/view-bus-schedule-dialog.tsx`
- `components/dialogs/bus-schedule/filter-bus-schedule-dialog.tsx`
- Include time picker, day selector, route/stop selection

### Step 7: Create Admin Dashboard Pages

Create admin pages for managing each entity:

#### 7.1 Transport Service Page

- File: `app/dashboard/transport-service/page.tsx`
- Table view with CRUD operations

#### 7.2 Bus Stop Page

- File: `app/dashboard/bus-stop/page.tsx`
- Table view with map preview

#### 7.3 Bus Lane Page

- File: `app/dashboard/bus-lane/page.tsx`
- Table view with lane management

#### 7.4 Bus Route Page

- File: `app/dashboard/bus-route/page.tsx`
- Table view with route management

#### 7.5 Map Icon Page

- File: `app/dashboard/map-icon/page.tsx`
- Table view with icon management
- Icon preview gallery

#### 7.6 Zone Page

- File: `app/dashboard/zone/page.tsx`
- Table view with zone management
- Zone visualization on map

#### 7.7 Bus Schedule Page

- File: `app/dashboard/bus-schedule/page.tsx`
- Table view with schedule management
- Calendar/timeline view option

### Step 8: Create Interactive Map Component (Client-Side)

#### 8.1 Map API Route

- File: `app/api/map/route.ts` (public endpoint)
- Fetch all active bus stops, lanes, and routes
- Return data optimized for Leaflet

#### 8.2 Map Component

- File: `components/map/interactive-bus-map.tsx`
- Use Leaflet for map rendering
- Display:
  - Bus stops as markers (with custom icons if available)
  - Bus lanes as polylines
  - Routes with different colors per service
- Click handlers for stops to show info popup
- Use custom MapIcon for markers when available, fallback to default

#### 8.3 Map Info Popup Component

- File: `components/map/bus-stop-popup.tsx`
- Display:
  - Stop name (multilingual)
  - Description (multilingual)
  - Images gallery
  - Associated lanes and routes

#### 8.4 Client Map Page

- File: `app/map/page.tsx` (public route)
- Full-screen interactive map
- Filter by transport service type
- Search functionality

### Step 9: Create Admin Map Editor

#### 9.1 Map Editor Component

- File: `components/map/bus-lane-editor.tsx`
- Leaflet map with drawing tools
- Features:
  - Draw polyline for bus lanes
  - Add markers for bus stops
  - Edit existing lanes and stops
  - Delete lanes and stops
  - Color picker for lanes
  - Service type selector

#### 9.2 Map Editor Page

- File: `app/dashboard/map-editor/page.tsx`
- Full editor interface
- Save changes to database
- Real-time preview

### Step 10: Add Permissions

Add new permissions to the `Permission` enum in `schema.prisma`:

```prisma
enum Permission {
  // ... existing permissions ...

  VIEW_TRANSPORT_SERVICES
  CREATE_TRANSPORT_SERVICE
  UPDATE_TRANSPORT_SERVICE
  DELETE_TRANSPORT_SERVICE

  VIEW_BUS_STOPS
  CREATE_BUS_STOP
  UPDATE_BUS_STOP
  DELETE_BUS_STOP

  VIEW_BUS_LANES
  CREATE_BUS_LANE
  UPDATE_BUS_LANE
  DELETE_BUS_LANE

  VIEW_BUS_ROUTES
  CREATE_BUS_ROUTE
  UPDATE_BUS_ROUTE
  DELETE_BUS_ROUTE

  VIEW_MAP_ICONS
  CREATE_MAP_ICON
  UPDATE_MAP_ICON
  DELETE_MAP_ICON

  VIEW_MAP_EDITOR
  EDIT_MAP
}
```

### Step 11: Install Dependencies

Install required packages for Leaflet:

```bash
npm install leaflet react-leaflet @types/leaflet
npm install leaflet-draw @types/leaflet-draw
```

Add Leaflet CSS to your layout or global CSS:

```css
@import "leaflet/dist/leaflet.css";
@import "leaflet-draw/dist/leaflet.draw.css";
```

### Step 12: Testing

1. **Unit Tests**: Test each hook and API route
2. **Integration Tests**: Test map rendering and interactions
3. **E2E Tests**: Test complete workflows (create stop → create lane → create route → view on map)

## 🗺️ Leaflet Implementation Details

### Map Configuration

- Default center: Your city coordinates
- Default zoom: 13
- Tile provider: OpenStreetMap (or your preferred provider)

### Data Format

**Map Icon Format:**

```typescript
{
  id: string,
  name: { en: string, ar?: string, ckb?: string },
  description: { en: string, ar?: string, ckb?: string },
  file: {
    url: string,
    type: string,
    name: string,
    size: number
  },
  iconSize: number,      // Default: 32
  iconAnchorX: number,   // Default: 16
  iconAnchorY: number,   // Default: 32
  popupAnchorX: number,  // Default: 0
  popupAnchorY: number,  // Default: -32
  isActive: boolean
}
```

**Bus Lane Path Format:**

```typescript
// Stored in database as JSON
path: [[latitude, longitude], [latitude, longitude], ...]

// Example:
path: [
  [36.1911, 44.0092],
  [36.1920, 44.0100],
  [36.1930, 44.0110]
]
```

**Bus Stop Format:**

```typescript
{
  id: string,
  latitude: number,
  longitude: number,
  name: { en: string, ar?: string, ckb?: string },
  description: { en: string, ar?: string, ckb?: string },
  images: File[],
  lanes: BusLane[],
  routes: BusRoute[],
  icon?: MapIcon,
  zone?: Zone,
  hasShelter: boolean,
  hasBench: boolean,
  hasLighting: boolean,
  isAccessible: boolean,
  hasRealTimeInfo: boolean,
  order?: number
}
```

**Zone Format:**

```typescript
{
  id: string,
  name: { en: string, ar?: string, ckb?: string },
  description: { en: string, ar?: string, ckb?: string },
  color: string,
  isActive: boolean,
  stops: BusStop[]
}
```

**Bus Schedule Format:**

```typescript
{
  id: string,
  route: BusRoute,
  stop: BusStop,
  departureTime: string, // "08:30" format
  dayOfWeek: DayOfWeek,
  specificDate?: DateTime, // For holidays/special dates
  notes?: string,
  isActive: boolean
}
```

**Transport Service Enhanced:**

```typescript
{
  // ... existing fields ...
  capacity?: number,
  operatingFrom?: string, // "06:00"
  operatingTo?: string     // "22:00"
}
```

**Bus Route Enhanced:**

```typescript
{
  // ... existing fields ...
  routeNumber?: string,
  direction: RouteDirection,
  fare?: number,
  currency: Currency,
  frequency?: number, // minutes
  duration?: number  // minutes
}
```

### Leaflet Components Structure

```typescript
<MapContainer>
  <TileLayer />
  {busStops.map(stop => {
    const icon = stop.icon
      ? L.icon({
          iconUrl: stop.icon.file.url,
          iconSize: [stop.icon.iconSize, stop.icon.iconSize],
          iconAnchor: [stop.icon.iconAnchorX, stop.icon.iconAnchorY],
          popupAnchor: [stop.icon.popupAnchorX, stop.icon.popupAnchorY]
        })
      : undefined;

    return (
      <Marker
        key={stop.id}
        position={[stop.latitude, stop.longitude]}
        icon={icon}
      >
        <Popup>
          <BusStopPopup stop={stop} />
        </Popup>
      </Marker>
    );
  })}
  {busLanes.map(lane => (
    <Polyline
      key={lane.id}
      positions={lane.path}
      color={lane.color}
      weight={lane.weight}
      opacity={lane.opacity}
    />
  ))}
</MapContainer>
```

## 📝 Notes

- All text fields support multilingual content (English, Arabic, Kurdish)
- Images are stored using the existing File model
- Icons are stored using the File model via MapIcon
- MapIcon includes anchor points for proper marker positioning in Leaflet
- Custom icons can be assigned to TransportService and BusStop
- Zones allow organizing stops by geographic areas with color coding
- BusSchedule supports both regular weekly schedules and special date overrides
- BusStop includes accessibility and amenity flags (shelter, bench, lighting, wheelchair access)
- TransportService includes capacity and operating hours
- BusRoute includes fare information, frequency, duration, and direction
- Route directions: OUTBOUND, INBOUND, CIRCULAR, BIDIRECTIONAL
- Soft delete is implemented for all models
- Indexes are added for performance (coordinates, dates, service types, icon references, schedules)
- Map data is cached for better performance
- Consider implementing real-time updates using WebSockets for collaborative editing
- Icon file formats: PNG (recommended), SVG, or other image formats supported by Leaflet
- Schedule times are stored in 24-hour format (e.g., "08:30", "14:45")

## 🔄 Next Steps

1. Run Prisma migration
2. Generate Prisma client
3. Start with MapIcon implementation (needed for other models)
4. Implement Zone (simple model, useful for organization)
5. Implement TransportService (can use MapIcon)
6. Implement BusStop (requires map integration, can use MapIcon and Zone)
7. Implement BusLane (requires drawing tools)
8. Implement BusRoute (connects everything, includes fare and schedule info)
9. Implement BusSchedule (timetable management)
10. Build client-facing map (with custom icons, zones, schedules)
11. Build admin map editor
12. Add permissions and role management (already defined in schema)
13. Testing and optimization
