"use server";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Permission } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createBusStopsMapEditorSchema,
  updateBusStopsMapEditorSchema,
} from "@/types/models/bus-stop";
import {
  createBusStopsBulkWithBusinessLogic,
  updateBusStopsBulkWithBusinessLogic,
} from "@/lib/helpers/bus-stop-helpers";
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

    const canCreate =
      hasPermission(session, Permission.CREATE_BUS_STOP) ||
      hasPermission(session, Permission.EDIT_MAP);

    if (!canCreate) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createBusStopsMapEditorSchema.parse(body);

    const results = await prisma.$transaction(async (tx) => {
      // Use optimized bulk creation helper
      return await createBusStopsBulkWithBusinessLogic({
        stops: validatedData.stops.map((stop) => ({
          nameFields: stop.name || {
            en: `Stop ${Date.now()}-${Math.random()}`,
            ar: null,
            ckb: null,
          },
          descriptionFields: stop.description,
          latitude: stop.latitude,
          longitude: stop.longitude,
          images: stop.images,
          laneIds: stop.laneIds,
          routeIds: stop.routeIds,
          iconId: stop.iconId,
          zoneId: stop.zoneId,
          hasShelter: stop.hasShelter,
          hasBench: stop.hasBench,
          hasLighting: stop.hasLighting,
          isAccessible: stop.isAccessible,
          hasRealTimeInfo: stop.hasRealTimeInfo,
          order: stop.order,
        })),
        tx,
      });
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Map editor create stops error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create stops",
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

    const canUpdate =
      hasPermission(session, Permission.UPDATE_BUS_STOP) ||
      hasPermission(session, Permission.EDIT_MAP);

    if (!canUpdate) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateBusStopsMapEditorSchema.parse(body);

    const results = await prisma.$transaction(async (tx) => {
      // Use optimized bulk update helper
      return await updateBusStopsBulkWithBusinessLogic({
        stops: validatedData.stops.map((stop) => ({
          id: stop.id,
          latitude: stop.latitude,
          longitude: stop.longitude,
          nameFields: stop.nameFields,
          descriptionFields: stop.descriptionFields,
          images: stop.images,
          laneIds: stop.laneIds,
          routeIds: stop.routeIds,
          iconId: stop.iconId,
          zoneId: stop.zoneId,
          hasShelter: stop.hasShelter,
          hasBench: stop.hasBench,
          hasLighting: stop.hasLighting,
          isAccessible: stop.isAccessible,
          hasRealTimeInfo: stop.hasRealTimeInfo,
          order: stop.order,
        })),
        tx,
      });
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Map editor update stops error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update stops",
      },
      { status: 500 }
    );
  }
}

