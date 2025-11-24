import { FC } from "react";
import { Button } from "./ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useTranslation } from "@/i18n/client";
import { cn } from "@/lib/utils";

export const Pagination: FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}> = ({ currentPage, totalPages, onPageChange, isLoading }) => {
  const { i18n } = useTranslation("Common");
  const isRTL = i18n.language !== "en";

  const getPageRange = () => {
    const isMobileViewport =
      typeof window !== "undefined" ? window.innerWidth < 640 : false;
    const delta = isMobileViewport ? 1 : 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <section className="w-full flex flex-col justify-end items-end">
      <div
        className={cn(
          "flex justify-center items-center gap-1 sm:gap-2",
          isRTL && "flex-row-reverse"
        )}
      >
        {totalPages > 1 && (
          <>
            <Button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              variant="outline"
              size="icon"
              className="hidden sm:inline-flex h-8 w-8"
            >
              {isRTL ? (
                <ChevronsLeft className="h-4 w-4" />
              ) : (
                <ChevronsLeft className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              variant="outline"
              size="icon"
              className="h-8 w-8"
            >
              {isRTL ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </>
        )}
        {getPageRange().map((page, index) => {
          if (page === "...") {
            return (
              <span key={`ellipsis-${index}`} className="px-1 sm:px-2">
                ...
              </span>
            );
          }
          const pageNumber = page as number;
          const isCurrentPage = currentPage === pageNumber;
          return (
            <Button
              key={pageNumber}
              onClick={() => onPageChange(pageNumber)}
              disabled={isCurrentPage || isLoading}
              variant={isCurrentPage ? "default" : "outline"}
              className={`h-8 w-8 border-0 font-bold ease-in-out transform ${
                isCurrentPage ? "bg-primary" : ""
              }`}
              size="icon"
            >
              {pageNumber}
            </Button>
          );
        })}
        {totalPages > 1 && (
          <>
            <Button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              variant="outline"
              size="icon"
              className="h-8 w-8"
            >
              {isRTL ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="icon"
              className="hidden sm:inline-flex h-8 w-8"
            >
              {isRTL ? (
                <ChevronsRight className="h-4 w-4" />
              ) : (
                <ChevronsRight className="h-4 w-4" />
              )}
            </Button>
          </>
        )}
      </div>
    </section>
  );
};
