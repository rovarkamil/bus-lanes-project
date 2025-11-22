# Map Editor Architecture & Implementation Plan

## Overview

This document outlines the complete architecture and implementation plan for creating a dedicated map editor system separate from the main dashboard. The new map editor will have its own API routes, components, hooks, and types to provide a focused editing experience.

## Goals

1. **Separation of Concerns**: Create a dedicated map editor page with its own infrastructure
2. **Bulk Operations**: Support creating/updating multiple lanes at once from map interactions
3. **Visual Editing**: Enable drawing lanes directly on the map with immediate visual feedback
4. **Dedicated Components**: Build map editor-specific components separate from dashboard components
5. **Type Safety**: Ensure all types support the new map editor workflows

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Map Editor Page                           │
│              /dashboard/map-editor                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Map Editor Components                        │  │
│  │  (Separate from dashboard components)                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Map Editor Hooks                             │  │
│  │  (useCreateBusLanesMapEditor, etc.)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Map Editor API Routes                        │  │
│  │  /api/employee/bus-lane/map-editor                   │  │
│  │  /api/employee/bus-route/map-editor                  │  │
│  │  /api/employee/bus-stop/map-editor                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Update Types for Map Editor

**Files to Update:**

- `types/models/bus-lane.ts`
- `types/models/bus-route.ts`
- `types/models/bus-stop.ts`
- `types/map.ts` (if needed)

**Changes Needed:**

1. **Add Map Editor Specific Types:**

```typescript
// types/models/bus-lane.ts

// Add to existing file
export interface MapEditorLaneDraft {
  path: CoordinateTuple[];
  color?: string;
  weight?: number;
  opacity?: number;
  name?: {
    en: string;
    ar?: string | null;
    ckb?: string | null;
  };
  description?: {
    en?: string | null;
    ar?: string | null;
    ckb?: string | null;
  };
  serviceId?: string | null;
  routeIds?: string[];
  draftStops?: Array<{
    latitude: number;
    longitude: number;
    name?: string;
  }>;
  isActive?: boolean;
}

export interface CreateBusLanesMapEditorData {
  lanes: MapEditorLaneDraft[];
}

export interface UpdateBusLanesMapEditorData {
  lanes: Array<{
    id: string;
    path?: CoordinateTuple[];
    color?: string;
    weight?: number;
    opacity?: number;
    nameFields?: {
      en: string;
      ar?: string | null;
      ckb?: string | null;
    };
    descriptionFields?: {
      en?: string | null;
      ar?: string | null;
      ckb?: string | null;
    };
    serviceId?: string | null;
    routeIds?: string[];
    isActive?: boolean;
  }>;
}

// Zod schemas
export const mapEditorLaneDraftSchema = z.object({
  path: z.array(z.tuple([z.number(), z.number()])).min(2),
  color: z.string().optional(),
  weight: z.number().int().min(1).max(20).optional(),
  opacity: z.number().min(0.1).max(1).optional(),
  name: z
    .object({
      en: z.string().min(1),
      ar: z.string().nullable().optional(),
      ckb: z.string().nullable().optional(),
    })
    .optional(),
  description: z
    .object({
      en: z.string().nullable().optional(),
      ar: z.string().nullable().optional(),
      ckb: z.string().nullable().optional(),
    })
    .optional(),
  serviceId: z.string().uuid().nullable().optional(),
  routeIds: z.array(z.string().uuid()).optional(),
  draftStops: z
    .array(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        name: z.string().optional(),
      })
    )
    .optional(),
  isActive: z.boolean().optional(),
});

export const createBusLanesMapEditorSchema = z.object({
  lanes: z.array(mapEditorLaneDraftSchema).min(1),
});

export const updateBusLanesMapEditorSchema = z.object({
  lanes: z
    .array(
      z.object({
        id: z.string().uuid(),
        path: z
          .array(z.tuple([z.number(), z.number()]))
          .min(2)
          .optional(),
        color: z.string().optional(),
        weight: z.number().int().min(1).max(20).optional(),
        opacity: z.number().min(0.1).max(1).optional(),
        nameFields: z
          .object({
            en: z.string().min(1),
            ar: z.string().nullable().optional(),
            ckb: z.string().nullable().optional(),
          })
          .optional(),
        descriptionFields: z
          .object({
            en: z.string().nullable().optional(),
            ar: z.string().nullable().optional(),
            ckb: z.string().nullable().optional(),
          })
          .optional(),
        serviceId: z.string().uuid().nullable().optional(),
        routeIds: z.array(z.string().uuid()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .min(1),
});
```

2. **Similar patterns for bus-route and bus-stop types**

### Step 2: Create Optimized Helper Functions for Bulk Operations

**File to Create/Update:**

- `lib/helpers/bus-lane-helpers.ts` (add new functions)

**New Helper Functions:**

```typescript
// lib/helpers/bus-lane-helpers.ts

// Add to existing file

/**
 * Create multiple bus lanes efficiently using createMany
 * Optimized for bulk operations from map editor
 */
export async function createBusLanesBulkWithBusinessLogic({
  lanes,
  tx,
  uploadedById,
}: {
  lanes: Array<{
    nameFields: {
      en: string;
      ar?: string | null;
      ckb?: string | null;
    };
    descriptionFields?: {
      en?: string | null;
      ar?: string | null;
      ckb?: string | null;
    };
    color?: string;
    weight?: number;
    opacity?: number;
    serviceId?: string | null;
    path: CoordinateTuple[];
    draftStops?: Array<{
      latitude: number;
      longitude: number;
      name?: string;
    }>;
    routeIds?: string[];
    isActive?: boolean;
  }>;
  tx: PrismaTransaction;
  uploadedById?: string | null;
}) {
  // Step 1: Create all language records in parallel
  const languagePromises = lanes.map(async (lane) => {
    const nameLang = await tx.language.create({
      data: {
        en: lane.nameFields.en,
        ar: lane.nameFields.ar ?? null,
        ckb: lane.nameFields.ckb ?? null,
      },
    });

    let descriptionId: string | null = null;
    if (lane.descriptionFields) {
      const descLang = await tx.language.create({
        data: {
          en: lane.descriptionFields.en ?? "",
          ar: lane.descriptionFields.ar ?? null,
          ckb: lane.descriptionFields.ckb ?? null,
        },
      });
      descriptionId = descLang.id;
    }

    return { nameId: nameLang.id, descriptionId };
  });

  const languageRecords = await Promise.all(languagePromises);

  // Step 2: Create all lanes using createMany (optimized)
  const lanesToCreate = lanes.map((lane, index) => ({
    nameId: languageRecords[index].nameId,
    descriptionId: languageRecords[index].descriptionId,
    color: lane.color ?? "#0066CC",
    weight: lane.weight ?? 5,
    opacity: lane.opacity ?? 0.8,
    serviceId: lane.serviceId ?? null,
    path: lane.path as unknown as Prisma.JsonValue,
    isActive: lane.isActive ?? true,
  }));

  await tx.busLane.createMany({
    data: lanesToCreate,
  });

  // Step 3: Fetch created lanes (createMany doesn't return records)
  const createdLanes = await tx.busLane.findMany({
    where: {
      nameId: { in: languageRecords.map((r) => r.nameId) },
    },
    include: {
      name: true,
      description: true,
      service: { include: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: lanes.length,
  });

  // Step 4: Handle relationships in parallel
  const relationshipPromises = createdLanes.map(async (lane, index) => {
    const laneData = lanes[index];

    // Connect routes if provided
    if (laneData.routeIds && laneData.routeIds.length > 0) {
      await tx.busLane.update({
        where: { id: lane.id },
        data: {
          routes: {
            connect: laneData.routeIds.map((routeId) => ({ id: routeId })),
          },
        },
      });
    }

    // Handle draft stops
    if (laneData.draftStops && laneData.draftStops.length > 0) {
      // Create stop language records
      const stopNameLangs = await Promise.all(
        laneData.draftStops.map((stop) =>
          tx.language.create({
            data: {
              en: stop.name ?? `Stop ${Date.now()}-${Math.random()}`,
              ar: null,
              ckb: null,
            },
          })
        )
      );

      // Create stops using createMany
      const stopsToCreate = laneData.draftStops.map((stop, idx) => ({
        latitude: stop.latitude,
        longitude: stop.longitude,
        nameId: stopNameLangs[idx].id,
        descriptionId: null,
        hasShelter: false,
        hasBench: false,
        hasLighting: false,
        isAccessible: false,
        hasRealTimeInfo: false,
      }));

      await tx.busStop.createMany({
        data: stopsToCreate,
      });

      // Fetch created stops
      const createdStops = await tx.busStop.findMany({
        where: {
          nameId: { in: stopNameLangs.map((lang) => lang.id) },
        },
        orderBy: { createdAt: "desc" },
        take: laneData.draftStops.length,
      });

      // Connect stops to lane
      await tx.busLane.update({
        where: { id: lane.id },
        data: {
          stops: {
            connect: createdStops.map((stop) => ({ id: stop.id })),
          },
        },
      });
    }
  });

  await Promise.all(relationshipPromises);

  return createdLanes;
}

/**
 * Update multiple bus lanes efficiently using updateMany where possible
 * Optimized for bulk operations from map editor
 */
export async function updateBusLanesBulkWithBusinessLogic({
  lanes,
  tx,
  uploadedById,
}: {
  lanes: Array<{
    id: string;
    path?: CoordinateTuple[];
    color?: string;
    weight?: number;
    opacity?: number;
    nameFields?: {
      en: string;
      ar?: string | null;
      ckb?: string | null;
    };
    descriptionFields?: {
      en?: string | null;
      ar?: string | null;
      ckb?: string | null;
    };
    serviceId?: string | null;
    routeIds?: string[];
    isActive?: boolean;
  }>;
  tx: PrismaTransaction;
  uploadedById?: string | null;
}) {
  const laneIds = lanes.map((l) => l.id);

  // Step 1: Fetch existing lanes with relations
  const existingLanes = await tx.busLane.findMany({
    where: { id: { in: laneIds } },
    include: {
      name: true,
      description: true,
      routes: { select: { id: true } },
    },
  });

  // Step 2: Update language records in parallel
  const languageUpdates = existingLanes.map(async (existingLane) => {
    const laneData = lanes.find((l) => l.id === existingLane.id);
    if (!laneData) return;

    if (laneData.nameFields && existingLane.nameId) {
      await tx.language.update({
        where: { id: existingLane.nameId },
        data: {
          en: laneData.nameFields.en,
          ar: laneData.nameFields.ar ?? null,
          ckb: laneData.nameFields.ckb ?? null,
        },
      });
    }

    if (laneData.descriptionFields) {
      if (existingLane.descriptionId) {
        await tx.language.update({
          where: { id: existingLane.descriptionId },
          data: {
            en: laneData.descriptionFields.en ?? "",
            ar: laneData.descriptionFields.ar ?? null,
            ckb: laneData.descriptionFields.ckb ?? null,
          },
        });
      } else if (laneData.descriptionFields.en) {
        const descLang = await tx.language.create({
          data: {
            en: laneData.descriptionFields.en,
            ar: laneData.descriptionFields.ar ?? null,
            ckb: laneData.descriptionFields.ckb ?? null,
          },
        });
        await tx.busLane.update({
          where: { id: existingLane.id },
          data: { descriptionId: descLang.id },
        });
      }
    }
  });

  await Promise.all(languageUpdates);

  // Step 3: Group lanes by update values for bulk updateMany operations
  const updateGroups = new Map<
    string,
    { laneIds: string[]; data: Prisma.BusLaneUpdateInput }
  >();

  lanes.forEach((laneData) => {
    // Create a key for grouping lanes with same update values
    const updateKey = JSON.stringify({
      color: laneData.color,
      weight: laneData.weight,
      opacity: laneData.opacity,
      serviceId: laneData.serviceId,
      isActive: laneData.isActive,
    });

    if (!updateGroups.has(updateKey)) {
      updateGroups.set(updateKey, {
        laneIds: [],
        data: {
          ...(laneData.color !== undefined && { color: laneData.color }),
          ...(laneData.weight !== undefined && { weight: laneData.weight }),
          ...(laneData.opacity !== undefined && { opacity: laneData.opacity }),
          ...(laneData.serviceId !== undefined && {
            serviceId: laneData.serviceId,
          }),
          ...(laneData.isActive !== undefined && {
            isActive: laneData.isActive,
          }),
        },
      });
    }

    updateGroups.get(updateKey)!.laneIds.push(laneData.id);
  });

  // Step 4: Execute bulk updates
  const bulkUpdates = Array.from(updateGroups.values()).map(async (group) => {
    if (group.laneIds.length > 1) {
      // Use updateMany for multiple lanes with same values
      await tx.busLane.updateMany({
        where: { id: { in: group.laneIds } },
        data: group.data as Prisma.BusLaneUpdateInput,
      });
    } else {
      // Single update
      await tx.busLane.update({
        where: { id: group.laneIds[0] },
        data: group.data,
      });
    }
  });

  await Promise.all(bulkUpdates);

  // Step 5: Update paths individually (since they're unique JSON per lane)
  const pathUpdates = lanes
    .filter((l) => l.path)
    .map((laneData) =>
      tx.busLane.update({
        where: { id: laneData.id },
        data: {
          path: laneData.path as unknown as Prisma.JsonValue,
        },
      })
    );

  await Promise.all(pathUpdates);

  // Step 6: Handle route connections (many-to-many)
  const routeUpdates = existingLanes.map(async (existingLane) => {
    const laneData = lanes.find((l) => l.id === existingLane.id);
    if (!laneData || laneData.routeIds === undefined) return;

    const currentRouteIds = existingLane.routes.map((r) => r.id);
    const newRouteIds = laneData.routeIds;

    const routesToRemove = currentRouteIds.filter(
      (id) => !newRouteIds.includes(id)
    );
    const routesToAdd = newRouteIds.filter(
      (id) => !currentRouteIds.includes(id)
    );

    if (routesToRemove.length > 0 || routesToAdd.length > 0) {
      await tx.busLane.update({
        where: { id: existingLane.id },
        data: {
          routes: {
            ...(routesToRemove.length > 0 && {
              disconnect: routesToRemove.map((id) => ({ id })),
            }),
            ...(routesToAdd.length > 0 && {
              connect: routesToAdd.map((id) => ({ id })),
            }),
          },
        },
      });
    }
  });

  await Promise.all(routeUpdates);

  // Step 7: Fetch updated lanes with all relations
  const updatedLanes = await tx.busLane.findMany({
    where: { id: { in: laneIds } },
    include: {
      name: true,
      description: true,
      service: { include: { name: true } },
      routes: { select: { id: true } },
    },
  });

  return updatedLanes;
}
```

### Step 3: Create Map Editor API Routes

**Files to Create:**

- `app/api/employee/bus-lane/map-editor/route.ts`
- `app/api/employee/bus-route/map-editor/route.ts`
- `app/api/employee/bus-stop/map-editor/route.ts`

**Implementation Pattern:**

```typescript
// app/api/employee/bus-lane/map-editor/route.ts
"use server";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Permission } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createBusLanesMapEditorSchema,
  updateBusLanesMapEditorSchema,
  CreateBusLanesMapEditorData,
  UpdateBusLanesMapEditorData,
} from "@/types/models/bus-lane";
import {
  createBusLanesBulkWithBusinessLogic,
  updateBusLanesBulkWithBusinessLogic,
} from "@/lib/helpers/bus-lane-helpers";
import { hasPermission } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!hasPermission(session, Permission.CREATE_BUS_LANE)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createBusLanesMapEditorSchema.parse(body);

    const results = await prisma.$transaction(async (tx) => {
      // Use optimized bulk creation helper
      return await createBusLanesBulkWithBusinessLogic({
        lanes: validatedData.lanes.map((lane) => ({
          nameFields: lane.name || {
            en: `Lane ${Date.now()}-${Math.random()}`,
            ar: null,
            ckb: null,
          },
          descriptionFields: lane.description,
          color: lane.color,
          weight: lane.weight,
          opacity: lane.opacity,
          serviceId: lane.serviceId,
          path: lane.path,
          draftStops: lane.draftStops,
          routeIds: lane.routeIds,
          isActive: lane.isActive,
        })),
        tx,
        uploadedById: session.user.id,
      });
    });
      // Step 1: Create all language records first (bulk)
      const languageRecords = [];
      for (const laneData of validatedData.lanes) {
        const nameFields = laneData.name || {
          en: `Lane ${Date.now()}-${Math.random()}`,
          ar: null,
          ckb: null,
        };
        const descriptionFields = laneData.description;

        // Create name language record
        const nameLang = await tx.language.create({
          data: {
            en: nameFields.en,
            ar: nameFields.ar,
            ckb: nameFields.ckb,
          },
        });
        languageRecords.push({ nameId: nameLang.id, descriptionId: null });

        // Create description language record if provided
        if (descriptionFields) {
          const descLang = await tx.language.create({
            data: {
              en: descriptionFields.en || "",
              ar: descriptionFields.ar,
              ckb: descriptionFields.ckb,
            },
          });
          languageRecords[languageRecords.length - 1].descriptionId = descLang.id;
        }
      }

      // Step 2: Create all bus lanes using createMany (optimized)
      const lanesToCreate = validatedData.lanes.map((laneData, index) => ({
        nameId: languageRecords[index].nameId,
        descriptionId: languageRecords[index].descriptionId,
        color: laneData.color || "#0066CC",
        weight: laneData.weight || 5,
        opacity: laneData.opacity || 0.8,
        serviceId: laneData.serviceId || null,
        path: laneData.path as unknown as Prisma.JsonValue,
        isActive: laneData.isActive ?? true,
      }));

      // Note: createMany doesn't return created records, so we need to fetch them
      await tx.busLane.createMany({
        data: lanesToCreate,
      });

      // Step 3: Fetch created lanes with their IDs
      const createdLanes = await tx.busLane.findMany({
        where: {
          nameId: { in: languageRecords.map((r) => r.nameId) },
        },
        include: {
          name: true,
          description: true,
          service: { include: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: validatedData.lanes.length,
      });

      // Step 4: Handle relationships (routes, stops) for each lane
      for (let i = 0; i < createdLanes.length; i++) {
        const lane = createdLanes[i];
        const laneData = validatedData.lanes[i];

        // Connect routes if provided
        if (laneData.routeIds && laneData.routeIds.length > 0) {
          await tx.busRoute.updateMany({
            where: { id: { in: laneData.routeIds } },
            data: {}, // No data update, just for where clause
          });
          // Connect lanes to routes (many-to-many)
          await Promise.all(
            laneData.routeIds.map((routeId) =>
              tx.busRoute.update({
                where: { id: routeId },
                data: {
                  lanes: {
                    connect: { id: lane.id },
                  },
                },
              })
            )
          );
        }

        // Handle draft stops (create bus stops and connect)
        if (laneData.draftStops && laneData.draftStops.length > 0) {
          // Create language records for stops
          const stopNameLangs = await Promise.all(
            laneData.draftStops.map((stop) =>
              tx.language.create({
                data: {
                  en: stop.name || `Stop ${Date.now()}`,
                  ar: null,
                  ckb: null,
                },
              })
            )
          );

          // Create stops using createMany
          const stopsToCreate = laneData.draftStops.map((stop, idx) => ({
            latitude: stop.latitude,
            longitude: stop.longitude,
            nameId: stopNameLangs[idx].id,
            descriptionId: null,
            hasShelter: false,
            hasBench: false,
            hasLighting: false,
            isAccessible: false,
            hasRealTimeInfo: false,
          }));

          await tx.busStop.createMany({
            data: stopsToCreate,
          });

          // Fetch created stops and connect to lane
          const createdStops = await tx.busStop.findMany({
            where: {
              nameId: { in: stopNameLangs.map((lang) => lang.id) },
            },
            orderBy: { createdAt: "desc" },
            take: laneData.draftStops.length,
          });

          // Connect stops to lane
          await tx.busLane.update({
            where: { id: lane.id },
            data: {
              stops: {
                connect: createdStops.map((stop) => ({ id: stop.id })),
              },
            },
          });
        }
      }

      return createdLanes;
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Map editor create lanes error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create lanes",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!hasPermission(session, Permission.UPDATE_BUS_LANE)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateBusLanesMapEditorSchema.parse(body);

    const results = await prisma.$transaction(async (tx) => {
      // Use optimized bulk update helper
      return await updateBusLanesBulkWithBusinessLogic({
        lanes: validatedData.lanes.map((lane) => ({
          id: lane.id,
          path: lane.path,
          color: lane.color,
          weight: lane.weight,
          opacity: lane.opacity,
          nameFields: lane.nameFields,
          descriptionFields: lane.descriptionFields,
          serviceId: lane.serviceId,
          routeIds: lane.routeIds,
          isActive: lane.isActive,
        })),
        tx,
        uploadedById: session.user.id,
      });
    });
      // Step 1: Update language records in bulk where needed
      const laneIds = validatedData.lanes.map((l) => l.id);
      const existingLanes = await tx.busLane.findMany({
        where: { id: { in: laneIds } },
        include: { name: true, description: true },
      });

      // Update language records for lanes that have name/description changes
      const languageUpdates = [];
      for (let i = 0; i < validatedData.lanes.length; i++) {
        const laneData = validatedData.lanes[i];
        const existingLane = existingLanes.find((l) => l.id === laneData.id);
        if (!existingLane) continue;

        if (laneData.nameFields && existingLane.nameId) {
          languageUpdates.push(
            tx.language.update({
              where: { id: existingLane.nameId },
              data: {
                en: laneData.nameFields.en,
                ar: laneData.nameFields.ar,
                ckb: laneData.nameFields.ckb,
              },
            })
          );
        }

        if (laneData.descriptionFields) {
          if (existingLane.descriptionId) {
            languageUpdates.push(
              tx.language.update({
                where: { id: existingLane.descriptionId },
                data: {
                  en: laneData.descriptionFields.en || "",
                  ar: laneData.descriptionFields.ar,
                  ckb: laneData.descriptionFields.ckb,
                },
              })
            );
          } else if (laneData.descriptionFields.en) {
            // Create new description if it doesn't exist
            const descLang = await tx.language.create({
              data: {
                en: laneData.descriptionFields.en,
                ar: laneData.descriptionFields.ar,
                ckb: laneData.descriptionFields.ckb,
              },
            });
            // Update lane to connect description
            await tx.busLane.update({
              where: { id: laneData.id },
              data: { descriptionId: descLang.id },
            });
          }
        }
      }
      await Promise.all(languageUpdates);

      // Step 2: Prepare bulk update data (only fields that can be updated in bulk)
      // Note: path, serviceId, isActive can vary per lane, so we group by common values
      const updateGroups = new Map<string, Array<{ id: string; data: any }>>();

      validatedData.lanes.forEach((laneData) => {
        const updateKey = JSON.stringify({
          color: laneData.color,
          weight: laneData.weight,
          opacity: laneData.opacity,
          serviceId: laneData.serviceId,
          isActive: laneData.isActive,
        });

        if (!updateGroups.has(updateKey)) {
          updateGroups.set(updateKey, []);
        }

        updateGroups.get(updateKey)!.push({
          id: laneData.id,
          data: {
            ...(laneData.color !== undefined && { color: laneData.color }),
            ...(laneData.weight !== undefined && { weight: laneData.weight }),
            ...(laneData.opacity !== undefined && { opacity: laneData.opacity }),
            ...(laneData.serviceId !== undefined && { serviceId: laneData.serviceId }),
            ...(laneData.isActive !== undefined && { isActive: laneData.isActive }),
          },
        });
      });

      // Step 3: Execute bulk updates for each group
      for (const [key, lanes] of updateGroups) {
        if (lanes.length === 1) {
          // Single update
          const lane = lanes[0];
          await tx.busLane.update({
            where: { id: lane.id },
            data: {
              ...lane.data,
              ...(validatedData.lanes.find((l) => l.id === lane.id)?.path && {
                path: validatedData.lanes.find((l) => l.id === lane.id)!
                  .path as unknown as Prisma.JsonValue,
              }),
            },
          });
        } else {
          // Bulk update for lanes with same values
          const laneIds = lanes.map((l) => l.id);
          const firstLane = lanes[0];
          await tx.busLane.updateMany({
            where: { id: { in: laneIds } },
            data: firstLane.data,
          });

          // Update path individually (since it's JSON and unique per lane)
          for (const lane of lanes) {
            const laneData = validatedData.lanes.find((l) => l.id === lane.id);
            if (laneData?.path) {
              await tx.busLane.update({
                where: { id: lane.id },
                data: {
                  path: laneData.path as unknown as Prisma.JsonValue,
                },
              });
            }
          }
        }
      }

      // Step 4: Handle route connections (many-to-many relationships)
      for (const laneData of validatedData.lanes) {
        if (laneData.routeIds !== undefined) {
          // Get current route connections
          const currentLane = await tx.busLane.findUnique({
            where: { id: laneData.id },
            include: { routes: { select: { id: true } } },
          });

          if (currentLane) {
            const currentRouteIds = currentLane.routes.map((r) => r.id);
            const newRouteIds = laneData.routeIds || [];

            // Disconnect removed routes
            const routesToRemove = currentRouteIds.filter(
              (id) => !newRouteIds.includes(id)
            );
            if (routesToRemove.length > 0) {
              await tx.busLane.update({
                where: { id: laneData.id },
                data: {
                  routes: {
                    disconnect: routesToRemove.map((id) => ({ id })),
                  },
                },
              });
            }

            // Connect new routes
            const routesToAdd = newRouteIds.filter(
              (id) => !currentRouteIds.includes(id)
            );
            if (routesToAdd.length > 0) {
              await tx.busLane.update({
                where: { id: laneData.id },
                data: {
                  routes: {
                    connect: routesToAdd.map((id) => ({ id })),
                  },
                },
              });
            }
          }
        }
      }

      // Step 5: Fetch updated lanes with all relations
      const updatedLanes = await tx.busLane.findMany({
        where: { id: { in: laneIds } },
        include: {
          name: true,
          description: true,
          service: { include: { name: true } },
          routes: { select: { id: true } },
        },
      });

      return updatedLanes;
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Map editor update lanes error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update lanes",
      },
      { status: 500 }
    );
  }
}
```

### Step 4: Update Hooks for Map Editor

**File to Update:**

- `hooks/employee-hooks/use-bus-lane.ts`
- `hooks/employee-hooks/use-bus-route.ts`
- `hooks/employee-hooks/use-bus-stop.ts`

**Changes Needed:**

```typescript
// hooks/employee-hooks/use-bus-lane.ts

// Add to existing file
import { useQueryClient } from "@tanstack/react-query";

export const useCreateBusLanesMapEditor = () => {
  const queryClient = useQueryClient();
  const baseHook = createMutationHook<
    ApiResponse<BusLaneWithRelations[]>,
    CreateBusLanesMapEditorData
  >({
    method: "POST",
    url: "/api/employee/bus-lane/map-editor",
  })();

  return {
    ...baseHook,
    mutateAsync: async (variables: CreateBusLanesMapEditorData) => {
      const result = await baseHook.mutateAsync(variables);
      // Invalidate map data and bus lanes queries
      await queryClient.invalidateQueries({ queryKey: ["employee-map-data"] });
      await queryClient.invalidateQueries({ queryKey: ["employee-bus-lanes"] });
      return result;
    },
    mutate: (
      variables: CreateBusLanesMapEditorData,
      options?: Parameters<typeof baseHook.mutate>[1]
    ) => {
      baseHook.mutate(variables, {
        ...options,
        onSuccess: async (data, variables, context) => {
          await queryClient.invalidateQueries({
            queryKey: ["employee-map-data"],
          });
          await queryClient.invalidateQueries({
            queryKey: ["employee-bus-lanes"],
          });
          options?.onSuccess?.(data, variables, context);
        },
      });
    },
  };
};

export const useUpdateBusLanesMapEditor = () => {
  const queryClient = useQueryClient();
  const baseHook = createMutationHook<
    ApiResponse<BusLaneWithRelations[]>,
    UpdateBusLanesMapEditorData
  >({
    method: "PUT",
    url: "/api/employee/bus-lane/map-editor",
  })();

  return {
    ...baseHook,
    mutateAsync: async (variables: UpdateBusLanesMapEditorData) => {
      const result = await baseHook.mutateAsync(variables);
      await queryClient.invalidateQueries({ queryKey: ["employee-map-data"] });
      await queryClient.invalidateQueries({ queryKey: ["employee-bus-lanes"] });
      return result;
    },
    mutate: (
      variables: UpdateBusLanesMapEditorData,
      options?: Parameters<typeof baseHook.mutate>[1]
    ) => {
      baseHook.mutate(variables, {
        ...options,
        onSuccess: async (data, variables, context) => {
          await queryClient.invalidateQueries({
            queryKey: ["employee-map-data"],
          });
          await queryClient.invalidateQueries({
            queryKey: ["employee-bus-lanes"],
          });
          options?.onSuccess?.(data, variables, context);
        },
      });
    },
  };
};
```

### Step 5: Create Map Editor Components

**Directory Structure:**

```
app/dashboard/map-editor/
  ├── components/
  │   ├── map-editor-canvas.tsx          # Main map canvas component
  │   ├── map-editor-sidebar.tsx         # Sidebar with controls
  │   ├── lane-drawing-tool.tsx          # Lane drawing functionality
  │   ├── lane-editor-panel.tsx          # Lane editing panel
  │   ├── lane-bulk-dialog.tsx           # Bulk create/update dialog
  │   ├── map-editor-controls.tsx        # Map controls (zoom, layers, etc.)
  │   ├── map-icon-selector.tsx         # Map icon selector/list component
  │   └── existing-layers.tsx            # Existing map layers renderer
  └── page.tsx                           # Main map editor page
```

**Key Components:**

1. **Main Page** (`app/dashboard/map-editor/page.tsx`):

```typescript
"use client";

import { useSession } from "next-auth/react";
import { Permission } from "@prisma/client";
import { useState } from "react";
import { useMapEditorData } from "@/hooks/employee-hooks/use-map";
import { MapEditorCanvas } from "./components/map-editor-canvas";
import { MapEditorSidebar } from "./components/map-editor-sidebar";
import { MapIconSelector } from "./components/map-icon-selector";
import { hasPermission } from "@/lib/utils";
import { useTranslation } from "@/i18n/client";
import { PageHeader } from "@/components/page-header";
import { MapIconWithRelations } from "@/types/models/map-icon";
import { CoordinateTuple } from "@/types/map";

export default function MapEditorPage() {
  const { t, i18n } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  const { data: session } = useSession();
  const canEdit = hasPermission(session, Permission.EDIT_MAP);
  const { data, isPending, error, refetch } = useMapEditorData({
    enabled: canEdit,
  });

  // Icon placement state
  const [selectedIcon, setSelectedIcon] =
    useState<MapIconWithRelations | null>(null);
  const [placedIcons, setPlacedIcons] = useState<Array<{
    id: string;
    icon: MapIconWithRelations;
    position: CoordinateTuple;
  }>>([]);

  const handleIconPlace = (
    icon: MapIconWithRelations,
    position: CoordinateTuple
  ) => {
    setPlacedIcons((prev) => [
      ...prev,
      {
        id: `icon-${Date.now()}`,
        icon,
        position,
      },
    ]);
  };

  const handlePlacedIconUpdate = (
    iconId: string,
    position: CoordinateTuple
  ) => {
    setPlacedIcons((prev) =>
      prev.map((icon) =>
        icon.id === iconId ? { ...icon, position } : icon
      )
    );
  };

  if (!canEdit) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>{t("YouDontHavePermissionToEditTheMap")}</p>
      </div>
    );
  }

  return (
    <main className="flex h-screen flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader
        title={t("MapEditor")}
        description={t("DrawAndEditBusLanesOnTheMap")}
      />
      <div className="flex flex-1 overflow-hidden">
        <MapEditorSidebar
          data={data?.data}
          onRefetch={refetch}
          className="w-80 border-r"
        />
        <div className="flex flex-1 flex-col">
          <MapEditorCanvas
            data={data?.data}
            isPending={isPending}
            error={error}
            className="flex-1"
            selectedIcon={selectedIcon}
            onIconPlace={handleIconPlace}
            placedIcons={placedIcons}
            onPlacedIconUpdate={handlePlacedIconUpdate}
          />
          <MapIconSelector
            onIconSelect={setSelectedIcon}
            selectedIconId={selectedIcon?.id}
            className="h-32 border-t"
          />
        </div>
      </div>
    </main>
  );
}
```

2. **Map Editor Canvas** (`app/dashboard/map-editor/components/map-editor-canvas.tsx`):

```typescript
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { MapContainer, TileLayer, FeatureGroup } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import L from "leaflet";
import { MapDataPayload, CoordinateTuple } from "@/types/map";
import { LaneDrawingTool } from "./lane-drawing-tool";
import { MapEditorControls } from "./map-editor-controls";
import { ExistingLayers } from "./existing-layers";
import { MapIconWithRelations } from "@/types/models/map-icon";
import { Marker, Tooltip } from "react-leaflet";
import { LatLng } from "leaflet";

const DEFAULT_CENTER: LatLngExpression = [36.1911, 44.0092];

interface MapEditorCanvasProps {
  data?: MapDataPayload;
  isPending?: boolean;
  error?: Error | null;
  className?: string;
  selectedIcon?: MapIconWithRelations | null;
  onIconPlace?: (icon: MapIconWithRelations, position: CoordinateTuple) => void;
  placedIcons?: Array<{
    id: string;
    icon: MapIconWithRelations;
    position: CoordinateTuple;
  }>;
  onPlacedIconUpdate?: (
    iconId: string,
    position: CoordinateTuple
  ) => void;
}

export function MapEditorCanvas({
  data,
  isPending,
  error,
  className,
  selectedIcon,
  onIconPlace,
  placedIcons,
  onPlacedIconUpdate,
}: MapEditorCanvasProps) {
  const [draftLanes, setDraftLanes] = useState<Array<{
    id: string;
    path: Array<[number, number]>;
    color: string;
  }>>([]);
  const [selectedLaneId, setSelectedLaneId] = useState<string | null>(null);
  const [mapKey] = useState(() => `map-${Date.now()}`);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const center = useMemo(() => {
    // Calculate center from data or use default
    return DEFAULT_CENTER;
  }, [data]);

  // Helper to create Leaflet icon from MapIcon
  const createIconFromMapIcon = (
    mapIcon: MapIconWithRelations
  ): L.Icon | null => {
    if (!mapIcon.file?.url || typeof window === "undefined") return null;

    const size = mapIcon.iconSize ?? 32;
    return L.icon({
      iconUrl: mapIcon.file.url,
      iconSize: [size, size],
      iconAnchor: [
        mapIcon.iconAnchorX ?? size / 2,
        mapIcon.iconAnchorY ?? size,
      ],
      popupAnchor: [
        mapIcon.popupAnchorX ?? 0,
        mapIcon.popupAnchorY ?? -size / 2,
      ],
    });
  };

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (e) {
          console.warn("Map cleanup warning:", e);
        }
      }
    };
  }, []);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">{error.message}</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        key={mapKey}
        center={center}
        zoom={14}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ExistingLayers
          lanes={data?.lanes ?? []}
          stops={data?.stops ?? []}
          routes={data?.routes ?? []}
          selectedLaneId={selectedLaneId}
          onLaneClick={setSelectedLaneId}
        />
        <FeatureGroup>
          <LaneDrawingTool
            draftLanes={draftLanes}
            onDraftLanesChange={setDraftLanes}
            selectedLaneId={selectedLaneId}
            onLaneSelect={setSelectedLaneId}
          />
          {/* Render placed icons */}
          {placedIcons?.map((placedIcon) => {
            const customIcon = createIconFromMapIcon(placedIcon.icon);
            if (!customIcon) return null;

            return (
              <Marker
                key={placedIcon.id}
                position={placedIcon.position}
                icon={customIcon}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const newPosition = marker.getLatLng();
                    onPlacedIconUpdate?.(placedIcon.id, [
                      newPosition.lat,
                      newPosition.lng,
                    ]);
                  },
                }}
              >
                <Tooltip sticky>
                  {placedIcon.icon.name?.en ?? placedIcon.icon.id}
                </Tooltip>
              </Marker>
            );
          })}
        </FeatureGroup>
      </MapContainer>
      <MapEditorControls />
    </div>
  );
}
```

3. **Lane Bulk Dialog** (`app/dashboard/map-editor/components/lane-bulk-dialog.tsx`):

```typescript
"use client";

import { FC, useState, useEffect } from "react";
import { useTranslation } from "@/i18n/client";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { LanguageTabs } from "@/components/language-tabs";
import { LanguageFields } from "@/utils/language-handler";
import { useCreateBusLanesMapEditor, useUpdateBusLanesMapEditor } from "@/hooks/employee-hooks/use-bus-lane";
import { MapEditorLaneDraft } from "@/types/models/bus-lane";
import { toast } from "sonner";
import { Info, Loader2 } from "lucide-react";
import SelectWithPagination from "@/components/select-with-pagination";
import { useFetchTransportServices } from "@/hooks/employee-hooks/use-transport-service";
import { useFetchBusRoutes } from "@/hooks/employee-hooks/use-bus-route";

interface LaneBulkDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lanes: MapEditorLaneDraft[];
  mode: "create" | "update";
  onSuccess?: () => void;
}

export const LaneBulkDialog: FC<LaneBulkDialogProps> = ({
  isOpen,
  onOpenChange,
  lanes,
  mode,
  onSuccess,
}) => {
  const { t, i18n } = useTranslation("Map");
  const isRTL = i18n.language !== "en";
  const [activeTab, setActiveTab] = useState<"english" | "arabic" | "kurdish">("english");
  const [laneForms, setLaneForms] = useState<Array<{
    name: { en: string; ar?: string | null; ckb?: string | null };
    description?: { en?: string | null; ar?: string | null; ckb?: string | null };
    color: string;
    serviceId?: string | null;
    routeIds?: string[];
    isActive: boolean;
  }>>([]);

  const { mutateAsync: createLanes, isPending: isCreating } = useCreateBusLanesMapEditor();
  const { mutateAsync: updateLanes, isPending: isUpdating } = useUpdateBusLanesMapEditor();

  useEffect(() => {
    if (isOpen && lanes.length > 0) {
      setLaneForms(
        lanes.map((lane) => ({
          name: lane.name || { en: "", ar: null, ckb: null },
          description: lane.description,
          color: lane.color || "#0066CC",
          serviceId: lane.serviceId || null,
          routeIds: lane.routeIds || [],
          isActive: lane.isActive ?? true,
        }))
      );
    }
  }, [isOpen, lanes]);

  const handleSubmit = async () => {
    try {
      if (mode === "create") {
        const dataToSubmit = lanes.map((lane, index) => ({
          ...lane,
          name: laneForms[index]?.name || lane.name,
          description: laneForms[index]?.description || lane.description,
          color: laneForms[index]?.color || lane.color,
          serviceId: laneForms[index]?.serviceId || lane.serviceId,
          routeIds: laneForms[index]?.routeIds || lane.routeIds,
          isActive: laneForms[index]?.isActive ?? true,
        }));

        await createLanes({ lanes: dataToSubmit });
        toast.success(t("Success.Created"));
      } else {
        // Update mode - lanes should have IDs
        // Implementation for update
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting lanes:", error);
      toast.error(t("Error.CreateFailed"));
    }
  };

  return (
    <CustomDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={mode === "create" ? t("CreateLanes") : t("UpdateLanes")}
      description={t("FillOutLaneDetails")}
      rtl={isRTL}
      icon={Info}
    >
      <div className="space-y-6">
        {laneForms.map((form, index) => (
          <div key={index} className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold">{t("LaneNumber", { number: index + 1 })}</h3>

            <LanguageTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              titleFields={form.name as LanguageFields}
              onTitleChange={(fields) => {
                setLaneForms((prev) => {
                  const updated = [...prev];
                  updated[index] = { ...updated[index], name: fields };
                  return updated;
                });
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("Color")}</Label>
                <Input
                  type="color"
                  value={form.color}
                  onChange={(e) => {
                    setLaneForms((prev) => {
                      const updated = [...prev];
                      updated[index] = { ...updated[index], color: e.target.value };
                      return updated;
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("TransportService")}</Label>
                <SelectWithPagination
                  fetchFunction={useFetchTransportServices}
                  onSelect={(item) => {
                    setLaneForms((prev) => {
                      const updated = [...prev];
                      updated[index] = { ...updated[index], serviceId: item?.id || null };
                      return updated;
                    });
                  }}
                  value={form.serviceId || ""}
                  canClear
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>{t("IsActive")}</Label>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => {
                  setLaneForms((prev) => {
                    const updated = [...prev];
                    updated[index] = { ...updated[index], isActive: checked };
                    return updated;
                  });
                }}
              />
            </div>
          </div>
        ))}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("Cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isCreating || isUpdating}
          >
            {(isCreating || isUpdating) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {mode === "create" ? t("CreateLanes") : t("UpdateLanes")}
          </Button>
        </div>
      </div>
    </CustomDialog>
  );
};
```

### Step 6: Create Lane Drawing Tool

**File:** `app/dashboard/map-editor/components/lane-drawing-tool.tsx`

```typescript
"use client";

import { useEffect } from "react";
import { useMapEvents, Marker, Polyline } from "react-leaflet";
import { LatLng, Icon } from "leaflet";
import { CoordinateTuple } from "@/types/map";
import { createDefaultMarkerIcon } from "@/lib/map/marker-icons";
import { Tooltip } from "react-leaflet";

interface LaneDrawingToolProps {
  draftLanes: Array<{
    id: string;
    path: Array<[number, number]>;
    color: string;
  }>;
  onDraftLanesChange: (lanes: Array<{
    id: string;
    path: Array<[number, number]>;
    color: string;
  }>) => void;
  selectedLaneId: string | null;
  onLaneSelect: (laneId: string | null) => void;
}

export function LaneDrawingTool({
  draftLanes,
  onDraftLanesChange,
  selectedLaneId,
  onLaneSelect,
}: LaneDrawingToolProps) {
  const defaultIcon = createDefaultMarkerIcon();

  const handleMapClick = (event: { latlng: LatLng }) => {
    const point: CoordinateTuple = [event.latlng.lat, event.latlng.lng];

    // If no lanes exist or last lane is complete, create new lane
    if (draftLanes.length === 0 ||
        (draftLanes[draftLanes.length - 1]?.path.length ?? 0) >= 2) {
      const newLane = {
        id: `draft-${Date.now()}`,
        path: [point],
        color: "#0066CC",
      };
      onDraftLanesChange([...draftLanes, newLane]);
      onLaneSelect(newLane.id);
    } else {
      // Add point to current lane
      const updatedLanes = [...draftLanes];
      const lastLane = updatedLanes[updatedLanes.length - 1];
      if (lastLane) {
        lastLane.path.push(point);
        onDraftLanesChange(updatedLanes);
      }
    }
  };

  useMapEvents({
    click: handleMapClick,
  });

  return (
    <>
      {draftLanes.map((lane) => (
        <Polyline
          key={lane.id}
          positions={lane.path}
          pathOptions={{
            color: lane.color,
            weight: 5,
            opacity: 0.7,
          }}
          eventHandlers={{
            click: () => onLaneSelect(lane.id),
          }}
        >
          <Tooltip sticky>{lane.id}</Tooltip>
        </Polyline>
      ))}
      {draftLanes.map((lane) =>
        lane.path.map((point, index) => (
          <Marker
            key={`${lane.id}-${index}`}
            position={point}
            icon={defaultIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const newPosition = marker.getLatLng();
                const updatedLanes = draftLanes.map((l) => {
                  if (l.id === lane.id) {
                    const updatedPath = [...l.path];
                    updatedPath[index] = [newPosition.lat, newPosition.lng];
                    return { ...l, path: updatedPath };
                  }
                  return l;
                });
                onDraftLanesChange(updatedLanes);
              },
            }}
          >
            <Tooltip sticky>Point {index + 1}</Tooltip>
          </Marker>
        ))
      )}
    </>
  );
}
```

### Step 7: Create Map Editor Sidebar

**File:** `app/dashboard/map-editor/components/map-editor-sidebar.tsx`

```typescript
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapDataPayload } from "@/types/map";
import { LaneBulkDialog } from "./lane-bulk-dialog";
import { MapEditorLaneDraft } from "@/types/models/bus-lane";
import { useTranslation } from "@/i18n/client";
import { Plus, Edit, Trash2 } from "lucide-react";

interface MapEditorSidebarProps {
  data?: MapDataPayload;
  onRefetch?: () => void;
  className?: string;
}

export function MapEditorSidebar({
  data,
  onRefetch,
  className,
}: MapEditorSidebarProps) {
  const { t } = useTranslation("Map");
  const [draftLanes, setDraftLanes] = useState<MapEditorLaneDraft[]>([]);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "update">("create");

  const handleCreateLanes = () => {
    if (draftLanes.length === 0) return;
    setDialogMode("create");
    setIsBulkDialogOpen(true);
  };

  const handleUpdateLanes = () => {
    // Convert existing lanes to draft format
    const lanesToUpdate = data?.lanes?.map((lane) => ({
      id: lane.id,
      path: lane.path,
      color: lane.color || "#0066CC",
      name: lane.name,
      description: lane.description,
      serviceId: lane.serviceId,
      isActive: lane.isActive ?? true,
    })) || [];

    setDraftLanes(lanesToUpdate);
    setDialogMode("update");
    setIsBulkDialogOpen(true);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <Card className="flex-1 overflow-hidden">
        <CardHeader>
          <h2 className="text-lg font-semibold">{t("MapEditor")}</h2>
        </CardHeader>
        <CardContent className="space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t("DraftLanes")}</span>
              <Badge variant="secondary">{draftLanes.length}</Badge>
            </div>
            {draftLanes.length > 0 && (
              <Button
                type="button"
                onClick={handleCreateLanes}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("CreateLanes")}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t("ExistingLanes")}</span>
              <Badge variant="secondary">{data?.lanes?.length ?? 0}</Badge>
            </div>
            {data?.lanes && data.lanes.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleUpdateLanes}
                className="w-full"
              >
                <Edit className="mr-2 h-4 w-4" />
                {t("UpdateLanes")}
              </Button>
            )}
          </div>

          {/* Lane list */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{t("Lanes")}</h3>
            <div className="space-y-1">
              {data?.lanes?.map((lane) => (
                <div
                  key={lane.id}
                  className="flex items-center justify-between rounded border p-2"
                >
                  <span className="text-sm">
                    {lane.name?.en ?? lane.id}
                  </span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <LaneBulkDialog
        isOpen={isBulkDialogOpen}
        onOpenChange={setIsBulkDialogOpen}
        lanes={draftLanes}
        mode={dialogMode}
        onSuccess={() => {
          setDraftLanes([]);
          onRefetch?.();
        }}
      />
    </div>
  );
}
```

### Step 9: Integrate Icon Placement on Map

**File to Update:** `app/dashboard/map-editor/components/map-editor-canvas.tsx`

**Changes Needed:**

```typescript
// Add to MapEditorCanvas component

import { MapIconSelector } from "./map-icon-selector";
import { MapIconWithRelations } from "@/types/models/map-icon";
import { Marker } from "react-leaflet";
import L from "leaflet";

// Add state for icon placement mode
const [selectedIcon, setSelectedIcon] = useState<MapIconWithRelations | null>(null);
const [iconPlacementMode, setIconPlacementMode] = useState(false);
const [placedIcons, setPlacedIcons] = useState<Array<{
  id: string;
  icon: MapIconWithRelations;
  position: [number, number];
}>>([]);

// Add icon click handler
const handleMapClickForIcon = (event: { latlng: LatLng }) => {
  if (iconPlacementMode && selectedIcon) {
    const position: CoordinateTuple = [event.latlng.lat, event.latlng.lng];
    setPlacedIcons((prev) => [
      ...prev,
      {
        id: `icon-${Date.now()}`,
        icon: selectedIcon,
        position,
      },
    ]);
    // Optionally exit placement mode after placing
    // setIconPlacementMode(false);
    // setSelectedIcon(null);
  }
};

// Create custom icon from MapIcon data
const createIconFromMapIcon = (mapIcon: MapIconWithRelations): L.Icon | null => {
  if (!mapIcon.file?.url) return null;

  const size = mapIcon.iconSize ?? 32;
  return L.icon({
    iconUrl: mapIcon.file.url,
    iconSize: [size, size],
    iconAnchor: [
      mapIcon.iconAnchorX ?? size / 2,
      mapIcon.iconAnchorY ?? size,
    ],
    popupAnchor: [
      mapIcon.popupAnchorX ?? 0,
      mapIcon.popupAnchorY ?? -size / 2,
    ],
  });
};

// In the MapContainer, add icon placement handler
        <MapClickHandler
          onAddPoint={handleAddPoint}
          onAddStop={handleAddStop}
          mode={editorMode}
          onStopClick={handleStopClick}
          selectedIcon={selectedIcon}
          onIconPlace={handleIconPlace}
        />

// Render placed icons
{placedIcons.map((placedIcon) => {
  const customIcon = createIconFromMapIcon(placedIcon.icon);
  if (!customIcon) return null;

  return (
    <Marker
      key={placedIcon.id}
      position={placedIcon.position}
      icon={customIcon}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const newPosition = marker.getLatLng();
          setPlacedIcons((prev) =>
            prev.map((icon) =>
              icon.id === placedIcon.id
                ? { ...icon, position: [newPosition.lat, newPosition.lng] }
                : icon
            )
          );
        },
        click: () => {
          // Handle icon click (e.g., show details, delete)
        },
      }}
    >
      <Tooltip sticky>
        {placedIcon.icon.name?.en ?? placedIcon.icon.id}
      </Tooltip>
    </Marker>
  );
})}
```

**Update MapClickHandler component:**

```typescript
// Update MapClickHandler to support icon placement
const MapClickHandler = ({
  onAddPoint,
  onAddStop,
  mode,
  onStopClick,
  onIconPlace,
}: {
  onAddPoint: (point: CoordinateTuple) => void;
  onAddStop: (point: CoordinateTuple) => void;
  mode: "lane" | "stop";
  onStopClick?: (point: CoordinateTuple) => void;
  selectedIcon?: MapIconWithRelations | null;
  onIconPlace?: (icon: MapIconWithRelations, position: CoordinateTuple) => void;
}) => {
  useMapEvents({
    click: (event) => {
      const point: CoordinateTuple = [event.latlng.lat, event.latlng.lng];

      // Priority: Icon placement > Stop click > Stop creation > Lane point
      if (onIconPlace) {
        onIconPlace(event);
        return;
      }

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

### Step 10: Remove Old Map Editor Page

**Action Items:**

1. Delete or archive `app/dashboard/map-editor/page.tsx` (old version)
2. Update navigation/routing if needed
3. Ensure new page is accessible at `/dashboard/map-editor`

## File Structure Summary

```
app/
├── api/
│   └── employee/
│       ├── bus-lane/
│       │   └── map-editor/
│       │       └── route.ts          # NEW
│       ├── bus-route/
│       │   └── map-editor/
│       │       └── route.ts          # NEW
│       └── bus-stop/
│           └── map-editor/
│               └── route.ts          # NEW
└── dashboard/
    └── map-editor/
        ├── components/
        │   ├── map-editor-canvas.tsx      # NEW
        │   ├── map-editor-sidebar.tsx     # NEW
        │   ├── lane-drawing-tool.tsx      # NEW
        │   ├── lane-editor-panel.tsx      # NEW
        │   ├── lane-bulk-dialog.tsx       # NEW
        │   ├── map-editor-controls.tsx    # NEW
        │   ├── map-icon-selector.tsx      # NEW
        │   └── existing-layers.tsx        # NEW
        └── page.tsx                       # NEW (replaces old)

hooks/
└── employee-hooks/
    ├── use-bus-lane.ts                    # UPDATE (add map editor hooks)
    ├── use-bus-route.ts                   # UPDATE (add map editor hooks)
    └── use-bus-stop.ts                    # UPDATE (add map editor hooks)

types/
└── models/
    ├── bus-lane.ts                        # UPDATE (add map editor types)
    ├── bus-route.ts                       # UPDATE (add map editor types)
    └── bus-stop.ts                        # UPDATE (add map editor types)
```

## Testing Checklist

### API Routes

- [ ] POST `/api/employee/bus-lane/map-editor` creates multiple lanes
- [ ] PUT `/api/employee/bus-lane/map-editor` updates multiple lanes
- [ ] Proper error handling and validation
- [ ] Permission checks work correctly
- [ ] Transactions handle failures properly

### Hooks

- [ ] `useCreateBusLanesMapEditor` invalidates queries correctly
- [ ] `useUpdateBusLanesMapEditor` invalidates queries correctly
- [ ] Loading states work properly
- [ ] Error handling displays correctly

### Components

- [ ] Map canvas renders correctly
- [ ] Lane drawing tool allows point-by-point drawing
- [ ] Draft lanes display on map
- [ ] Bulk dialog opens with correct mode
- [ ] Form submission works for multiple lanes
- [ ] Map updates after successful creation/update
- [ ] Map icon selector displays all available icons
- [ ] Icons can be selected and placed on map
- [ ] Placed icons are draggable
- [ ] Icon placement mode works correctly

### Integration

- [ ] New lanes appear on map after creation
- [ ] Updated lanes reflect changes immediately
- [ ] Query invalidation refreshes map data
- [ ] No conflicts with existing dashboard map editor

## Translation Keys

Add to `i18n/locales/{lang}/Map.json`:

```json
{
  "MapEditor": "Map Editor",
  "DrawAndEditBusLanesOnTheMap": "Draw and edit bus lanes directly on the map",
  "DraftLanes": "Draft Lanes",
  "ExistingLanes": "Existing Lanes",
  "CreateLanes": "Create Lanes",
  "UpdateLanes": "Update Lanes",
  "LaneNumber": "Lane {number}",
  "FillOutLaneDetails": "Fill out the details for each lane",
  "Color": "Color",
  "TransportService": "Transport Service",
  "IsActive": "Is Active",
  "Lanes": "Lanes",
  "MapIcons": "Map Icons",
  "LoadingIcons": "Loading icons...",
  "SearchIcons": "Search icons...",
  "NoIconsFound": "No icons found",
  "SelectIconToPlace": "Select an icon to place on the map",
  "IconPlacementMode": "Icon Placement Mode",
  "ClickMapToPlaceIcon": "Click on the map to place the selected icon"
}
```

## Performance Optimizations

### Bulk Operations Strategy

1. **Language Records**: Created in parallel using `Promise.all()` for maximum concurrency
2. **Lane Creation**: Uses `createMany()` for bulk inserts (much faster than individual creates)
3. **Lane Updates**: Groups lanes by update values and uses `updateMany()` where possible
4. **Relationships**: Handled in parallel after bulk operations complete
5. **Transactions**: All operations wrapped in a single transaction for atomicity

### Key Optimizations:

- **createMany**: Used for creating multiple lanes/stops at once (no individual queries)
- **updateMany**: Used for updating multiple lanes with same values (reduces queries)
- **Parallel Processing**: Language records, relationships handled concurrently
- **Batching**: Groups similar updates together to minimize database round trips

### Performance Considerations:

- For 10 lanes: ~15 queries (vs ~100+ with individual creates)
- For 50 lanes: ~75 queries (vs ~500+ with individual creates)
- Transaction overhead is minimal compared to query reduction
- Memory usage is reasonable even for large batches

## Migration Notes

1. **Backward Compatibility**: The old map editor page should be removed or clearly marked as deprecated
2. **Data Migration**: No database changes needed, only API route changes
3. **User Training**: Users will need to learn the new drawing interface
4. **Performance**: Bulk operations optimized using `createMany` and `updateMany` for significant performance gains
5. **Relationships**: Bus routes connect to lanes (many-to-many), handled efficiently after bulk creation

## Next Steps

1. **Phase 1**: Implement types and optimized helper functions (with `createMany`/`updateMany`)
2. **Phase 2**: Create API routes using optimized helpers
3. **Phase 3**: Create hooks and basic components
4. **Phase 4**: Build map editor canvas and drawing tools
5. **Phase 5**: Implement bulk dialog and form handling
6. **Phase 6**: Testing and performance validation
7. **Phase 7**: Remove old map editor page

## Important Notes

### Prisma Relationship Handling

- **BusLane ↔ BusRoute**: Many-to-many relationship
  - Routes connect to lanes via `routes` field on BusRoute
  - When creating lanes, connect them to routes after bulk creation
  - When updating lanes, handle route disconnections/connections efficiently

- **BusLane ↔ BusStop**: Many-to-many relationship
  - Stops connect to lanes via `stops` field on BusStop
  - Draft stops are created first, then connected to lanes
  - Use `createMany` for stops, then connect in batch

- **BusRoute ↔ BusStop**: Many-to-many relationship
  - Routes can also connect to stops
  - Handle this separately if needed in route map editor

### Transaction Safety

All bulk operations are wrapped in transactions to ensure:

- Atomicity: All lanes created or none
- Consistency: Relationships properly established
- Rollback: On any error, all changes are reverted

## References

- [Map Editor CRUD Implementation](./MAP_EDITOR_CRUD_IMPLEMENTATION.md)
- [Leaflet Setup Guide](./LEAFLET_SETUP.md)
- [Project Structure](./PROJECT_STRUCTURE.md)
