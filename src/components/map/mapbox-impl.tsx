"use client";
import { Map, Marker, Popup, NavigationControl, FullscreenControl } from "react-map-gl/mapbox";
import { makeMap } from "./make-map";
export default makeMap({ Map, Marker, Popup, NavigationControl, FullscreenControl }, {
  mapStyle: "mapbox://styles/mapbox/streets-v12",
  mapboxAccessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
});
