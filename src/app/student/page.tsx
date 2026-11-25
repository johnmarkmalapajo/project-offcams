"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import { Luggage, LogOut, Plus, Ticket, MapPin, Copy, CalendarRange, Trophy, History, Map as MapIcon, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { COLLEGES, collegeColor } from "@/lib/colleges";
import { studentStats } from "@/lib/gamify";
import { shortDate, tripDayIndex, tripStatus } from "@/lib/dates";
import { TripFormDialog } from "@/components/trip-form";
import { CheckInDialog } from "@/components/checkin-dialog";
import { ItineraryTimeline, Avatar } from "@/components/itinerary";
import { BadgeGrid, CountUp, LevelRing, RewardOverlay, StreakFlame, celebrate } from "@/components/gamify";
import { Leaderboard } from "@/components/leaderboard";
import { LiveDot } from "@/components/live-dot";
import type { Trip } from "@/lib/types";
import type { Badge as GBadge } from "@/lib/gamify";

export default function StudentPage() {
  const { ready, me } = useStore();
  if (!ready) return <div className="grid min-h-dvh place-items-center text-muted-foreground">Loading…</div>;
  return me ? <Dashboard /> : <Onboarding />;
}

function Onboarding() {
  const { register, db, signInAs, backend } = useStore();
  const [name, setName] = React.useState("");
  const [no, setNo] = React.useState("");
  const [college, setCollege] = React.useState("");
  const [dept, setDept] = React.useState("");
  const depts = COLLEGES.find((c) => c.code === college)?.departments ?? [];
  const submit = async () => {
    if (!name.trim() || !no.trim() || !college || !dept.trim()) return toast.error("Please complete all fields");
    try { await register({ name: name.trim(), studentNo: no.trim(), college, department: dept.trim() }); }
    catch (e) { return toast.error("Couldn’t save your profile", { description: (e as Error)?.message }); }
    celebrate(); toast.success(`Welcome, ${name.split(" ")[0]}`);
  };
  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <Logo />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-xl tracking-tight">Create your delegate profile</CardTitle><CardDescription>So VPSAS knows who’s out and where you’re from.</CardDescription></CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-1.5"><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Dela Cruz" /></div>
            <div className="grid gap-1.5"><Label>Student number</Label><Input value={no} onChange={(e) => setNo(e.target.value)} placeholder="2023-00123" /></div>
            <div className="grid gap-1.5"><Label>College</Label>
              <Select value={college} onValueChange={(v) => { setCollege(v); setDept(""); }}>
                <SelectTrigger><SelectValue placeholder="Select college" /></SelectTrigger>
                <SelectContent>{COLLEGES.map((c) => <SelectItem key={c.code} value={c.code}>{c.code} · {c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>Department / Program</Label>
              <Input value={dept} onChange={(e) => setDept(e.target.value)} disabled={!college} list="dept-options" placeholder={college ? "e.g. Computer Science" : "Select a college first"} />
              <datalist id="dept-options">{depts.map((d) => <option key={d} value={d} />)}</datalist>
            </div>
            <Button size="lg" className="mt-2" onClick={submit}>Continue</Button>
          </CardContent>
        </Card>
      </motion.div>
      {backend === "demo" && db.students.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Demo: continue as a sample student</div>
          <div className="flex flex-wrap gap-2">
            {db.students.slice(0, 6).map((s) => (
              <button key={s.id} onClick={() => signInAs(s.id)} className="flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-3 text-sm hover:bg-accent">
                <Avatar name={s.name} color={collegeColor(s.college)} size={26} />{s.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function Dashboard() {
  const { me, db, signOut, joinTrip } = useStore();
  const [newOpen, setNewOpen] = React.useState(false);
  const [editTrip, setEditTrip] = React.useState<Trip | undefined>();
  const [joinOpen, setJoinOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [checkTrip, setCheckTrip] = React.useState<Trip | null>(null);
  const [reward, setReward] = React.useState<{ xp: number; levelUp?: number; badges: GBadge[] } | null>(null);
  if (!me) return null;

  const stats = studentStats(me.id, db);
  const myTrips = db.trips.filter((t) => t.delegateIds.includes(me.id))
    .sort((a, b) => ["ongoing", "upcoming", "completed"].indexOf(tripStatus(a)) - ["ongoing", "upcoming", "completed"].indexOf(tripStatus(b)) || a.ingress.localeCompare(b.ingress));
  const active = myTrips.find((t) => tripStatus(t) === "ongoing");
  const myCheckins = db.checkins.filter((c) => c.studentId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const lastHere = active && myCheckins.find((c) => c.tripId === active.id);

  const onReward = (r: { xp: number; levelUp?: number; badges: GBadge[] }) => { setReward(r); celebrate(!!r.levelUp || r.badges.length > 0); };
  const doJoin = async () => {
    const t = await joinTrip(code);
    if (!t) return toast.error("No trip found with that code");
    setJoinOpen(false); setCode(""); celebrate(); toast.success(`Joined “${t.title}”! +15 XP`);
  };

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-4">
      <header className="flex items-center justify-between">
        <Logo />
        <Button variant="ghost" size="sm" onClick={signOut}><LogOut /> Sign out</Button>
      </header>

      {/* Player card */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
        <Card className="gap-0 py-0">
          <div className="flex items-center gap-4 p-5">
            <LevelRing level={stats.level} pct={stats.into / stats.perLevel} />
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{stats.title}</div>
              <div className="truncate text-xl font-semibold tracking-tight">{me.name}</div>
              <div className="truncate text-sm text-muted-foreground">{me.college} · {me.department} · <span className="font-mono">{me.studentNo}</span></div>
            </div>
          </div>
          <div className="px-5 pb-5">
            <div className="mb-1.5 flex justify-between text-xs text-muted-foreground"><span className="tabular-nums"><span className="font-medium text-foreground"><CountUp value={stats.xp} /></span> XP</span><span className="tabular-nums">{stats.perLevel - stats.into} XP to level {stats.level + 1}</span></div>
            <Progress value={(stats.into / stats.perLevel) * 100} className="h-1.5 bg-muted" indicatorClassName="bg-success" />
          </div>
          <div className="grid grid-cols-3 divide-x border-t text-sm">
            <Stat label="Day streak" value={<span className="inline-flex items-center gap-1"><StreakFlame streak={stats.streak} />{stats.streak}</span>} />
            <Stat label="Check-ins" value={stats.checkins} />
            <Stat label="Badges" value={<>{stats.badges.filter((b) => b.earned).length}<span className="text-muted-foreground">/{stats.badges.length}</span></>} />
          </div>
        </Card>
      </motion.section>

      {/* Active trip */}
      {active ? (
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-5">
          <Card className="overflow-hidden py-0">
            <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
              <div className="p-5">
                <div className="flex items-center gap-2"><Badge variant="success"><LiveDot /> Ongoing</Badge>
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => { navigator.clipboard?.writeText(active.code); toast("Join code copied"); }}>
                    <Ticket className="size-3" /> {active.code} <Copy className="size-3" />
                  </button>
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">{active.title}</h2>
                <div className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-4" />{active.destination} · {shortDate(active.ingress)}–{shortDate(active.egress)}</div>
                <div className="mt-3">
                  {(() => { const { current, total } = tripDayIndex(active); return (<><div className="mb-1 text-xs text-muted-foreground">Day {current} of {total}</div><Progress value={(current / total) * 100} /></>); })()}
                </div>
                <div className="mt-3 flex -space-x-2">
                  {active.delegateIds.map((id) => { const s = db.students.find((x) => x.id === id); return s ? <Avatar key={id} name={s.name} color={collegeColor(s.college)} /> : null; })}
                </div>
                <motion.div className="mt-5" whileTap={{ scale: 0.98 }}>
                  <Button size="lg" onClick={() => setCheckTrip(active)} className="h-12 w-full text-base">
                    <span className="relative grid size-5 place-items-center">
                      <motion.span className="absolute inset-0 rounded-full border border-primary-foreground/60" animate={{ scale: [0.6, 1.6], opacity: [0.8, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
                      <MapPin className="size-4" />
                    </span>
                    Check in now
                  </Button>
                </motion.div>
                <div className="mt-2 text-center text-xs text-muted-foreground">
                  {lastHere ? `Last check-in ${formatDistanceToNow(new Date(lastHere.createdAt), { addSuffix: true })}` : "No check-in yet for this trip"}
                </div>
              </div>
              <div className="border-t bg-muted/30 p-5 md:border-l md:border-t-0">
                <div className="mb-4 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Itinerary</div>
                <ItineraryTimeline trip={active} checkins={myCheckins.filter((c) => c.tripId === active.id)} />
              </div>
            </div>
          </Card>
        </motion.section>
      ) : (
        <Card className="mt-5 border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
            <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2.4 }} className="grid size-10 place-items-center rounded-lg border bg-muted"><Luggage className="size-5" /></motion.div>
            <div className="font-semibold">No ongoing off-campus activity</div>
            <div className="text-sm text-muted-foreground">Create a trip or join one with a code from your trip leader.</div>
          </CardContent>
        </Card>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={() => setNewOpen(true)}><Plus /> New trip</Button>
        <Button variant="outline" onClick={() => setJoinOpen(true)}><Ticket /> Join with code</Button>
      </div>

      <Tabs defaultValue="trips" className="mt-5">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="trips"><CalendarRange /> Trips</TabsTrigger>
          <TabsTrigger value="history"><History /> History</TabsTrigger>
          <TabsTrigger value="badges"><Trophy /> Badges</TabsTrigger>
          <TabsTrigger value="board"><MapIcon /> Ranks</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="grid gap-3 sm:grid-cols-2">
          {myTrips.length === 0 && <div className="text-sm text-muted-foreground">No trips yet.</div>}
          {myTrips.map((t, i) => {
            const st = tripStatus(t);
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="gap-2 py-4">
                  <CardHeader className="px-4">
                    <div className="flex items-center justify-between">
                      <Badge variant={st === "ongoing" ? "success" : st === "upcoming" ? "warning" : "secondary"}>{st}</Badge>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono text-muted-foreground">{t.code}</span>
                        {t.createdBy === me.id && <Button variant="ghost" size="icon" className="size-7" onClick={() => setEditTrip(t)} aria-label="Edit trip"><Pencil className="size-3.5" /></Button>}
                      </div>
                    </div>
                    <CardTitle>{t.title}</CardTitle>
                    <CardDescription>{t.destination} · {shortDate(t.ingress)}–{shortDate(t.egress)} · {t.delegateIds.length} delegate(s)</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 text-xs text-muted-foreground">
                    {t.days.flatMap((d) => d.legs.map((l) => `D${d.day}: ${l.from} → ${l.to}`)).slice(0, 3).join(" · ")}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </TabsContent>

        <TabsContent value="history" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {myCheckins.length === 0 && <div className="text-sm text-muted-foreground">No check-ins yet. Your first one earns the First Steps badge.</div>}
          {myCheckins.map((c, i) => {
            const t = db.trips.find((x) => x.id === c.tripId);
            return (
              <motion.div key={c.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i * 0.04, 0.6) }}>
                <Card className="gap-0 overflow-hidden py-0">
                  {c.photo && <img src={c.photo} alt="Proof" className="h-32 w-full object-cover" />}
                  <div className="p-3 text-sm">
                    <div className="font-semibold">{t?.title}</div>
                    {c.legLabel && <div className="text-xs">{c.legLabel}</div>}
                    <div className="text-xs text-muted-foreground">{format(new Date(c.createdAt), "MMM d, h:mm a")} · {c.lat.toFixed(4)}, {c.lng.toFixed(4)}</div>
                    {c.note && <div className="mt-1 text-xs italic">“{c.note}”</div>}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </TabsContent>

        <TabsContent value="badges"><BadgeGrid badges={stats.badges} /></TabsContent>
        <TabsContent value="board"><Leaderboard highlightId={me.id} /></TabsContent>
      </Tabs>

      <TripFormDialog open={newOpen || !!editTrip} initial={editTrip} onOpenChange={(o) => { if (!o) { setNewOpen(false); setEditTrip(undefined); } }} />
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Join a trip</DialogTitle><DialogDescription>Enter the 6-character code from your trip leader.</DialogDescription></DialogHeader>
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="NSTW30" className="text-center font-mono text-xl tracking-[0.3em]" maxLength={8} />
          <DialogFooter><Button onClick={doJoin} disabled={code.length < 4}>Join trip</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      {checkTrip && <CheckInDialog trip={checkTrip} open={!!checkTrip} onOpenChange={(o) => !o && setCheckTrip(null)} onReward={onReward} />}
      <RewardOverlay reward={reward} onDone={() => setReward(null)} />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
