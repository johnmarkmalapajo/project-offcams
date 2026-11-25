"use client";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, Wand2, CalendarDays, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore, uid, joinCode } from "@/lib/store";
import { daysBetween, prettyDate, todayYmd } from "@/lib/dates";
import { mergeLegs, parseItinerary } from "@/lib/parse-itinerary";
import type { ItineraryDay, Trip } from "@/lib/types";
import { celebrate } from "./gamify";

export function TripFormDialog({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (o: boolean) => void; initial?: Trip }) {
  const { me, saveTrip } = useStore();
  const [title, setTitle] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [purpose, setPurpose] = React.useState("");
  const [ingress, setIngress] = React.useState(todayYmd());
  const [egress, setEgress] = React.useState(todayYmd());
  const [days, setDays] = React.useState<ItineraryDay[]>([]);
  const [paste, setPaste] = React.useState("");
  const [showPaste, setShowPaste] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? ""); setDestination(initial?.destination ?? ""); setPurpose(initial?.purpose ?? "");
    setIngress(initial?.ingress ?? todayYmd()); setEgress(initial?.egress ?? todayYmd());
    setDays(initial?.days ?? []); setPaste(""); setShowPaste(false);
  }, [open, initial]);

  // keep days in sync with date range, preserving existing legs
  React.useEffect(() => {
    if (!ingress || !egress || egress < ingress) return;
    setDays((prev) => daysBetween(ingress, egress).map((date, i) => {
      const old = prev.find((d) => d.day === i + 1);
      return { day: i + 1, date, legs: old?.legs?.length ? old.legs : [{ id: uid("l_"), from: "", to: "" }] };
    }));
  }, [ingress, egress]);

  const applyPaste = () => {
    const p = parseItinerary(paste);
    if (p.title) setTitle(p.title);
    if (p.destination) setDestination(p.destination);
    if (p.ingress) setIngress(p.ingress);
    if (p.egress) setEgress(p.egress);
    const ing = p.ingress ?? ingress, eg = p.egress ?? egress;
    const base = daysBetween(ing, eg).map((date, i) => ({ day: i + 1, date, legs: [{ id: uid("l_"), from: "", to: "" }] }));
    setTimeout(() => setDays(mergeLegs(base, p.legs, () => uid("l_"))), 0);
    setShowPaste(false);
    toast.success("Itinerary imported", { description: `${Object.keys(p.legs).length} day(s) of activities detected` });
  };

  const setLeg = (day: number, id: string, k: "from" | "to", v: string) =>
    setDays((ds) => ds.map((d) => (d.day === day ? { ...d, legs: d.legs.map((l) => (l.id === id ? { ...l, [k]: v } : l)) } : d)));
  const addLeg = (day: number) => setDays((ds) => ds.map((d) => (d.day === day ? { ...d, legs: [...d.legs, { id: uid("l_"), from: d.legs.at(-1)?.to ?? "", to: "" }] } : d)));
  const rmLeg = (day: number, id: string) => setDays((ds) => ds.map((d) => (d.day === day ? { ...d, legs: d.legs.filter((l) => l.id !== id) } : d)));

  const submit = async () => {
    if (!me) return;
    if (!title.trim() || !destination.trim()) return toast.error("Add an activity title and destination");
    if (egress < ingress) return toast.error("Egress must be on or after ingress");
    const clean = days.map((d) => ({ ...d, legs: d.legs.filter((l) => l.from.trim() || l.to.trim()) }));
    const t: Trip = initial
      ? { ...initial, title, destination, purpose, ingress, egress, days: clean }
      : { id: uid("t_"), code: joinCode(), title, destination, purpose, ingress, egress, days: clean, delegateIds: [me.id], createdBy: me.id, createdAt: new Date().toISOString() };
    await saveTrip(t);
    onOpenChange(false);
    if (!initial) { celebrate(); toast.success("Trip created! +30 XP", { description: `Share join code ${t.code} with your co-delegates` }); }
    else toast.success("Trip updated");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit trip" : "New off-campus activity"}</DialogTitle>
          <DialogDescription>Fill in the details, or paste your itinerary and we’ll fill it for you.</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-dashed p-3">
          <button type="button" className="flex w-full items-center gap-2 text-sm font-medium" onClick={() => setShowPaste((s) => !s)}>
            <Wand2 className="size-4" /> Paste itinerary text
          </button>
          <AnimatePresence>
            {showPaste && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <Textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={7} className="mt-2 font-mono text-xs"
                  placeholder={"DOST NSTW Level Up 3.0\nGeneral Santos City\nIngress: November 25, 2026\nEgress: November 27, 2026\n\nActivities\nDay 1 - MNL to Gensan\nDay 2 - Gensan (Lodging) to GMALL (event location)\nDay 3 - Gensan (Lodging) to GMALL (event location)\n- GMALL to Airport"} />
                <Button size="sm" className="mt-2" onClick={applyPaste} disabled={!paste.trim()}><Wand2 /> Import</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2"><Label>Activity / event title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="DOST NSTW Level Up 3.0" /></div>
          <div className="grid gap-1.5"><Label>Destination</Label><Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="General Santos City" /></div>
          <div className="grid gap-1.5"><Label>Purpose (optional)</Label><Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Competition, seminar…" /></div>
          <div className="grid gap-1.5"><Label>Ingress</Label><Input type="date" value={ingress} onChange={(e) => setIngress(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>Egress</Label><Input type="date" value={egress} min={ingress} onChange={(e) => setEgress(e.target.value)} /></div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><CalendarDays className="size-4" /> Daily activities</div>
          {days.map((d) => (
            <motion.div layout key={d.day} className="rounded-xl border bg-muted/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-bold">Day {d.day} <span className="font-normal text-muted-foreground">· {prettyDate(d.date)}</span></div>
                <Button variant="ghost" size="sm" onClick={() => addLeg(d.day)}><Plus /> Leg</Button>
              </div>
              <AnimatePresence initial={false}>
                {d.legs.map((l) => (
                  <motion.div key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10, height: 0 }}
                    className="mb-2 flex items-center gap-2">
                    <Input value={l.from} onChange={(e) => setLeg(d.day, l.id, "from", e.target.value)} placeholder="From (e.g. Lodging)" />
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    <Input value={l.to} onChange={(e) => setLeg(d.day, l.id, "to", e.target.value)} placeholder="To (e.g. Event venue)" />
                    <Button variant="ghost" size="icon" onClick={() => rmLeg(d.day, l.id)} aria-label="Remove leg"><Trash2 className="text-muted-foreground" /></Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>{initial ? "Save changes" : "Create trip"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
