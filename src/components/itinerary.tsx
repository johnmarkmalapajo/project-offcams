"use client";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Plane } from "lucide-react";
import type { CheckIn, Trip } from "@/lib/types";
import { prettyDate, tripDayIndex } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function ItineraryTimeline({ trip, checkins }: { trip: Trip; checkins: CheckIn[] }) {
  const { current } = tripDayIndex(trip);
  const done = new Set(checkins.map((c) => c.legId));
  return (
    <ol className="relative ml-3 border-l-2 border-dashed border-primary/30">
      {trip.days.map((d, i) => (
        <motion.li key={d.day} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="mb-4 ml-5">
          <span className={cn("absolute -left-[11px] grid size-5 place-items-center rounded-full ring-4 ring-background",
            d.day < current ? "bg-emerald-500" : d.day === current ? "bg-primary" : "bg-muted-foreground/40")}>
            {d.day === current ? <Plane className="size-3 text-white" /> : <span className="size-1.5 rounded-full bg-white" />}
          </span>
          <div className="text-sm font-bold">Day {d.day} <span className="font-normal text-muted-foreground">· {prettyDate(d.date)}</span>
            {d.day === current && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">TODAY</span>}
          </div>
          <ul className="mt-1 space-y-1">
            {d.legs.length === 0 && <li className="text-xs text-muted-foreground">No activities listed</li>}
            {d.legs.map((l) => (
              <li key={l.id} className="flex items-center gap-2 text-sm">
                {done.has(l.id) ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Circle className="size-4 text-muted-foreground/50" />}
                <span>{l.from} <span className="text-muted-foreground">→</span> {l.to}</span>
              </li>
            ))}
          </ul>
        </motion.li>
      ))}
    </ol>
  );
}

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export function Avatar({ name, color, size = 32 }: { name: string; color: string; size?: number }) {
  return (
    <span className="inline-grid shrink-0 place-items-center rounded-full border-2 border-background font-bold text-white" style={{ background: color, width: size, height: size, fontSize: size / 2.8 }}>
      {initials(name)}
    </span>
  );
}
