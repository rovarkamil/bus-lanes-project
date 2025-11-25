export type MapBaseStyle = "minimal" | "topographic" | "street" | "detailed";

interface MapTileStyle {
  id: MapBaseStyle;
  label: string;
  description: string;
  url: string;
  attribution: string;
  previewImage: string;
}

export const MAP_TILE_STYLES: Record<MapBaseStyle, MapTileStyle> = {
  minimal: {
    id: "minimal",
    label: "Minimal",
    description: "Soft gray basemap without street labels",
    url: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    previewImage: "/map/styles/minimal.png",
  },
  topographic: {
    id: "topographic",
    label: "Topographic",
    description: "Esri World Topo Map with gentle relief shading",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community",
    previewImage: "/map/styles/topographic.png",
  },
  street: {
    id: "street",
    label: "Street",
    description: "Esri World Street Map for higher contrast road details",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
    previewImage: "/map/styles/street.png",
  },
  detailed: {
    id: "detailed",
    label: "Detailed",
    description: "Standard OpenStreetMap tiles (includes labels)",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    previewImage: "/map/styles/detailed.png",
  },
};

export const DEFAULT_MAP_STYLE: MapBaseStyle = "minimal";
