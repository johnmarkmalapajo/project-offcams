"use client";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Crosshair, Loader2, MapPin, RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, uid } from "@/lib/store";
import { studentStats, xpForCheckIn, type Badge } from "@/lib/gamify";
import { tripDayIndex } from "@/lib/dates";
import type { Trip } from "@/lib/types";

type Fix = { lat: number; lng: number; accuracy: number };

async function compress(file: File, max = 900, q = 0.65): Promise<{ blob: Blob; dataUrl: string }> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  // timestamp watermark for proof
  const stamp = format(new Date(), "MMM d, yyyy h:mm a");
  ctx.font = `${Math.max(14, c.width / 32)}px sans-serif`;
  ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(0, c.height - c.width / 14, c.width, c.width / 14);
  ctx.fillStyle = "#fff"; ctx.fillText(`OffCams · ${stamp}`, 10, c.height - c.width / 40);
  const dataUrl = c.toDataURL("image/jpeg", q);
  const blob = await (await fetch(dataUrl)).blob();
  return { blob, dataUrl };
}

export function CheckInDialog({ trip, open, onOpenChange, onReward }: {
  trip: Trip; open: boolean; onOpenChange: (o: boolean) => void;
  onReward: (r: { xp: number; levelUp?: number; badges: Badge[] }) => void;
}) {
  const { me, db, addCheckIn } = useStore();
  const [fix, setFix] = React.useState<Fix | null>(null);
  const [locating, setLocating] = React.useState(false);
  const [locErr, setLocErr] = React.useState<string | null>(null);
  const [photo, setPhoto] = React.useState<{ blob: Blob; dataUrl: string } | null>(null);
  const [note, setNote] = React.useState("");
  const [legId, setLegId] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const { current } = tripDayIndex(trip);
  const todayDay = trip.days.find((d) => d.day === current) ?? trip.days[0];
  const allLegs = trip.days.flatMap((d) => d.legs.map((l) => ({ ...l, day: d.day })));

  const locate = React.useCallback(() => {
    if (!("geolocation" in navigator)) { setLocErr("This device does not support GPS location."); return; }
    setLocating(true); setLocErr(null);
    navigator.geolocation.getCurrentPosition(
      (p) => { setFix({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) }); setLocating(false); },
      (e) => { setLocErr(e.code === 1 ? "Location permission denied. Allow location access in your browser settings and try again." : "Couldn’t get your location. Move to an open area and retry."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, []);

  React.useEffect(() => {
    if (open) { setFix(null); setPhoto(null); setNote(""); setLegId(todayDay?.legs[0]?.id ?? ""); locate(); }
  }, [open, locate, todayDay]);

  const onFile = async (f?: File) => {
    if (!f) return;
    try { setPhoto(await compress(f)); } catch { toast.error("Couldn’t read that image"); }
  };

  const submit = async () => {
    if (!me || !fix || !photo) return;
    setSaving(true);
    const leg = allLegs.find((l) => l.id === legId);
    const c = {
      id: uid("c_"), tripId: trip.id, studentId: me.id, lat: fix.lat, lng: fix.lng, accuracy: fix.accuracy,
      photo: photo.dataUrl, note: note.trim() || undefined, day: leg?.day ?? current, legId: leg?.id, legLabel: leg ? `${leg.from} → ${leg.to}` : undefined,
      createdAt: new Date().toISOString(),
    };
    const before = studentStats(me.id, db);
    const xp = xpForCheckIn(c, db);
    try {
      await addCheckIn(c, photo.blob);
      const after = studentStats(me.id, { ...db, checkins: [...db.checkins, c] });
      const newBadges = after.badges.filter((b) => b.earned && !before.badges.find((x) => x.id === b.id)?.earned);
      onOpenChange(false);
      onReward({ xp, levelUp: after.level > before.level ? after.level : undefined, badges: newBadges });
    } catch (e) {
      console.error(e);
      toast.error("Check-in failed to upload. Please retry.");
    } finally { setSaving(false); }
  };

  const steps = [!!fix, !!photo];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check in · {trip.title}</DialogTitle>
          <DialogDescription>Day {current} of {trip.days.length} · {format(new Date(), "EEE, MMM d · h:mm a")}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          {["Location", "Photo proof", "Submit"].map((s, i) => (
            <div key={s} className="flex-1">
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <motion.div className="h-full bg-success" initial={{ width: 0 }} animate={{ width: i < 2 ? (steps[i] ? "100%" : "0%") : steps.every(Boolean) ? "100%" : "0%" }} />
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">{s}</div>
            </div>
          ))}
        </div>

        {/* Location */}
        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="relative grid size-14 place-items-center">
              {locating && [0, 0.6, 1.2].map((d) => (
                <motion.span key={d} className="absolute inset-0 rounded-full border-2 border-primary"
                  initial={{ scale: 0.3, opacity: 1 }} animate={{ scale: 1.4, opacity: 0 }} transition={{ duration: 1.8, delay: d, repeat: Infinity }} />
              ))}
              <div className={`grid size-10 place-items-center rounded-full ${fix ? "bg-success text-white" : "bg-primary text-primary-foreground"}`}>
                {fix ? <Check className="size-5" /> : locating ? <Crosshair className="size-5 animate-spin" style={{ animationDuration: "3s" }} /> : <MapPin className="size-5" />}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm">{fix ? "Location locked" : locating ? "Finding you…" : "Location needed"}</div>
              {fix && <div className="text-xs text-muted-foreground font-mono">{fix.lat.toFixed(6)}, {fix.lng.toFixed(6)} · ±{fix.accuracy}m</div>}
              {locErr && <div className="text-xs text-destructive">{locErr}</div>}
            </div>
            {!locating && <Button size="icon" variant="ghost" onClick={locate} aria-label="Retry location"><RefreshCw /></Button>}
          </div>
        </div>

        {/* Photo */}
        <div className="rounded-xl border p-4">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <AnimatePresence mode="wait">
            {photo ? (
              <motion.div key="p" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative">
                <img src={photo.dataUrl} alt="Proof" className="max-h-56 w-full rounded-lg object-cover" />
                <Button size="sm" variant="secondary" className="absolute right-2 top-2" onClick={() => fileRef.current?.click()}><RefreshCw /> Retake</Button>
              </motion.div>
            ) : (
              <motion.button key="b" type="button" onClick={() => fileRef.current?.click()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed py-6 text-sm text-muted-foreground hover:border-primary hover:text-primary">
                <Camera className="size-8" /> Take a photo as proof of location
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="grid gap-3">
          {allLegs.length > 0 && (
            <div className="grid gap-1.5">
              <Label>Which activity?</Label>
              <Select value={legId} onValueChange={setLegId}>
                <SelectTrigger><SelectValue placeholder="Select itinerary leg" /></SelectTrigger>
                <SelectContent>
                  {allLegs.map((l) => <SelectItem key={l.id} value={l.id}>Day {l.day}: {l.from} → {l.to}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-1.5"><Label>Note (optional, +5 XP)</Label><Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="e.g. Arrived at venue, registration done" /></div>
        </div>

        <Button size="lg" disabled={!fix || !photo || saving} onClick={submit}>
          {saving ? <Loader2 className="animate-spin" /> : <MapPin />} Check in now
          {me && fix && photo && <span className="ml-1 rounded bg-primary-foreground/15 px-1.5 font-mono text-xs">+{xpForCheckIn({ photo: "x", note: note.trim() || undefined, tripId: trip.id, studentId: me.id }, db)} XP</span>}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
