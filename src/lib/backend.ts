"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CheckIn, DB, Student, Trip } from "./types";
import { makeSeed } from "./seed";

export interface Backend {
  kind: "demo" | "supabase";
  load(): Promise<DB>;
  saveStudent(s: Student): Promise<void>;
  saveTrip(t: Trip): Promise<void>;
  addCheckIn(c: CheckIn, photo?: Blob): Promise<CheckIn>;
  subscribe(onChange: () => void): () => void;
  reset?(): Promise<void>;
}

// shortcut: demo data lives in this browser only (syncs across tabs, not devices); set Supabase env vars for shared real-time data.
const KEY = "offcams-db-v1";
class LocalBackend implements Backend {
  kind = "demo" as const;
  private ch = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("offcams") : null;
  private read(): DB {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    const seed = makeSeed();
    this.write(seed, false);
    return seed;
  }
  private write(db: DB, notify = true) {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { console.warn("storage full?", e); }
    if (notify) this.ch?.postMessage("changed");
  }
  async load() { return this.read(); }
  async saveStudent(s: Student) {
    const db = this.read();
    db.students = [...db.students.filter((x) => x.id !== s.id), s];
    this.write(db);
  }
  async saveTrip(t: Trip) {
    const db = this.read();
    db.trips = [...db.trips.filter((x) => x.id !== t.id), t];
    this.write(db);
  }
  async addCheckIn(c: CheckIn) {
    const db = this.read();
    db.checkins = [...db.checkins, c];
    this.write(db);
    return c;
  }
  subscribe(onChange: () => void) {
    const h = () => onChange();
    this.ch?.addEventListener("message", h);
    const s = (e: StorageEvent) => e.key === KEY && onChange();
    window.addEventListener("storage", s);
    return () => { this.ch?.removeEventListener("message", h); window.removeEventListener("storage", s); };
  }
  async reset() { localStorage.removeItem(KEY); this.ch?.postMessage("changed"); }
}

/* ---------------- Supabase backend (enabled when env vars are set) ---------------- */
const BUCKET = "checkin-photos";
class SupabaseBackend implements Backend {
  kind = "supabase" as const;
  constructor(private sb: SupabaseClient) {}
  async load(): Promise<DB> {
    const [s, t, c] = await Promise.all([
      this.sb.from("students").select("*"),
      this.sb.from("trips").select("*"),
      this.sb.from("checkins").select("*").order("created_at", { ascending: true }).limit(5000),
    ]);
    if (s.error || t.error || c.error) throw s.error || t.error || c.error;
    return {
      students: s.data!.map((r) => ({ id: r.id, name: r.name, studentNo: r.student_no, college: r.college, department: r.department, createdAt: r.created_at })),
      trips: t.data!.map((r) => ({ id: r.id, code: r.code, title: r.title, destination: r.destination, purpose: r.purpose ?? undefined, ingress: r.ingress, egress: r.egress, days: r.days, delegateIds: r.delegate_ids, createdBy: r.created_by, createdAt: r.created_at })),
      checkins: c.data!.map((r) => ({ id: r.id, tripId: r.trip_id, studentId: r.student_id, lat: r.lat, lng: r.lng, accuracy: r.accuracy ?? undefined, photo: r.photo_url ?? undefined, note: r.note ?? undefined, day: r.day ?? undefined, legId: r.leg_id ?? undefined, legLabel: r.leg_label ?? undefined, createdAt: r.created_at })),
    };
  }
  async saveStudent(s: Student) {
    const { error } = await this.sb.from("students").upsert({ id: s.id, name: s.name, student_no: s.studentNo, college: s.college, department: s.department, created_at: s.createdAt });
    if (error) throw error;
  }
  async saveTrip(t: Trip) {
    const { error } = await this.sb.from("trips").upsert({ id: t.id, code: t.code, title: t.title, destination: t.destination, purpose: t.purpose ?? null, ingress: t.ingress, egress: t.egress, days: t.days, delegate_ids: t.delegateIds, created_by: t.createdBy, created_at: t.createdAt });
    if (error) throw error;
  }
  async addCheckIn(c: CheckIn, photo?: Blob) {
    let photoUrl: string | undefined;
    if (photo) {
      const path = `${c.tripId}/${c.studentId}/${c.id}.jpg`;
      const up = await this.sb.storage.from(BUCKET).upload(path, photo, { contentType: "image/jpeg", upsert: true });
      if (up.error) throw up.error;
      photoUrl = this.sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }
    const { error } = await this.sb.from("checkins").insert({ id: c.id, trip_id: c.tripId, student_id: c.studentId, lat: c.lat, lng: c.lng, accuracy: c.accuracy ?? null, photo_url: photoUrl ?? null, note: c.note ?? null, day: c.day ?? null, leg_id: c.legId ?? null, leg_label: c.legLabel ?? null, created_at: c.createdAt });
    if (error) throw error;
    return { ...c, photo: photoUrl };
  }
  subscribe(onChange: () => void) {
    const ch = this.sb.channel("offcams-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "checkins" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, onChange)
      .subscribe();
    return () => { this.sb.removeChannel(ch); };
  }
}

export function createBackend(): Backend {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) return new SupabaseBackend(createClient(url, key));
  return new LocalBackend();
}
