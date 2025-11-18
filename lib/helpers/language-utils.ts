import { LanguageFields } from "@/utils/language-handler";

type MaybeLanguageFields =
  | {
      en: string;
      ar?: string | null;
      ckb?: string | null;
    }
  | null
  | undefined;

type LanguageFieldKey = "nameFields" | "descriptionFields" | "titleFields";

type LanguageAware<T> = T &
  Partial<Record<LanguageFieldKey, MaybeLanguageFields>>;

export function normalizeLanguageFields<
  T extends object,
  K extends readonly LanguageFieldKey[],
>(payload: T, fields: K): T & Partial<Record<K[number], LanguageFields>> {
  const result: LanguageAware<T> = { ...(payload as LanguageAware<T>) };

  fields.forEach((fieldName) => {
    const value = (payload as LanguageAware<T>)[fieldName];
    if (value) {
      (result as Record<LanguageFieldKey, LanguageFields | undefined>)[
        fieldName
      ] = normalizeField(value);
    }
  });

  return result as T & Partial<Record<K[number], LanguageFields>>;
}

function normalizeField(
  field: MaybeLanguageFields
): LanguageFields | undefined {
  if (!field) return undefined;
  return {
    en: field.en,
    ar: field.ar ?? null,
    ckb: field.ckb ?? null,
  };
}
