"use server";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Permission } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createBusLanesMapEditorSchema,
  updateBusLanesMapEditorSchema,
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
      });
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
      });
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
