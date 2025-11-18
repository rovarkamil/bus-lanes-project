import { NextResponse } from "next/server";
import { createError, CustomErrorHandler } from "@/lib/custom-error-handler";
import { z } from "zod";

const formatErrorResponse = (error: CustomErrorHandler): NextResponse => {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: error.message,
        status: error.status,
      },
    },
    { status: error.status }
  );
};

export async function POST() {
  try {
    // const body = await req.clone().json();
    // const { startDate, endDate, reportType } = generateReportSchema.parse(body);

    // Set start date to beginning of day and end date to end of day
    // const start = new Date(startDate);
    // const end = new Date(endDate);

    return NextResponse.json(
      {
        success: true,
        data: "result",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in report generation:", error);

    if (error instanceof z.ZodError) {
      return formatErrorResponse(
        createError("Validation", "Errors", "InvalidReportData", 400)
      );
    }

    if (error instanceof CustomErrorHandler) {
      return formatErrorResponse(error);
    }

    return formatErrorResponse(
      createError("System", "Errors", "UnexpectedError", 500)
    );
  }
}

export const dynamic = "force-dynamic";
