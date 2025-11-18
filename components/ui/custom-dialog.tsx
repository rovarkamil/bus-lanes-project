/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { FC, ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface CustomDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";
  rtl?: boolean;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
};

export const CustomDialog: FC<CustomDialogProps> = ({
  isOpen,
  onOpenChange,
  icon: Icon,
  title,
  description,
  children,
  footer,
  maxWidth = "2xl",
  rtl = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={`p-0 overflow-hidden border-none shadow-2xl bg-background w-full ${maxWidthClasses[maxWidth]}`}
        dir={rtl ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="px-6 py-4">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <DialogTitle
                    className={cn(
                      "text-xl font-semibold",
                      rtl ? "text-right" : "text-left"
                    )}
                  >
                    {title}
                  </DialogTitle>
                  {description && (
                    <DialogDescription
                      className={cn(
                        "text-sm text-muted-foreground",
                        rtl ? "text-right" : "text-left"
                      )}
                    >
                      {description}
                    </DialogDescription>
                  )}
                </div>
              </div>
            </DialogHeader>
          </div>
        </div>

        {/* Content */}
        <div
          className="max-h-[calc(100vh-16rem)] overflow-y-auto"
          dir={rtl ? "rtl" : "ltr"}
        >
          <div className="p-6">{children}</div>
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="sticky bottom-0 z-10 bg-background border-t"
            dir={rtl ? "rtl" : "ltr"}
          >
            <div className="px-6 py-4">
              <div className="flex justify-end gap-2">{footer}</div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
