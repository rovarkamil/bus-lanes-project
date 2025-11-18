import { useTranslation } from "@/i18n/client";
import { BaseError } from "@/types/models/common";
import { CustomErrorHandler } from "./custom-error-handler";

type TranslationFunction = (
  key: string,
  options?: Record<string, string>
) => string;

// Standalone translation function that doesn't rely on hooks
export function translateErrorMessage(
  messageKey: string,
  t?: TranslationFunction
): string {
  if (!t) return messageKey;

  // Split the message into namespace and key parts
  const [namespace, ...keyParts] = messageKey.split(".");
  const key = keyParts.join(".");

  // Translate the message using the namespace and key
  return t(key, {
    ns: namespace,
    defaultValue: messageKey,
  });
}

// React hook for components that need to translate errors
export function useErrorTranslation() {
  const { t } = useTranslation("");

  const translateError = (error: BaseError | CustomErrorHandler): string => {
    if (error instanceof CustomErrorHandler) {
      if (error.name === "UniqueConstraintError" && error.field) {
        // Get the translated field name from Fields.json
        const fieldName = t(`Fields.${error.field}`, {
          ns: "Fields",
        }).toLowerCase();
        // Use the translated field name in the validation message
        return t(`Fields.Validation.AlreadyExists`, {
          ns: "Fields",
          field: fieldName,
        });
      }

      // For other custom errors, use the namespace and key
      return t(error.key, {
        ns: error.namespace,
        defaultValue: error.message,
      });
    }

    // For base errors, use the existing translation logic
    return error.getTranslatedMessage(t);
  };

  return {
    translateError,
  };
}
