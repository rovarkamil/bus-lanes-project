import { utils, write } from "xlsx";
import { Column } from "@/types/data-table";

const formatValue = (value: unknown): string | number | boolean => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
};

export const exportToExcel = <T extends Record<string, unknown>>(
  data: T[],
  columns: Column<T>[],
  filename: string = "export.xlsx"
) => {
  // Transform data for Excel
  const excelData = data.map((item) => {
    const row: Record<string, string | number | boolean> = {};
    columns.forEach((column) => {
      if (column.key !== "actions" && typeof column.key === "string") {
        const value = item[column.key as keyof T];
        row[column.label] = formatValue(value);
      }
    });
    return row;
  });

  // Create workbook and worksheet
  const worksheet = utils.json_to_sheet(excelData);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Data");

  // Convert to binary string
  const excelBuffer = write(workbook, { bookType: "xlsx", type: "binary" });

  // Convert to Blob
  const blob = new Blob([s2ab(excelBuffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Convert string to ArrayBuffer
function s2ab(s: string) {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < s.length; i++) {
    view[i] = s.charCodeAt(i) & 0xff;
  }
  return buf;
}
