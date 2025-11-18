import { FC } from "react";
import { ViewFieldDefinition } from "@/types/models/common";
import { CopyableText } from "./copyable-text";
import { Badge } from "./badge";
import { formatDate } from "@/lib/formatDate";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { Check, X, ExternalLink } from "lucide-react";

interface ViewFieldProps {
  field: ViewFieldDefinition;
  value: unknown;
  t: (key: string) => string;
}

export const ViewField: FC<ViewFieldProps> = ({ field, value, t }) => {
  const Icon = field.icon;

  const renderValue = () => {
    if (field.formatValue) {
      value = field.formatValue(value);
    }

    switch (field.viewType) {
      case "text":
        return (
          <span className="font-medium">
            {t(value?.toString() || "NotProvided")}
          </span>
        );

      case "copyable":
        return value ? (
          <CopyableText text={value.toString()} />
        ) : (
          <span className="text-sm text-muted-foreground">
            {t("NotProvided")}
          </span>
        );

      case "date":
        return value ? (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(value as Date)}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            {t("NotProvided")}
          </span>
        );

      case "badge":
        return value ? (
          <Badge variant="secondary" className="font-medium">
            {t(value.toString())}
          </Badge>
        ) : null;

      case "list":
        return Array.isArray(value) && value.length > 0 ? (
          <div className="flex flex-wrap gap-1 justify-end">
            {value.map((item: unknown) => (
              <TooltipProvider key={item?.toString()}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="text-xs font-medium">
                      {t(item?.toString() || "NotProvided")}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t(`${field.label}.${item}`)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">{t("NoItems")}</span>
        );

      case "boolean":
        return value !== undefined && value !== null ? (
          <div className="flex items-center gap-2">
            {value ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )}
            <span className="font-medium">{t(value ? "Yes" : "No")}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            {t("NotProvided")}
          </span>
        );

      case "number":
        return value !== undefined && value !== null ? (
          <span className="font-medium">
            {typeof value === "number"
              ? value.toLocaleString()
              : value.toString()}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">
            {t("NotProvided")}
          </span>
        );

      case "url":
        return value ? (
          <a
            href={value.toString()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <span className="font-medium">{value.toString()}</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">
            {t("NotProvided")}
          </span>
        );

      case "color":
        return value ? (
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full border"
              style={{ backgroundColor: value.toString() }}
            />
            <span className="font-medium">{value.toString()}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            {t("NotProvided")}
          </span>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{t(field.label)}</span>
      {renderValue()}
    </div>
  );
};
