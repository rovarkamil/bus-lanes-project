import * as React from "react";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/client";

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => {
  const { i18n } = useTranslation("Common");
  const isRTL = i18n.language !== "en";
  return (
    <div className="relative w-full overflow-auto rounded-xl">
      <table
        dir={isRTL ? "rtl" : "ltr"}
        ref={ref}
        className={cn(
          "w-full caption-bottom text-sm whitespace-nowrap",
          className
        )}
        {...props}
      />
    </div>
  );
});

Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "group border-b transition-colors [&:nth-child(even)]:hover:bg-primary/10 [&:nth-child(odd)]:hover:bg-primary/10 data-[state=selected]:bg-muted border-border/5 cursor-default [&:nth-child(even)]:bg-muted/10 [&:nth-child(odd)]:bg-card",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const { i18n } = useTranslation("Common");
  const isRTL = i18n.language !== "en";
  return (
    <th
      ref={ref}
      className={cn(
        "px-2 align-middle h-10 font-semibold text-white [&:has([role=checkbox])]:pr-0 bg-tableHeader",
        className,
        isRTL ? "text-right" : "text-left"
      )}
      {...props}
    />
  );
});

TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const { i18n } = useTranslation("Common");
  const isRTL = i18n.language !== "en";
  return (
    <td
      ref={ref}
      className={cn(
        "p-2 [&:has([role=checkbox])]:pr-0",
        className,
        isRTL ? "text-right" : "text-left"
      )}
      {...props}
    />
  );
});
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
