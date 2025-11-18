import { z } from "zod";

export const generateReportSchema = z.object({
  reportType: z.enum(["none"]),
  startDate: z.string(),
  endDate: z.string(),
});
