// This is an example of how to create a hook for a model.
// It is not a complete hook and should be used as a reference to create a new hook.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

"use client";

import {
  NewsFilterParams,
  NewsWithRelations,
  newsFieldConfigs,
  CreateNewsData,
  DeleteNewsData,
} from "@/types/models/news";
import { createQueryHook, createMutationHook } from "@/utils/createHook";
import { ApiResponse, PaginatedResponse } from "@/types/models/common";
import { LanguageFields } from "@/utils/language-handler";

interface NewsDataWithFiles extends CreateNewsData {
  titleFields: LanguageFields;
  descriptionFields?: LanguageFields;
  thumbnail: {
    url: string;
    type?: string | null;
    name?: string | null;
    size?: number | null;
  };
  images?: Array<{
    url: string;
    type?: string | null;
    name?: string | null;
    size?: number | null;
  }>;
}

interface NewsUpdateDataWithFiles {
  id: string;
  date: Date;
  isActive?: boolean;
  isHighlighted?: boolean;
  slug?: string | null;
  titleFields?: LanguageFields;
  descriptionFields?: LanguageFields;
  thumbnail?: {
    url: string;
    type?: string | null;
    name?: string | null;
    size?: number | null;
  };
  images?: Array<{
    url: string;
    type?: string | null;
    name?: string | null;
    size?: number | null;
  }>;
  titleId: string;
  descriptionId?: string;
  newsCategoryId?: string | null;
  exhibitionId?: string | null;
}

type FetchNewsParams = Record<string, unknown> & {
  page?: number;
  limit?: number;
  search?: string;
  language?: string;
} & NewsFilterParams;

export const useFetchNews = createQueryHook<
  PaginatedResponse<NewsWithRelations>,
  FetchNewsParams
>({
  queryKey: ["employee-news"],
  url: "/api/employee/news",
  options: {
    fieldConfigs: newsFieldConfigs,
  },
});

export const useCreateNews = createMutationHook<
  ApiResponse<NewsWithRelations>,
  NewsDataWithFiles
>({
  method: "POST",
  url: "/api/employee/news",
});

export const useUpdateNews = createMutationHook<
  ApiResponse<NewsWithRelations>,
  NewsUpdateDataWithFiles
>({
  method: "PUT",
  url: "/api/employee/news",
});

export const useDeleteNews = createMutationHook<
  ApiResponse<NewsWithRelations>,
  DeleteNewsData
>({
  method: "DELETE",
  url: "/api/employee/news",
});
