"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Camera, GraduationCap, MapPin, Radio, ShieldCheck, Trophy } from "lucide-react";
import { useStore } from "@/lib/store";
import { tripStatus } from "@/lib/dates";
import { Logo } from "@/components/logo";
import { LiveDot } from "@/components/live-dot";

export default function Home() {
  const { db } = useStore();
  const ongoing = db.trips.filter((t) => tripStatus(t) === "ongoing");
  const delegatesOut = new Set(ongoing.flatMap((t) => t.delegateIds)).size;

  return (
    <main className="relative min-h-dvh">
      <div aria-hidden className="grid-bg pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="relative mx-auto max-w-5xl px-4 py-6">
        <header className="flex items-center justify-between">
          <Logo />
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            <LiveDot /> {ongoing.length} trips ongoing · {delegatesOut} delegates out
          </span>
        </header>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="pt-20 pb-12 sm:pt-28">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Off-campus activity monitoring</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Know where every delegate is, <span className="text-muted-foreground">without the group chat.</span>
          </h1>
          <p className="mt-5 max-w-xl text-muted-foreground sm:text-lg">
            Students log their itinerary and check in with GPS and a photo. VPSAS sees every check-in on one live map.
          </p>
        </motion.section>

        <div className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
          <RoleCard href="/student" delay={0.1} icon={<GraduationCap />} kicker="For students" title="Delegate app" desc="Plan the trip, check in at each stop, earn XP and badges." />
          <RoleCard href="/staff" delay={0.18} icon={<ShieldCheck />} kicker="For VPSAS staff" title="Monitoring console" desc="Live map, ongoing activities, and delegates per college." />
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-6 sm:grid-cols-4">
          {[
            { i: <MapPin />, t: "GPS check-ins", d: "Coordinates + accuracy" },
            { i: <Camera />, t: "Photo proof", d: "Time-stamped on capture" },
            { i: <Radio />, t: "Live console", d: "Updates as students check in" },
            { i: <Trophy />, t: "Streaks & badges", d: "College leaderboard" },
          ].map((f, k) => (
            <motion.div key={f.t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + k * 0.06 }} className="[&_svg]:size-4">
              <div className="flex items-center gap-2 text-sm font-medium">{f.i}{f.t}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{f.d}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}

function RoleCard({ href, icon, kicker, title, desc, delay }: { href: string; icon: React.ReactNode; kicker: string; title: string; desc: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="bg-card">
      <Link href={href} className="group flex h-full flex-col gap-10 p-6 transition-colors hover:bg-accent/60">
        <div className="flex items-start justify-between">
          <span className="grid size-10 place-items-center rounded-lg border bg-background [&_svg]:size-5">{icon}</span>
          <ArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
        </div>
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{kicker}</div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        </div>
      </Link>
    </motion.div>
  );
}
