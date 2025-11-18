import { FC } from "react";
import { useTranslation } from "@/i18n/client";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  className?: string;
}

export const StatCard: FC<StatCardProps> = ({
  icon,
  title,
  value,
  className,
}) => {
  const { i18n } = useTranslation("Common");
  const isRTL = i18n.language !== "en";

  return (
    <div
      className={cn("p-4 rounded-lg border bg-card flex flex-col", className)}
    >
      <div
        className={cn(
          "flex items-center gap-2 text-muted-foreground",
          isRTL && "flex-row-reverse"
        )}
      >
        {icon}
        <p className="text-sm font-medium">{title}</p>
      </div>
      <p className="text-2xl font-bold mt-2 text-center">{value}</p>
    </div>
  );
};
