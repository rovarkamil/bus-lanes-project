/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { type LucideIcon } from "lucide-react";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { type UserWithRelations } from "@/types/models/user";
import { type Permission } from "@prisma/client";
import { type Session } from "next-auth";
import { renderIndexColumn } from "@/components/data-table/index-column";

// Generic render context
export interface RenderContext<T = UserWithRelations> {
  index: number;
  t: (key: string) => string;
  session: Session | null;
  isDeleting: boolean;
  handlers: {
    setSelectedItem: (item: T | null) => void;
    setIsViewDialogOpen: (open: boolean) => void;
    handleOpenUpdateDialog: (item: T) => void;
    handleDelete: (id: string) => void;
    isRtl: boolean;
    refetch?: () => void;
    handlePrintSinglePrices?: (
      item: T,
      paperSize: "A4-grid" | "A4-single" | "A5-double"
    ) => void;
    handlePrintBundlePrices?: (
      item: T,
      paperSize: "A4-grid" | "A4-single" | "A5-double"
    ) => void;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Column<T = any> {
  key: "index" | string;
  label: string;
  sortable: boolean;
  className?: string;
  showInMobile?: boolean;
  render?: (
    item: T,
    context: RenderContext<T>,
    types?: Record<string, string>
  ) => React.ReactNode;
}

export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];

export interface ActionButton<T = UserWithRelations> {
  icon: LucideIcon;
  tooltip: string;
  variant: ButtonVariant;
  className: string;
  onClick: (item: T, handlers: ActionHandlers<T>) => void;
  requiresPermission: Permission | false;
}

export interface ActionHandlers<T = UserWithRelations> {
  setSelectedItem?: (item: T | null) => void;
  setIsViewDialogOpen?: (open: boolean) => void;
  handleOpenUpdateDialog?: (item: T) => void;
  handleDelete?: (id: string) => void;
  refetch?: () => void;
}

export const createIndexColumn = <T>(): Column<T> => ({
  key: "index",
  label: "#",
  sortable: false,
  className: "w-[50px] font-semibold",
  showInMobile: true,
  render: renderIndexColumn,
});

export const ensureIndexColumn = <T>(columns: Column<T>[]): Column<T>[] => {
  const hasIndexColumn = columns.some((col) => col.key === "index");
  if (hasIndexColumn) {
    // Move index column to front if it exists
    return [
      ...columns.filter((col) => col.key === "index"),
      ...columns.filter((col) => col.key !== "index"),
    ];
  }
  // Add index column if it doesn't exist
  return [createIndexColumn<T>(), ...columns];
};
