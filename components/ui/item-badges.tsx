"use client";

import { Badge } from "@/components/ui/badge";

interface ItemBadgesProps {
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isOnSale?: boolean;
  isStaffPick?: boolean;
  className?: string;
}

export function ItemBadges({
  isBestSeller,
  isNewArrival,
  isOnSale,
  isStaffPick,
  className,
}: ItemBadgesProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className || ""}`}>
      {isBestSeller && (
        <Badge
          variant="secondary"
          className="bg-yellow-500/20 text-yellow-500"
        >
          Best Seller
        </Badge>
      )}
      {isNewArrival && (
        <Badge
          variant="secondary"
          className="bg-blue-500/20 text-blue-500"
        >
          New Arrival
        </Badge>
      )}
      {isOnSale && (
        <Badge 
          variant="secondary" 
          className="bg-red-500/20 text-red-500"
        >
          On Sale
        </Badge>
      )}
      {isStaffPick && (
        <Badge
          variant="secondary"
          className="bg-purple-500/20 text-purple-500"
        >
          Staff Pick
        </Badge>
      )}
    </div>
  );
} 