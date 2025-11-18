import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

export function SectionHeader({
  title,
  subtitle,
  className,
  titleClassName,
  subtitleClassName,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-12", className)}>
      <div className="relative border-l-4 border-[#00FFB3] p-4 md:p-8">
        <h2
          className={cn(
            "text-2xl md:text-3xl font-semibold text-[#67758D]",
            titleClassName
          )}
        >
          {title}
        </h2>

        {subtitle && (
          <p
            className={cn(
              "mt-4 text-gray-600 max-w-2xl text-base md:text-lg",
              "opacity-90 leading-relaxed",
              subtitleClassName
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
