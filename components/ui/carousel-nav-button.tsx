import { LucideIcon } from "lucide-react";
import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CarouselNavButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
}

export function CarouselNavButton({
  icon: Icon,
  className,
  ...props
}: CarouselNavButtonProps) {
  return (
    <button
      className={cn(
        "pointer-events-auto h-8 w-8 rounded-full bg-[#00FFB3]/10 hover:bg-[#00FFB3] flex items-center justify-center text-[#1E1E1E] transition-colors",
        className
      )}
      {...props}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
