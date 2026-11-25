"use client";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { studentStats } from "@/lib/gamify";
import { COLLEGES, collegeColor } from "@/lib/colleges";
import { Avatar } from "./itinerary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Leaderboard({ highlightId }: { highlightId?: string }) {
  const { db } = useStore();
  const rows = db.students.map((s) => ({ s, st: studentStats(s.id, db) })).sort((a, b) => b.st.xp - a.st.xp);
  const colleges = COLLEGES.map((c) => ({ c, xp: rows.filter((r) => r.s.college === c.code).reduce((n, r) => n + r.st.xp, 0) }))
    .filter((x) => x.xp > 0).sort((a, b) => b.xp - a.xp);
  const maxC = Math.max(1, ...colleges.map((c) => c.xp));
  const medal = ["🥇", "🥈", "🥉"];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="gap-3">
        <CardHeader><CardTitle>Top delegates</CardTitle></CardHeader>
        <CardContent className="space-y-1.5">
          {rows.slice(0, 10).map((r, i) => (
            <motion.div key={r.s.id} layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className={cn("flex items-center gap-3 rounded-lg px-2 py-1.5", r.s.id === highlightId && "bg-primary/10 ring-1 ring-primary/30")}>
              <span className="w-6 text-center text-sm font-bold">{medal[i] ?? i + 1}</span>
              <Avatar name={r.s.name} color={collegeColor(r.s.college)} size={28} />
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{r.s.name}</div><div className="text-[11px] text-muted-foreground">{r.s.college} · Lvl {r.st.level}</div></div>
              <span className="text-sm font-bold tabular-nums">{r.st.xp} XP</span>
            </motion.div>
          ))}
        </CardContent>
      </Card>
      <Card className="gap-3">
        <CardHeader><CardTitle>College cup</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {colleges.map((x, i) => (
            <div key={x.c.code}>
              <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{medal[i] ?? ""} {x.c.code}</span><span className="tabular-nums text-muted-foreground">{x.xp} XP</span></div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <motion.div className="h-full rounded-full" style={{ background: x.c.color }} initial={{ width: 0 }} animate={{ width: `${(x.xp / maxC) * 100}%` }} transition={{ duration: 1, delay: i * 0.1 }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
