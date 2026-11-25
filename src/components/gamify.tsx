"use client";
import * as React from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from "framer-motion";
import confetti from "canvas-confetti";
import { Flame, Star } from "lucide-react";
import type { Badge } from "@/lib/gamify";
import { cn } from "@/lib/utils";

export function celebrate(big = false) {
  const colors = ["#6366f1", "#ec4899", "#0ea5e9", "#f59e0b", "#10b981"];
  confetti({ particleCount: big ? 180 : 90, spread: big ? 100 : 70, origin: { y: 0.7 }, colors });
  if (big) setTimeout(() => confetti({ particleCount: 120, angle: 60, spread: 70, origin: { x: 0 }, colors }), 250);
  if (big) setTimeout(() => confetti({ particleCount: 120, angle: 120, spread: 70, origin: { x: 1 }, colors }), 400);
}

export function CountUp({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString());
  React.useEffect(() => { const c = animate(mv, value, { duration: 1.2, ease: "easeOut" }); return c.stop; }, [value, mv]);
  return <motion.span className={className}>{rounded}</motion.span>;
}

export function LevelRing({ level, pct, size = 84 }: { level: number; pct: number; size?: number }) {
  const r = size / 2 - 6, c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={7} className="text-white/25" fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke="url(#lv)" strokeWidth={7} strokeLinecap="round" fill="none"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }} transition={{ duration: 1.4, ease: "easeOut" }} />
        <defs><linearGradient id="lv"><stop offset="0" stopColor="#fde68a" /><stop offset="1" stopColor="#fbbf24" /></linearGradient></defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">
        <div><div className="text-[10px] uppercase tracking-wider opacity-80">Lvl</div><div className="text-2xl font-black">{level}</div></div>
      </div>
    </div>
  );
}

export function StreakFlame({ streak }: { streak: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <motion.span animate={streak > 0 ? { scale: [1, 1.25, 1], rotate: [0, -6, 6, 0] } : {}} transition={{ repeat: Infinity, duration: 1.6 }}>
        <Flame className={cn("size-5", streak > 0 ? "text-orange-300 fill-orange-400" : "opacity-50")} />
      </motion.span>
      <span className="font-bold">{streak}</span><span className="text-xs opacity-80">day streak</span>
    </div>
  );
}

export function BadgeGrid({ badges }: { badges: Badge[] }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
      {badges.map((b, i) => (
        <motion.div key={b.id} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05, type: "spring" }}
          whileHover={b.earned ? { rotate: [0, -8, 8, 0], scale: 1.08 } : {}}
          title={b.desc}
          className={cn("flex flex-col items-center gap-1 rounded-xl border p-2 text-center",
            b.earned ? "bg-gradient-to-b from-amber-50 to-white dark:from-amber-500/10 dark:to-transparent border-amber-300/60" : "opacity-45 grayscale")}>
          <span className="text-2xl">{b.emoji}</span>
          <span className="text-[11px] font-semibold leading-tight">{b.name}</span>
          <span className="text-[10px] text-muted-foreground leading-tight">{b.desc}</span>
        </motion.div>
      ))}
    </div>
  );
}

/** Big centered reward overlay after check-in */
export function RewardOverlay({ reward, onDone }: { reward: { xp: number; levelUp?: number; badges: Badge[] } | null; onDone: () => void }) {
  React.useEffect(() => { if (reward) { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); } }, [reward, onDone]);
  return (
    <AnimatePresence>
      {reward && (
        <motion.div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onDone}>
          <motion.div initial={{ scale: 0.3, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}
            className="mx-4 rounded-3xl bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-pink-500 p-8 text-center text-white shadow-2xl">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} className="mx-auto w-fit">
              <Star className="size-14 fill-amber-300 text-amber-300" />
            </motion.div>
            <div className="mt-3 text-sm uppercase tracking-widest opacity-90">Checked in!</div>
            <div className="text-5xl font-black">+<CountUp value={reward.xp} /> XP</div>
            {reward.levelUp && <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mt-3 rounded-full bg-white/20 px-4 py-1 font-bold">🎉 Level up! You’re now level {reward.levelUp}</motion.div>}
            {reward.badges.map((b, i) => (
              <motion.div key={b.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 + i * 0.2 }} className="mt-2 text-sm">
                New badge: <span className="text-lg">{b.emoji}</span> <b>{b.name}</b>
              </motion.div>
            ))}
            <div className="mt-4 text-xs opacity-70">Tap to continue</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
