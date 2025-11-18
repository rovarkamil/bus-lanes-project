import { FC, ReactNode } from "react";
import { useTranslation } from "@/i18n/client";
import { cn } from "@/lib/utils";

export interface FormSectionProps {
  title: string;
  children: ReactNode;
  hasError?: boolean;
}

export const FormSection: FC<FormSectionProps> = ({
  title,
  children,
  hasError,
}) => {
  const { t, i18n } = useTranslation("Common");
  const isRTL = i18n.language !== "en";

  return (
    <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      <h3
        className={cn(
          "text-sm font-medium",
          hasError ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {t(title)}
      </h3>
      <div className="gap-4">{children}</div>
    </div>
  );
};
