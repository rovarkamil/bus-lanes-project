import { FieldError } from "react-hook-form";

type Namespace = "Users" | "Roles" | "Validation" | "Fields";

type TranslationFunctions = {
  [K in Namespace]?: (key: string, options?: Record<string, string>) => string;
};

export const getErrorMessage = (
  error: FieldError | undefined,
  translations: TranslationFunctions
) => {
  if (!error?.message) return "";
  try {
    const [field, key] = error.message.split("|");
    const [namespace, ...keyParts] = key.split(".");
    if (!["Users", "Roles", "Validation", "Fields"].includes(namespace)) {
      return error.message;
    }
    const translationFn = translations[namespace as Namespace];
    if (!translationFn) return error.message;
    return translationFn(keyParts.join("."), {
      field: translations.Fields?.(field) || field,
    });
  } catch {
    return error.message;
  }
};
