"use client";

import { createQueryHook } from "@/utils/createHook";
import { ApiResponse } from "@/types/models/common";
import { MapDataPayload } from "@/types/map";

type MapEditorQueryParams = {
  enabled?: boolean;
  includeInactive?: boolean;
};

export const useMapEditorData = createQueryHook<
  ApiResponse<MapDataPayload>,
  MapEditorQueryParams
>({
  queryKey: ["employee-map-data"],
  url: "/api/map",
});
