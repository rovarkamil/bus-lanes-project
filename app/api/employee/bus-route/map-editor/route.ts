"use server";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Permission } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createBusRoutesMapEditorSchema,
  updateBusRoutesMapEditorSchema,
} from "@/types/models/bus-route";
import {
  createBusRoutesBulkWithBusinessLogic,
  updateBusRoutesBulkWithBusinessLogic,
} from "@/lib/helpers/bus-route-helpers";
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

    if (!hasPermission(session, Permission.CREATE_BUS_ROUTE)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createBusRoutesMapEditorSchema.parse(body);

    const results = await prisma.$transaction(async (tx) => {
      // Use optimized bulk creation helper
      return await createBusRoutesBulkWithBusinessLogic({
        routes: validatedData.routes.map((route) => ({
          nameFields: route.name || {
            en: `Route ${Date.now()}-${Math.random()}`,
            ar: null,
            ckb: null,
          },
          descriptionFields: route.description,
          serviceId: route.serviceId,
          routeNumber: route.routeNumber,
          direction: route.direction,
          fare: route.fare,
          currency: route.currency,
          frequency: route.frequency,
          duration: route.duration,
          laneIds: route.laneIds,
          stopIds: route.stopIds,
          isActive: route.isActive,
        })),
        tx,
      });
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Map editor create routes error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create routes",
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

    if (!hasPermission(session, Permission.UPDATE_BUS_ROUTE)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateBusRoutesMapEditorSchema.parse(body);

    const results = await prisma.$transaction(async (tx) => {
      // Use optimized bulk update helper
      return await updateBusRoutesBulkWithBusinessLogic({
        routes: validatedData.routes.map((route) => ({
          id: route.id,
          nameFields: route.nameFields,
          descriptionFields: route.descriptionFields,
          serviceId: route.serviceId,
          routeNumber: route.routeNumber,
          direction: route.direction,
          fare: route.fare,
          currency: route.currency,
          frequency: route.frequency,
          duration: route.duration,
          laneIds: route.laneIds,
          stopIds: route.stopIds,
          isActive: route.isActive,
        })),
        tx,
      });
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Map editor update routes error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update routes",
      },
      { status: 500 }
    );
  }
}
