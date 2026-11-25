"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { motion } from "framer-motion";
import type { MapProps } from "./types";

type Lib = { Map: any; Marker: any; Popup: any; NavigationControl: any; FullscreenControl: any };

export function makeMap(lib: Lib, opts: { mapStyle: string; mapboxAccessToken?: string }) {
  const { Map, Marker, Popup, NavigationControl, FullscreenControl } = lib;
  return function LiveMapImpl({ points, selectedId, onSelect, className }: MapProps) {
    const ref = React.useRef<any>(null);
    const sel = points.find((p) => p.id === selectedId) ?? null;
    const fitted = React.useRef(false);

    const fit = React.useCallback(() => {
      const m = ref.current?.getMap?.() ?? ref.current;
      if (!m || !points.length) return;
      const lats = points.map((p) => p.lat), lngs = points.map((p) => p.lng);
      m.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 60, maxZoom: 13, duration: 1200 });
    }, [points]);

    React.useEffect(() => { if (!fitted.current && points.length && ref.current) { fitted.current = true; fit(); } }, [points, fit]);
    React.useEffect(() => {
      if (sel && ref.current) ref.current.flyTo({ center: [sel.lng, sel.lat], zoom: Math.max(ref.current.getZoom(), 12), duration: 1000 });
    }, [sel]);

    return (
      <div className={className}>
        <Map ref={ref} mapboxAccessToken={opts.mapboxAccessToken} mapStyle={opts.mapStyle}
          initialViewState={{ longitude: 122.5, latitude: 11.5, zoom: 4.6 }} style={{ width: "100%", height: "100%" }}
          onLoad={fit} onClick={() => onSelect?.(null)}>
          <NavigationControl position="top-right" />
          <FullscreenControl position="top-right" />
          {points.map((p, i) => (
            <Marker key={p.id} longitude={p.lng} latitude={p.lat} anchor="bottom"
              onClick={(e: any) => { e.originalEvent.stopPropagation(); onSelect?.(p.id); }}>
              <motion.button initial={{ y: -40, opacity: 0, scale: 0.4 }} animate={{ y: 0, opacity: 1, scale: p.id === selectedId ? 1.25 : 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 14, delay: Math.min(i * 0.04, 1) }}
                whileHover={{ scale: 1.2 }} className="relative flex flex-col items-center cursor-pointer" title={p.title}>
                <span className="relative grid size-9 place-items-center rounded-full border-2 border-white text-[11px] font-bold text-white shadow-lg"
                  style={{ background: p.color, opacity: p.stale ? 0.6 : 1 }}>
                  {!p.stale && <span className="pin-pulse absolute inset-0 rounded-full" style={{ color: p.color }} />}
                  <span className="relative">{p.initials}</span>
                </span>
                <span className="-mt-1 size-0 border-x-[6px] border-t-[8px] border-x-transparent" style={{ borderTopColor: p.color }} />
              </motion.button>
            </Marker>
          ))}
          {sel && (
            <Popup longitude={sel.lng} latitude={sel.lat} anchor="top" offset={8} closeOnClick={false} onClose={() => onSelect?.(null)} maxWidth="260px">
              <div className="w-56 text-slate-900">
                {sel.photo && <img src={sel.photo} alt="Proof" className="mb-2 h-28 w-full rounded-md object-cover" />}
                <div className="font-semibold">{sel.title}</div>
                <div className="text-xs text-slate-600">{sel.subtitle}</div>
                {sel.note && <div className="mt-1 text-xs italic">“{sel.note}”</div>}
                <div className="mt-1 text-[11px] text-slate-500">{sel.time} · {sel.lat.toFixed(5)}, {sel.lng.toFixed(5)}</div>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    );
  };
}
