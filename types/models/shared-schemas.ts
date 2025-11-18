import { z } from "zod";

export const languageFieldsSchema = z.object({
  en: z
    .string()
    .min(1, "NameEn|Validation.Errors.Required")
    .max(255, "NameEn|Validation.Errors.TooLong"),
  ar: z
    .string()
    .max(255, "NameAr|Validation.Errors.TooLong")
    .nullable()
    .optional(),
  ckb: z
    .string()
    .max(255, "NameCkb|Validation.Errors.TooLong")
    .nullable()
    .optional(),
});

export const optionalLanguageFieldsSchema = languageFieldsSchema
  .partial()
  .refine((value) => !!value?.en, {
    message: "Language|Validation.Errors.MinRequired",
    path: ["en"],
  })
  .optional();

export const descriptionFieldsSchema = z
  .object({
    en: z.string().max(1024, "Description|Validation.Errors.TooLong"),
    ar: z.string().max(1024).nullable().optional(),
    ckb: z.string().max(1024).nullable().optional(),
  })
  .partial();

export const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, "Color|Validation.Errors.InvalidHex");

export const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time|Validation.Errors.InvalidFormat");

export const coordinatePairSchema = z.tuple([
  z
    .number({
      invalid_type_error: "Latitude|Validation.Errors.Number",
    })
    .min(-90, "Latitude|Validation.Errors.Min")
    .max(90, "Latitude|Validation.Errors.Max"),
  z
    .number({
      invalid_type_error: "Longitude|Validation.Errors.Number",
    })
    .min(-180, "Longitude|Validation.Errors.Min")
    .max(180, "Longitude|Validation.Errors.Max"),
]);

export const pathSchema = z
  .array(coordinatePairSchema)
  .min(2, "Path|Validation.Errors.MinCoordinates");

export const positiveIntSchema = z
  .number()
  .int("Number|Validation.Errors.Integer")
  .nonnegative("Number|Validation.Errors.NonNegative");

export const percentageSchema = z
  .number()
  .min(0, "Percentage|Validation.Errors.Min")
  .max(1, "Percentage|Validation.Errors.Max");

export const uuidSchema = z.string().uuid("Id|Validation.Errors.InvalidUuid");

export const languageSelect = {
  id: true,
  en: true,
  ar: true,
  ckb: true,
} as const;
