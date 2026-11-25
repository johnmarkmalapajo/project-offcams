"use client";
import * as React from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from "framer-motion";
import confetti from "canvas-confetti";
import { Camera, Check, Compass, Flame, Footprints, Map, Medal, Moon, Sunrise, Users, type LucideIcon } from "lucide-react";
import type { Badge } from "@/lib/gamify";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const BADGE_ICONS: Record<string, LucideIcon> = {
  first: Footprints, shutter: Camera, early: Sunrise, owl: Moon, streak3: Flame, perfect: Medal, planner: Map, explorer: Compass, squad: Users,
};

export function celebrate(big = false) {
  const colors = ["#171717", "#16a34a", "#d4d4d4", "#f59e0b"];
  confetti({ particleCount: big ? 140 : 70, spread: big ? 90 : 60, origin: { y: 0.7 }, colors, scalar: 0.9, ticks: 160 });
}

export function CountUp({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString());
  React.useEffect(() => { const c = animate(mv, value, { duration: 1.1, ease: "easeOut" }); return c.stop; }, [value, mv]);
  return <motion.span className={className}>{rounded}</motion.span>;
}

export function LevelRing({ level, pct, size = 72 }: { level: number; pct: number; size?: number }) {
  const r = size / 2 - 4, c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth={4} fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke="var(--success)" strokeWidth={4} strokeLinecap="round" fill="none"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }} transition={{ duration: 1.2, ease: "easeOut" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">
        <div><div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Lvl</div><div className="text-2xl font-semibold tabular-nums">{level}</div></div>
      </div>
    </div>
  );
}

export function StreakFlame({ streak }: { streak: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <motion.span animate={streak > 0 ? { scale: [1, 1.15, 1] } : {}} transition={{ repeat: Infinity, duration: 1.8 }}>
        <Flame className={cn("size-4", streak > 0 ? "fill-orange-500 text-orange-500" : "text-muted-foreground")} />
      </motion.span>
    </span>
  );
}

export function BadgeGrid({ badges }: { badges: Badge[] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-3">
      {badges.map((b, i) => {
        const Icon = BADGE_ICONS[b.id] ?? Medal;
        return (
          <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
            className={cn("flex items-center gap-3 bg-card p-3", !b.earned && "text-muted-foreground")}>
            <motion.span whileHover={b.earned ? { rotate: [0, -10, 10, 0] } : {}}
              className={cn("relative grid size-9 shrink-0 place-items-center rounded-lg border", b.earned ? "border-foreground/15 bg-foreground text-background" : "border-dashed bg-muted/50")}>
              <Icon className="size-4" />
              {b.earned && <span className="absolute -right-1 -top-1 grid size-3.5 place-items-center rounded-full bg-success text-white ring-2 ring-card"><Check className="size-2.5" strokeWidth={3} /></span>}
            </motion.span>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{b.name}</div>
              <div className="truncate text-xs text-muted-foreground">{b.desc}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function RewardOverlay({ reward, onDone }: { reward: { xp: number; levelUp?: number; badges: Badge[] } | null; onDone: () => void }) {
  React.useEffect(() => { if (reward) { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); } }, [reward, onDone]);
  return (
    <AnimatePresence>
      {reward && (
        <motion.div className="fixed inset-0 z-[60] grid place-items-center bg-background/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onDone}>
          <motion.div initial={{ scale: 0.9, y: 12, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="mx-4 w-full max-w-xs rounded-2xl border bg-card p-6 text-center shadow-2xl">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.1 }}
              className="mx-auto grid size-12 place-items-center rounded-full bg-success text-white"><Check className="size-6" strokeWidth={3} /></motion.div>
            <div className="mt-4 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Check-in recorded</div>
            <div className="mt-1 text-4xl font-semibold tabular-nums">+<CountUp value={reward.xp} /> <span className="text-muted-foreground">XP</span></div>
            {reward.levelUp && <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-3 rounded-md border bg-muted px-3 py-1.5 text-sm font-medium">Level up: you’re now level {reward.levelUp}</motion.div>}
            {reward.badges.map((b, i) => {
              const Icon = BADGE_ICONS[b.id] ?? Medal;
              return (
                <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + i * 0.15 }} className="mt-2 flex items-center justify-center gap-2 text-sm">
                  <Icon className="size-4" /> New badge: <b>{b.name}</b>
                </motion.div>
              );
            })}
            <Button variant="outline" size="sm" className="mt-5 w-full" onClick={onDone}>Continue</Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
