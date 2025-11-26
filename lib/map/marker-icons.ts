import L, { Icon } from "leaflet";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const STOP_ICON_URL = "/markers/stop-sign.png";
const DEFAULT_MARKER_URL = "/markers/marker.png";

const withFallback = (factory: () => Icon): Icon => {
  try {
    return factory();
  } catch (error) {
    console.warn("[marker-icons] Falling back to Leaflet default icon.", error);
    return L.icon({
      iconUrl: DEFAULT_MARKER_URL,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [1, -34],
      shadowUrl,
      shadowSize: [41, 41],
      shadowAnchor: [12, 41],
    });
  }
};

export const createStopMarkerIcon = (): Icon | undefined => {
  if (typeof window === "undefined") return undefined;
  return withFallback(() =>
    L.icon({
      iconUrl: STOP_ICON_URL,
      iconSize: [44, 44],
      iconAnchor: [22, 44],
      popupAnchor: [0, -36],
      tooltipAnchor: [0, -36],
    })
  );
};

export const createDefaultMarkerIcon = (): Icon | undefined => {
  if (typeof window === "undefined") return undefined;
  return withFallback(() =>
    L.icon({
      iconUrl: DEFAULT_MARKER_URL,
      iconSize: [34, 46],
      iconAnchor: [17, 46],
      popupAnchor: [0, -40],
      tooltipAnchor: [0, -40],
      shadowUrl,
      shadowSize: [52, 52],
      shadowAnchor: [17, 46],
    })
  );
};
