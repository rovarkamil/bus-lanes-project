// This is an example of how to create a route for a model.
// It is not a complete route and should be used as a reference to create a new route.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { Permission, PrismaClient } from "@prisma/client";
import { createEmployeeModelRoutes } from "@/utils/createModelRoutes";
import {
  gallerySchema,
  createGallerySchema,
  updateGallerySchema,
  galleryFieldConfigs,
  CreateGalleryData,
} from "@/types/models/gallery";
import {
  handleLanguageCreation,
  handleLanguageUpdate,
  LanguageFields,
} from "@/utils/language-handler";
import { handleFilesCreation } from "@/utils/file-handler";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import { v4 as uuidv4 } from 'uuid';

type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

interface FileData {
  id?: string;
  url: string;
  type: string;
  name: string;
  size: number;
  isExisting?: boolean;
}

interface GalleryDataWithFiles extends CreateGalleryData {
  titleFields: LanguageFields;
  descriptionFields?: LanguageFields;
  images: FileData[];
}

interface GalleryUpdateDataWithFiles {
  id: string;
  titleFields?: LanguageFields;
  descriptionFields?: LanguageFields;
  images?: FileData[];
  titleId: string;
  descriptionId?: string | null;
  category?: string;
}

const deleteSchema = gallerySchema.pick({ id: true });

export const { GET, POST, PUT, DELETE } = createEmployeeModelRoutes({
  modelName: "gallery",
  schema: gallerySchema,
  createSchema: createGallerySchema,
  updateSchema: updateGallerySchema,
  deleteSchema,
  permissions: {
    view: Permission.VIEW_GALLERY,
    create: Permission.CREATE_GALLERY,
    update: Permission.UPDATE_GALLERY,
    delete: Permission.DELETE_GALLERY,
  },
  fieldConfigs: galleryFieldConfigs,
  relations: {
    title: {
      select: { id: true, en: true, ar: true, ckb: true },
    },
    description: {
      select: { id: true, en: true, ar: true, ckb: true },
    },
    images: {
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    },
  },
  defaultSort: { field: "createdAt", order: "desc" },
  hooks: {
    beforeCreate: async ({
      data,
      prisma,
    }: {
      data: GalleryDataWithFiles;
      prisma: PrismaTransactionClient;
    }) => {
      const session = await getServerSession(authOptions);
      
      // Handle language creation
      const withLanguages = await handleLanguageCreation(data, prisma);
      
      // Handle multiple images
      let imageIds: string[] = [];
      if (data.images && data.images.length > 0) {
        const files = await handleFilesCreation(
          data.images.map(image => ({
            id: uuidv4(),
            url: image.url,
            type: image.type || 'unknown',
            name: image.name || 'untitled',
            size: image.size || 0,
            uploadedById: session?.user.id || null,
          })),
          prisma
        );
        imageIds = files.map(file => file.id);
      }

      // Add all relations
      return {
        category: data.category,
        title: {
          connect: { id: withLanguages.titleId },
        },
        description: withLanguages.descriptionId
          ? {
              connect: { id: withLanguages.descriptionId },
            }
          : undefined,
        images: imageIds.length > 0
          ? {
              connect: imageIds.map(id => ({ id })),
            }
          : undefined,
      };
    },
    beforeUpdate: async ({
      data,
      prisma,
    }: {
      data: GalleryUpdateDataWithFiles;
      prisma: PrismaTransactionClient;
    }) => {
      const session = await getServerSession(authOptions);

      // Handle language updates
      const { descriptionId, ...restData } = data;
      const languageUpdateData = {
        ...restData,
        model: "gallery",
        ...(typeof descriptionId === 'string' ? { descriptionId } : {})
      };
      await handleLanguageUpdate(languageUpdateData, prisma);

      // Handle images update
      let imagesUpdate = {};
      if (data.images) {
        const newImages = data.images.filter(img => !img.isExisting);
        if (newImages.length > 0) {
          const files = await handleFilesCreation(
            newImages.map(image => ({
              id: uuidv4(),
              url: image.url,
              type: image.type || 'unknown',
              name: image.name || 'untitled',
              size: image.size || 0,
              uploadedById: session?.user.id || null,
            })),
            prisma
          );
          
          const existingImageIds = data.images
            .filter(img => img.isExisting && img.id)
            .map(img => ({ id: img.id! }));

          imagesUpdate = {
            images: {
              set: [],
              connect: [...existingImageIds, ...files.map(file => ({ id: file.id }))],
            },
          };
        }
      }

      // Return final update data
      return {
        category: data.category,
        ...imagesUpdate,
      };
    },
  },
});

