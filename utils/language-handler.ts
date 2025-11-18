/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";

export type LanguageFields = {
  en: string;
  ar: string | null;
  ckb: string | null;
};

// Generic type for language field names
export type LanguageFieldName = 'titleFields' | 'nameFields' | 'descriptionFields';
export type LanguageIdName = 'titleId' | 'nameId' | 'descriptionId';

// Map field names to their corresponding ID properties
const FIELD_TO_ID_MAP: Record<LanguageFieldName, LanguageIdName> = {
  titleFields: 'titleId',
  nameFields: 'nameId',
  descriptionFields: 'descriptionId',
};

// Map ID properties to their corresponding field names
const ID_TO_FIELD_MAP: Record<LanguageIdName, LanguageFieldName> = {
  titleId: 'titleFields',
  nameId: 'nameFields',
  descriptionId: 'descriptionFields',
};

export type WithLanguageFields<T extends object> = Omit<
  T,
  LanguageIdName
> & {
  [K in LanguageFieldName]?: LanguageFields;
};

export type WithLanguageIds = {
  [K in LanguageIdName]?: string;
};

type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

type PrismaModel = {
  update: (args: {
    where: { id: string };
    data: Record<string, any>;
  }) => Promise<unknown>;
};

// Fix the mapped type error by separating the interfaces
export interface BaseUpdateLanguageData {
  id: string;
  [key: string]: unknown;
}

export type UpdateLanguageData = BaseUpdateLanguageData & 
  Partial<Record<LanguageIdName, string>> & 
  Partial<Record<LanguageFieldName, LanguageFields>>;

async function handleLanguageFields(
  fields: LanguageFields | undefined,
  existingId: string | null,
  prisma: PrismaClient | PrismaTransactionClient
): Promise<string | null> {
  if (!fields) return existingId;

  const hasContent = Object.values(fields).some((field) => field?.trim?.());
  if (!hasContent) return null;

  if (existingId) {
    const existing = await prisma.language.findUnique({
      where: { id: existingId },
    });
    if (existing) {
      await prisma.language.update({
        where: { id: existingId },
        data: {
          en: fields.en || existing.en,
          ar: fields.ar !== undefined ? fields.ar : existing.ar,
          ckb: fields.ckb !== undefined ? fields.ckb : existing.ckb,
        },
      });
      return existingId;
    }
  }

  const newLanguage = await prisma.language.create({
    data: fields,
  });
  return newLanguage.id;
}

/**
 * Find the primary language field (title or name) and its corresponding ID field
 */
function findPrimaryLanguageField(data: Record<string, any>): {
  fieldName: LanguageFieldName | null;
  idName: LanguageIdName | null;
  fields: LanguageFields | null;
} {
  // Check for title first, then name as fallback
  if (data.titleFields) {
    return { fieldName: 'titleFields', idName: 'titleId', fields: data.titleFields };
  }
  
  if (data.nameFields) {
    return { fieldName: 'nameFields', idName: 'nameId', fields: data.nameFields };
  }
  
  return { fieldName: null, idName: null, fields: null };
}

export async function handleLanguageCreation<T extends object>(
  data: WithLanguageFields<T>,
  prisma: PrismaClient | PrismaTransactionClient
): Promise<T & Record<string, any>> {
  // Extract all language fields - using destructuring but ignoring the unused variables
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { titleFields: _, nameFields: __, descriptionFields, ...restData } = data;
  
  // Find the primary field (title or name)
  const { fieldName: primaryFieldName, idName: primaryIdName, fields: primaryFields } = 
    findPrimaryLanguageField(data);

  if (!primaryFields || !primaryFieldName || !primaryIdName) {
    throw new Error("Title or name fields are required for creation");
  }

  const primaryId = await handleLanguageFields(primaryFields, null, prisma);
  if (!primaryId) {
    throw new Error(`Failed to create ${primaryFieldName}`);
  }

  const descriptionId = await handleLanguageFields(
    descriptionFields,
    null,
    prisma
  );

  // Return result with appropriate ID fields
  const result = {
    ...(restData as T),
    descriptionId,
  } as T & Record<string, any>;
  
  // Fix the indexing error by using a type assertion
  (result as any)[primaryIdName] = primaryId;

  return result;
}

export async function handleLanguageUpdate<T extends UpdateLanguageData>(
  data: T & { model: string },
  prisma: PrismaClient | PrismaTransactionClient
): Promise<Omit<T, "model"> & Record<string, any>> {
  const { id, model, ...restData } = data;
  
  // Extract all language fields and IDs
  const languageFields = {} as Record<LanguageFieldName, LanguageFields | undefined>;
  const languageIds = {} as Record<LanguageIdName, string | undefined>;
  
  // Separate language fields and IDs from other data
  const otherData = { ...restData };
  
  // Extract language fields
  (Object.keys(FIELD_TO_ID_MAP) as LanguageFieldName[]).forEach(fieldName => {
    if (fieldName in data) {
      languageFields[fieldName] = data[fieldName] as LanguageFields;
      delete otherData[fieldName];
    }
  });
  
  // Extract language IDs
  (Object.keys(ID_TO_FIELD_MAP) as LanguageIdName[]).forEach(idName => {
    if (idName in data) {
      languageIds[idName] = data[idName] as string;
      delete otherData[idName];
    }
  });
  
  // If no language fields to update, return original data
  if (Object.values(languageFields).every(field => !field)) {
    return data;
  }

  // Process each language field
  const updatedIds: Record<string, string | null> = {};
  const modelUpdates: Record<string, any> = {};
  
  // Handle each language field
  for (const fieldName of Object.keys(languageFields) as LanguageFieldName[]) {
    const fields = languageFields[fieldName];
    if (!fields) continue;
    
    const idName = FIELD_TO_ID_MAP[fieldName];
    const existingId = languageIds[idName];
    
    if (existingId) {
      const newId = await handleLanguageFields(fields, existingId, prisma);
      updatedIds[idName] = newId;
      
      // If ID changed, we need to update the model
      if (newId !== existingId) {
        modelUpdates[idName] = newId;
      }
    }
  }
  
  // If we have model updates, apply them
  if (Object.keys(modelUpdates).length > 0) {
    const modelClient = (prisma as unknown as Record<string, PrismaModel>)[model];
    await modelClient.update({
      where: { id },
      data: modelUpdates,
    });
  }

  // Prepare result
  return {
    id,
    ...otherData,
    ...updatedIds,
  } as Omit<T, "model"> & Record<string, any>;
}
