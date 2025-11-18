import { Prisma } from "@prisma/client";

export interface SortOptions {
  sortBy?: string;
  sortOrder?: Prisma.SortOrder;
  select?: {
    [key: string]: boolean;
  };
}
