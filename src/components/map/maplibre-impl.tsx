"use client";
import { Map, Marker, Popup, NavigationControl, FullscreenControl } from "react-map-gl/maplibre";
import { makeMap } from "./make-map";
// Fallback used only when no Mapbox token is configured (free CARTO basemap).
export default makeMap({ Map, Marker, Popup, NavigationControl, FullscreenControl }, {
  mapStyle: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
});
