"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, ShieldCheck, MapPin, Camera, Trophy, Radio } from "lucide-react";
import { useStore } from "@/lib/store";
import { tripStatus } from "@/lib/dates";
import { Logo } from "@/components/logo";

export default function Home() {
  const { db } = useStore();
  const ongoing = db.trips.filter((t) => tripStatus(t) === "ongoing");
  const delegatesOut = new Set(ongoing.flatMap((t) => t.delegateIds)).size;

  return (
    <main className="relative overflow-hidden min-h-dvh">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <motion.div className="absolute -top-32 -left-24 size-[28rem] rounded-full bg-indigo-400/30 blur-3xl"
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }} transition={{ duration: 14, repeat: Infinity }} />
        <motion.div className="absolute top-40 -right-24 size-[24rem] rounded-full bg-fuchsia-400/25 blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, 60, 0] }} transition={{ duration: 16, repeat: Infinity }} />
        <motion.div className="absolute bottom-0 left-1/3 size-[22rem] rounded-full bg-sky-400/25 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, -40, 0] }} transition={{ duration: 18, repeat: Infinity }} />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-14">
        <Logo />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mt-10 sm:mt-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium backdrop-blur">
            <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" /><span className="relative inline-flex size-2 rounded-full bg-emerald-500" /></span>
            {ongoing.length} trips ongoing · {delegatesOut} delegates off campus
          </span>
          <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold tracking-tight">
            Every trip, <span className="bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-sky-500 bg-clip-text text-transparent">checked in.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground sm:text-lg">
            Log off-campus itineraries, check in with GPS and photo proof, earn XP and badges, and let VPSAS keep every delegate safe on a live map.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <RoleCard href="/student" delay={0.1} icon={<GraduationCap className="size-7" />} title="I'm a Student Delegate"
            desc="Plan your trip itinerary, check in at each stop, and level up." gradient="from-indigo-500 to-fuchsia-500" />
          <RoleCard href="/staff" delay={0.2} icon={<ShieldCheck className="size-7" />} title="VPSAS / Staff"
            desc="Monitor live check-ins, ongoing activities, and delegates per college." gradient="from-sky-500 to-emerald-500" />
        </div>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { i: <MapPin />, t: "GPS check-ins" },
            { i: <Camera />, t: "Photo proof" },
            { i: <Radio />, t: "Live staff map" },
            { i: <Trophy />, t: "XP, streaks & badges" },
          ].map((f, k) => (
            <motion.div key={f.t} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + k * 0.08 }}
              className="flex items-center gap-2 rounded-xl border bg-background/70 p-3 text-sm font-medium backdrop-blur [&_svg]:size-4 [&_svg]:text-primary">
              {f.i}{f.t}
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}

function RoleCard({ href, icon, title, desc, gradient, delay }: { href: string; icon: React.ReactNode; title: string; desc: string; gradient: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: "spring", stiffness: 120 }}
      whileHover={{ y: -6, rotate: -0.5 }} whileTap={{ scale: 0.98 }}>
      <Link href={href} className="group block rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-xl">
        <div className={`inline-flex rounded-xl bg-gradient-to-br ${gradient} p-3 text-white shadow-lg animate-float`}>{icon}</div>
        <h2 className="mt-4 text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          Enter <span className="transition-transform group-hover:translate-x-1">→</span>
        </span>
      </Link>
    </motion.div>
  );
}
