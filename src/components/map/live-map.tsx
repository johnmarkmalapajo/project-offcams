"use client";
import dynamic from "next/dynamic";
import type { MapProps } from "./types";

const Loading = () => <div className="grid h-full w-full place-items-center bg-muted animate-pulse text-sm text-muted-foreground">Loading map…</div>;
const HAS_MAPBOX = !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const Impl = HAS_MAPBOX
  ? dynamic(() => import("./mapbox-impl"), { ssr: false, loading: Loading })
  : dynamic(() => import("./maplibre-impl"), { ssr: false, loading: Loading });

export function LiveMap(props: MapProps) {
  return (
    <div className="relative h-full w-full">
      <Impl {...props} className="h-full w-full" />
      {!HAS_MAPBOX && (
        <div className="absolute bottom-2 left-2 rounded-md border bg-card/95 px-2 py-1 text-[11px] text-muted-foreground shadow-sm">
          Preview basemap. Add <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to switch to Mapbox.
        </div>
      )}
    </div>
  );
}
export type { MapPoint } from "./types";
