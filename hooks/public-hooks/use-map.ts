"use client";

import { createQueryHook } from "@/utils/createHook";
import { ApiResponse } from "@/types/models/common";
import { MapDataPayload } from "@/types/map";

type MapQueryParams = {
  enabled?: boolean;
};

export const useMapData = createQueryHook<
  ApiResponse<MapDataPayload>,
  MapQueryParams
>({
  queryKey: ["public-map-data"],
  url: "/api/map",
});
