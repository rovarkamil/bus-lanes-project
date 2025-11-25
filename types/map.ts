export type CoordinateTuple = [number, number];

export interface LanguageContent {
  en?: string | null;
  ar?: string | null;
  ckb?: string | null;
  [key: string]: string | null | undefined;
}

export interface MapAsset {
  id: string;
  url: string;
  name?: string | null;
  type?: string | null;
  size?: number | null;
}

export interface MapIconData {
  id: string;
  fileUrl: string;
  iconSize?: number | null;
  iconAnchorX?: number | null;
  iconAnchorY?: number | null;
  popupAnchorX?: number | null;
  popupAnchorY?: number | null;
}

export interface MapTransportService {
  id: string;
  type: string;
  color?: string | null;
  name?: LanguageContent | null;
  isActive?: boolean;
  icon?: MapIconData | null;
}

export interface MapZone {
  id: string;
  name?: LanguageContent | null;
  color?: string | null;
  polygon?: CoordinateTuple[];
  isActive?: boolean;
}

export interface MapLaneSummary {
  id: string;
  name?: LanguageContent | null;
  color?: string | null;
  serviceId?: string | null;
  service?: MapTransportService | null;
}

export interface MapLane extends MapLaneSummary {
  path: CoordinateTuple[];
  weight?: number | null;
  opacity?: number | null;
  isActive?: boolean;
}

export interface MapRouteSummary {
  id: string;
  name?: LanguageContent | null;
  routeNumber?: string | null;
  color?: string | null;
  direction?: string | null;
  serviceId?: string | null;
  service?: MapTransportService | null;
}

export interface MapRoute extends MapRouteSummary {
  path?: CoordinateTuple[];
  stopIds?: string[];
  laneIds?: string[];
  isActive?: boolean;
}

export interface MapStopAmenities {
  hasShelter?: boolean;
  hasBench?: boolean;
  hasLighting?: boolean;
  isAccessible?: boolean;
  hasRealTimeInfo?: boolean;
}

export interface MapStop {
  id: string;
  latitude: number;
  longitude: number;
  name?: LanguageContent | null;
  description?: LanguageContent | null;
  images?: MapAsset[];
  icon?: MapIconData | null;
  zone?: MapZone | null;
  services?: MapTransportService[];
  serviceIds?: string[];
  lanes?: MapLaneSummary[];
  routes?: MapRouteSummary[];
  amenities?: MapStopAmenities;
  isActive?: boolean;
}

export interface MapDataPayload {
  stops: MapStop[];
  lanes: MapLane[];
  routes: MapRoute[];
  services: MapTransportService[];
  zones?: MapZone[];
}

export interface MapFocusPoint {
  position: CoordinateTuple;
  zoom?: number;
  token: number;
}