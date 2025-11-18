import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/client";

interface ActionProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  primaryAction?: ActionProps;
  secondaryAction?: ActionProps;
  actions?: React.ReactNode;
  className?: string;
  translationNamespace?: string;
}

export function PageHeader({
  title,
  description,
  primaryAction,
  secondaryAction,
  actions,
  className,
  translationNamespace,
}: PageHeaderProps) {
  const { t } = useTranslation(translationNamespace || "common");

  return (
    // eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding
    <div className={cn("flex justify-between items-center gap-2", className)}>
      <div>
        <h1 className="text-lg md:text-3xl font-bold tracking-tight">
          {t(title)}
        </h1>
        {description && (
          <p className="text-muted-foreground text-xs md:text-base">
            {t(description)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {secondaryAction && (
          <Button
            variant="outline"
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
          >
            {t(secondaryAction.label)}
          </Button>
        )}
        {primaryAction && (
          <Button
            variant="secondary"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
          >
            {t(primaryAction.label)}
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
}
