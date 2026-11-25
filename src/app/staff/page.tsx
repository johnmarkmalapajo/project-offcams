"use client";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import { Activity, AlertTriangle, Building2, LogOut, MapPin, RotateCcw, ShieldCheck, Users, Search, Layers, Trophy, Table2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LiveMap, type MapPoint } from "@/components/map/live-map";
import { Avatar, initials } from "@/components/itinerary";
import { Leaderboard } from "@/components/leaderboard";
import { CountUp } from "@/components/gamify";
import { LiveDot } from "@/components/live-dot";
import { COLLEGES, collegeColor } from "@/lib/colleges";
import { shortDate, todayYmd, tripDayIndex, tripStatus, ymd } from "@/lib/dates";
import { hoursSince } from "@/lib/gamify";
import type { CheckIn, Student, Trip } from "@/lib/types";
import { cn } from "@/lib/utils";

const STALE_HOURS = 12; // GUESS: flag delegates with no check-in in 12h during an ongoing trip

export default function StaffPage() {
  const { ready, isStaff } = useStore();
  if (!ready) return <div className="grid min-h-dvh place-items-center text-muted-foreground">Loading…</div>;
  return isStaff ? <StaffDashboard /> : <StaffGate />;
}

function StaffGate() {
  const { staffLogin } = useStore();
  const [pass, setPass] = React.useState("");
  const [shake, setShake] = React.useState(0);
  return (
    <main className="mx-auto grid min-h-dvh max-w-sm place-items-center px-4">
      <motion.div key={shake} animate={shake ? { x: [0, -12, 12, -8, 8, 0] } : {}} className="w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto grid size-11 place-items-center rounded-lg border bg-muted"><ShieldCheck className="size-5" /></div>
            <CardTitle className="mt-2 text-lg tracking-tight">VPSAS staff access</CardTitle>
            <CardDescription>Enter the staff passcode. (Demo passcode: <code>vpsas2026</code>)</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Passcode" onKeyDown={(e) => e.key === "Enter" && (staffLogin(pass) || (setShake((s) => s + 1), toast.error("Wrong passcode")))} />
            <Button onClick={() => { if (!staffLogin(pass)) { setShake((s) => s + 1); toast.error("Wrong passcode"); } }}>Enter dashboard</Button>
            <div className="text-center"><Logo /></div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

type Row = { s: Student; trip: Trip; last?: CheckIn; count: number; stale: boolean };

function StaffDashboard() {
  const { db, staffLogout, resetDemo, backend, lastEventAt } = useStore();
  const [college, setCollege] = React.useState("all");
  const [dept, setDept] = React.useState("all");
  const [tripId, setTripId] = React.useState("ongoing");
  const [q, setQ] = React.useState("");
  const [selected, setSelected] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<"latest" | "all">("latest");

  // toast when new check-ins arrive in real time
  const prevCount = React.useRef(db.checkins.length);
  React.useEffect(() => {
    if (db.checkins.length > prevCount.current) {
      const fresh = [...db.checkins].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, db.checkins.length - prevCount.current);
      for (const c of fresh.slice(0, 3)) {
        const s = db.students.find((x) => x.id === c.studentId);
        toast(`📍 ${s?.name ?? "A delegate"} just checked in`, { description: c.legLabel ?? db.trips.find((t) => t.id === c.tripId)?.title });
      }
    }
    prevCount.current = db.checkins.length;
  }, [db.checkins, db.students, db.trips]);

  const ongoing = db.trips.filter((t) => tripStatus(t) === "ongoing");
  const scopeTrips = tripId === "ongoing" ? ongoing : tripId === "all" ? db.trips : db.trips.filter((t) => t.id === tripId);
  const studentOk = (s: Student) =>
    (college === "all" || s.college === college) && (dept === "all" || s.department === dept) &&
    (!q || s.name.toLowerCase().includes(q.toLowerCase()) || s.studentNo.includes(q));

  const rows: Row[] = scopeTrips.flatMap((trip) => trip.delegateIds.map((id) => db.students.find((s) => s.id === id)).filter((s): s is Student => !!s && studentOk(s)).map((s) => {
    const cs = db.checkins.filter((c) => c.tripId === trip.id && c.studentId === s.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const isOn = tripStatus(trip) === "ongoing";
    return { s, trip, last: cs[0], count: cs.length, stale: isOn && (!cs[0] || hoursSince(cs[0].createdAt) > STALE_HOURS) };
  }));

  const points: MapPoint[] = mode === "latest"
    ? rows.filter((r) => r.last).map((r) => toPoint(r.last!, r.s, r.trip, r.stale))
    : db.checkins.filter((c) => rows.some((r) => r.s.id === c.studentId && r.trip.id === c.tripId))
      .map((c) => toPoint(c, db.students.find((s) => s.id === c.studentId)!, db.trips.find((t) => t.id === c.tripId)!, false));

  const todayCount = db.checkins.filter((c) => ymd(new Date(c.createdAt)) === todayYmd()).length;
  const delegatesOut = new Set(ongoing.flatMap((t) => t.delegateIds)).size;
  const attention = rows.filter((r) => r.stale);
  const feed = db.checkins.filter((c) => rows.some((r) => r.s.id === c.studentId && r.trip.id === c.tripId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 25);
  const depts = [...new Set(db.students.filter((s) => s.college === college).map((s) => s.department))].sort();

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Logo />
          <Badge variant="outline" className="gap-1.5">
            <motion.span key={lastEventAt} initial={{ scale: 2 }} animate={{ scale: 1 }}><LiveDot /></motion.span>
            <span className="font-mono text-[10px] uppercase tracking-wider">{backend === "supabase" ? "Live" : "Demo data"}</span>
          </Badge>
        </div>
        <div className="flex gap-1">
          {backend === "demo" && <Button variant="ghost" size="sm" onClick={() => resetDemo().then(() => toast("Demo data reset"))}><RotateCcw /> Reset demo</Button>}
          <Button variant="ghost" size="sm" onClick={staffLogout}><LogOut /> Sign out</Button>
        </div>
      </header>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">Delegate monitor</h1>
      <p className="text-sm text-muted-foreground">VPSAS · {format(new Date(), "EEEE, MMMM d, yyyy")}</p>

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4">
        <Kpi icon={<Activity />} label="Ongoing activities" value={ongoing.length} />
        <Kpi icon={<Users />} label="Delegates off campus" value={delegatesOut} />
        <Kpi icon={<MapPin />} label="Check-ins today" value={todayCount} />
        <Kpi icon={<AlertTriangle />} label={`No check-in > ${STALE_HOURS}h`} value={attention.length} alert={attention.length > 0} />
      </div>

      {/* Filters */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Select value={tripId} onValueChange={setTripId}>
          <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ongoing">All ongoing activities</SelectItem>
            <SelectItem value="all">All activities (incl. past/upcoming)</SelectItem>
            {db.trips.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={college} onValueChange={(v) => { setCollege(v); setDept("all"); }}>
          <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All colleges</SelectItem>{COLLEGES.map((c) => <SelectItem key={c.code} value={c.code}>{c.code} · {c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={dept} onValueChange={setDept} disabled={college === "all"}>
          <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All departments</SelectItem>{depts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
        <div className="relative"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name / student no." className="bg-card pl-8" /></div>
        <Tabs value={mode} onValueChange={(v) => setMode(v as "latest" | "all")}>
          <TabsList className="w-full"><TabsTrigger value="latest">Latest pin</TabsTrigger><TabsTrigger value="all">All check-ins</TabsTrigger></TabsList>
        </Tabs>
      </div>

      {/* Map + feed */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card className="h-[420px] overflow-hidden p-0 sm:h-[540px]">
          <LiveMap points={points} selectedId={selected} onSelect={setSelected} />
        </Card>
        <Card className="h-[420px] gap-2 py-4 sm:h-[540px]">
          <CardHeader className="px-4"><CardTitle className="flex items-center gap-2 text-base"><LiveDot /> Live check-ins</CardTitle></CardHeader>
          <div className="flex-1 overflow-y-auto px-2">
            <AnimatePresence initial={false}>
              {feed.map((c) => {
                const s = db.students.find((x) => x.id === c.studentId)!;
                return (
                  <motion.button layout key={c.id} initial={{ opacity: 0, x: 20, backgroundColor: "rgba(22,163,74,0.14)" }} animate={{ opacity: 1, x: 0, backgroundColor: "rgba(22,163,74,0)" }} transition={{ duration: 0.8 }}
                    onClick={() => setSelected(c.id)}
                    className={cn("flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-accent", selected === c.id && "bg-muted ring-1 ring-border")}>
                    {c.photo ? <img src={c.photo} alt="" className="size-11 shrink-0 rounded-md object-cover" /> : <Avatar name={s.name} color={collegeColor(s.college)} size={44} />}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{s.name} <span className="font-normal text-muted-foreground">· {s.college}</span></div>
                      <div className="truncate text-xs">{c.legLabel ?? db.trips.find((t) => t.id === c.tripId)?.title}</div>
                      <div className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</div>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
            {feed.length === 0 && <div className="p-4 text-sm text-muted-foreground">No check-ins match the filters.</div>}
          </div>
        </Card>
      </div>

      <Tabs defaultValue="activities" className="mt-6">
        <TabsList className="w-full overflow-x-auto sm:w-fit">
          <TabsTrigger value="activities"><Layers /> Ongoing activities</TabsTrigger>
          <TabsTrigger value="college"><Building2 /> By college / dept</TabsTrigger>
          <TabsTrigger value="delegates"><Table2 /> Delegates</TabsTrigger>
          <TabsTrigger value="ranks"><Trophy /> Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="grid gap-3 md:grid-cols-2">
          {(tripId === "ongoing" ? ongoing : scopeTrips).map((t, i) => <ActivityCard key={t.id} trip={t} delay={i * 0.06} onFocus={() => setTripId(t.id)} />)}
          {ongoing.length === 0 && tripId === "ongoing" && <div className="text-sm text-muted-foreground">No ongoing off-campus activities today.</div>}
        </TabsContent>

        <TabsContent value="college"><CollegeBreakdown rows={rows} /></TabsContent>

        <TabsContent value="delegates">
          <Card className="py-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="p-3">Delegate</th><th className="p-3">College / Dept</th><th className="p-3">Activity</th><th className="p-3">Last check-in</th><th className="p-3">Status</th></tr>
                </thead>
                <tbody>
                  {rows.sort((a, b) => Number(b.stale) - Number(a.stale)).map((r) => (
                    <tr key={r.s.id + r.trip.id} className="border-b last:border-0 hover:bg-accent/40 cursor-pointer" onClick={() => r.last && setSelected(r.last.id)}>
                      <td className="p-3"><div className="flex items-center gap-2"><Avatar name={r.s.name} color={collegeColor(r.s.college)} size={28} /><div><div className="font-medium">{r.s.name}</div><div className="text-xs text-muted-foreground">{r.s.studentNo}</div></div></div></td>
                      <td className="p-3">{r.s.college}<div className="text-xs text-muted-foreground">{r.s.department}</div></td>
                      <td className="p-3">{r.trip.title}<div className="text-xs text-muted-foreground">{r.trip.destination}</div></td>
                      <td className="p-3">{r.last ? <>{formatDistanceToNow(new Date(r.last.createdAt), { addSuffix: true })}<div className="text-xs text-muted-foreground font-mono">{r.last.lat.toFixed(4)}, {r.last.lng.toFixed(4)}</div></> : <span className="text-muted-foreground">None yet</span>}</td>
                      <td className="p-3">{r.stale ? <Badge variant="warning"><AlertTriangle /> Follow up</Badge> : tripStatus(r.trip) === "ongoing" ? <Badge variant="success">OK · {r.count}</Badge> : <Badge variant="secondary">{tripStatus(r.trip)}</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && <div className="p-4 text-sm text-muted-foreground">No delegates match the filters.</div>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="ranks"><Leaderboard /></TabsContent>
      </Tabs>
    </main>
  );
}

function toPoint(c: CheckIn, s: Student, t: Trip, stale: boolean): MapPoint {
  return {
    id: c.id, lat: c.lat, lng: c.lng, color: collegeColor(s.college), initials: initials(s.name),
    title: s.name, subtitle: `${s.college} · ${s.department} — ${t.title}${c.legLabel ? ` (${c.legLabel})` : ""}`,
    time: format(new Date(c.createdAt), "MMM d, h:mm a"), photo: c.photo, note: c.note, stale,
  };
}

function Kpi({ icon, label, value, alert }: { icon: React.ReactNode; label: string; value: number; alert?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-4">
      <div className="flex items-center justify-between text-muted-foreground [&_svg]:size-4">
        <span className="text-xs">{label}</span>
        <span className={cn(alert && "text-warning")}>{icon}</span>
      </div>
      <div className={cn("mt-3 text-3xl font-semibold tabular-nums tracking-tight", alert && "text-warning")}><CountUp value={value} /></div>
    </motion.div>
  );
}

function ActivityCard({ trip, delay, onFocus }: { trip: Trip; delay: number; onFocus: () => void }) {
  const { db } = useStore();
  const { current, total } = tripDayIndex(trip);
  const today = todayYmd();
  const checkedToday = new Set(db.checkins.filter((c) => c.tripId === trip.id && ymd(new Date(c.createdAt)) === today).map((c) => c.studentId));
  const compliance = trip.delegateIds.length ? Math.round((checkedToday.size / trip.delegateIds.length) * 100) : 0;
  const st = tripStatus(trip);
  const todayLegs = trip.days.find((d) => d.day === current)?.legs ?? [];
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <div className="flex items-center justify-between">
            <Badge variant={st === "ongoing" ? "success" : st === "upcoming" ? "warning" : "secondary"}>{st === "ongoing" ? `Day ${current} of ${total}` : st}</Badge>
            <Button variant="ghost" size="sm" onClick={onFocus}><MapPin /> Focus map</Button>
          </div>
          <CardTitle className="text-base tracking-tight">{trip.title}</CardTitle>
          <CardDescription>{trip.destination} · {shortDate(trip.ingress)}–{shortDate(trip.egress)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-4">
          {st === "ongoing" && todayLegs.length > 0 && (
            <div className="rounded-md border bg-muted/40 px-2.5 py-2 text-xs"><span className="font-mono uppercase tracking-wider text-muted-foreground">Today</span>  {todayLegs.map((l) => `${l.from} → ${l.to}`).join(" · ")}</div>
          )}
          <div>
            <div className="mb-1 flex justify-between text-xs"><span>Checked in today</span><span className="font-semibold">{checkedToday.size}/{trip.delegateIds.length} · {compliance}%</span></div>
            <Progress value={compliance} className="h-1.5 bg-muted" indicatorClassName={compliance >= 80 ? "bg-success" : compliance >= 50 ? "bg-warning" : "bg-destructive"} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {trip.delegateIds.map((id) => {
              const s = db.students.find((x) => x.id === id); if (!s) return null;
              return (
                <span key={id} className={cn("flex items-center gap-1 rounded-full border py-0.5 pl-0.5 pr-2 text-xs", !checkedToday.has(id) && st === "ongoing" && "border-warning/50 bg-warning/10")}>
                  <Avatar name={s.name} color={collegeColor(s.college)} size={20} />{s.name.split(" ")[0]}
                </span>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CollegeBreakdown({ rows }: { rows: Row[] }) {
  const data = COLLEGES.map((c) => {
    const rs = rows.filter((r) => r.s.college === c.code);
    const delegates = new Set(rs.map((r) => r.s.id)).size;
    const depts = [...new Set(rs.map((r) => r.s.department))].sort().map((d) => ({ d, n: new Set(rs.filter((r) => r.s.department === d).map((r) => r.s.id)).size, stale: rs.filter((r) => r.s.department === d && r.stale).length })).filter((x) => x.n > 0);
    const places = [...new Set(rs.map((r) => r.trip.destination))];
    return { c, delegates, depts, places, stale: rs.filter((r) => r.stale).length };
  }).filter((x) => x.delegates > 0);
  const max = Math.max(1, ...data.map((d) => d.delegates));
  if (!data.length) return <div className="text-sm text-muted-foreground">No delegates match the filters.</div>;
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {data.map((x, i) => (
        <motion.div key={x.c.code} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}>
          <Card className="gap-3 py-4">
            <CardHeader className="px-4">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full" style={{ background: x.c.color }} />
                <CardTitle>{x.c.code}</CardTitle>
                {x.stale > 0 && <Badge variant="warning" className="ml-auto"><AlertTriangle /> {x.stale}</Badge>}
              </div>
              <CardDescription>{x.c.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-4">
              <div>
                <div className="mb-1 flex justify-between text-sm"><span>Delegates off campus</span><b>{x.delegates}</b></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted"><motion.div className="h-full rounded-full" style={{ background: x.c.color }} initial={{ width: 0 }} animate={{ width: `${(x.delegates / max) * 100}%` }} transition={{ duration: 0.9 }} /></div>
              </div>
              <div className="space-y-1">
                {x.depts.map((d) => (
                  <div key={d.d} className="flex items-center justify-between text-xs"><span>{d.d}</span><span className="tabular-nums">{d.n}{d.stale > 0 && <span className="ml-1 text-warning">({d.stale} follow-up)</span>}</span></div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">{x.places.map((p) => <Badge key={p} variant="secondary"><MapPin /> {p}</Badge>)}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
