import { LanguageContent } from "@/types/map";

const FALLBACK_ORDER = ["en", "ar", "ckb"];

export const getLocalizedValue = (
  field?: LanguageContent | null,
  locale?: string
): string | undefined => {
  if (!field) return undefined;

  if (locale && field[locale]) {
    const localized = field[locale];
    if (localized) return localized;
  }

  for (const key of FALLBACK_ORDER) {
    const value = field[key];
    if (value) return value;
  }

  const firstValue = Object.values(field).find(Boolean);
  return firstValue ?? undefined;
};

