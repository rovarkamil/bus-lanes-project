import { Star, StarHalf } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function RatingStars({ rating, size = "md" }: RatingStarsProps) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const sizeClass = sizeClasses[size];

  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <Star
        key={`full-${i}`}
        className={`${sizeClass} fill-[#00FFB3] text-[#00FFB3]`}
      />
    );
  }

  // Add half star if needed
  if (hasHalfStar) {
    stars.push(
      <StarHalf
        key="half"
        className={`${sizeClass} fill-[#00FFB3] text-[#00FFB3]`}
      />
    );
  }

  // Add empty stars
  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <Star key={`empty-${i}`} className={`${sizeClass} text-gray-500`} />
    );
  }

  return <div className="flex items-center gap-1">{stars}</div>;
}
