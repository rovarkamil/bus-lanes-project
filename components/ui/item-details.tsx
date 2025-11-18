"use client";

import { RatingStars } from "@/components/ui/rating-stars";
import { ItemBadges } from "@/components/ui/item-badges";

const RATING_MAP = {
  ZERO: 0,
  HALF: 0.5,
  ONE: 1,
  ONE_HALF: 1.5,
  TWO: 2,
  TWO_HALF: 2.5,
  THREE: 3,
  THREE_HALF: 3.5,
  FOUR: 4,
  FOUR_HALF: 4.5,
  FIVE: 5,
} as const;

export interface ItemDetailsProps {
  name: string;
  kurdishName?: string | null;
  arabicName?: string | null;
  description?: string | null;
  rating?: keyof typeof RATING_MAP;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isOnSale?: boolean;
  isStaffPick?: boolean;
  className?: string;
}

export function ItemDetails({
  name,
  kurdishName,
  arabicName,
  description,
  rating,
  isBestSeller,
  isNewArrival,
  isOnSale,
  isStaffPick,
  className,
}: ItemDetailsProps) {
  return (
    <div className={`space-y-4 ${className || ""}`}>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{name}</h1>
        {kurdishName && (
          <h2 className="text-xl text-muted-foreground">{kurdishName}</h2>
        )}
        {arabicName && (
          <h2 className="text-xl text-muted-foreground">{arabicName}</h2>
        )}
      </div>

      <div className="flex items-center gap-4">
        {rating && <RatingStars rating={RATING_MAP[rating]} />}
        <ItemBadges
          isBestSeller={isBestSeller}
          isNewArrival={isNewArrival}
          isOnSale={isOnSale}
          isStaffPick={isStaffPick}
        />
      </div>

      {description && (
        <p className="text-muted-foreground text-lg">{description}</p>
      )}
    </div>
  );
}
