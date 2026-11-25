"use client";
import * as React from "react";
import type { CheckIn, DB, Student, Trip } from "./types";
import { toast } from "sonner";
import { createBackend, type Backend } from "./backend";

const ME_KEY = "offcams-me";
const STAFF_KEY = "offcams-staff";
// shortcut: shared demo passcode, not real security; replace with Supabase Auth staff accounts before real use.
export const STAFF_PASSCODE = process.env.NEXT_PUBLIC_STAFF_PASSCODE || "vpsas2026";

export const uid = (p = "") => p + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const joinCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

type Ctx = {
  db: DB;
  ready: boolean;
  backend: Backend["kind"];
  me: Student | null;
  isStaff: boolean;
  lastEventAt: number;
  register(s: Omit<Student, "id" | "createdAt">): Promise<Student>;
  signInAs(id: string): void;
  signOut(): void;
  saveTrip(t: Trip): Promise<void>;
  joinTrip(code: string): Promise<Trip | null>;
  addCheckIn(c: CheckIn, photo?: Blob): Promise<void>;
  staffLogin(pass: string): boolean;
  staffLogout(): void;
  resetDemo(): Promise<void>;
};

const StoreCtx = React.createContext<Ctx | null>(null);
const empty: DB = { students: [], trips: [], checkins: [] };

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const backendRef = React.useRef<Backend | null>(null);
  const [db, setDb] = React.useState<DB>(empty);
  const [ready, setReady] = React.useState(false);
  const [meId, setMeId] = React.useState<string | null>(null);
  const [isStaff, setIsStaff] = React.useState(false);
  const [lastEventAt, setLastEventAt] = React.useState(0);

  const refresh = React.useCallback(async () => {
    const b = backendRef.current!;
    setDb(await b.load());
  }, []);

  React.useEffect(() => {
    const b = createBackend();
    backendRef.current = b;
    try {
      setMeId(localStorage.getItem(ME_KEY));
      setIsStaff(localStorage.getItem(STAFF_KEY) === "1");
    } catch {}
    b.load().then((d) => { setDb(d); setReady(true); }).catch((e) => { console.error(e); toast.error("Couldn’t load data from the server", { description: e?.message }); setReady(true); });
    const unsub = b.subscribe(() => { setLastEventAt(Date.now()); refresh(); });
    // fallback poll so the staff map stays fresh even if realtime drops
    const iv = setInterval(refresh, 30000);
    return () => { unsub(); clearInterval(iv); };
  }, [refresh]);

  const me = db.students.find((s) => s.id === meId) ?? null;

  const value: Ctx = {
    db, ready, me, isStaff, lastEventAt,
    backend: backendRef.current?.kind ?? "demo",
    async register(s) {
      const st: Student = { ...s, id: uid("s_"), createdAt: new Date().toISOString() };
      await backendRef.current!.saveStudent(st);
      localStorage.setItem(ME_KEY, st.id);
      setMeId(st.id);
      await refresh();
      return st;
    },
    signInAs(id) { localStorage.setItem(ME_KEY, id); setMeId(id); },
    signOut() { localStorage.removeItem(ME_KEY); setMeId(null); },
    async saveTrip(t) { await backendRef.current!.saveTrip(t); await refresh(); },
    async joinTrip(code) {
      const t = db.trips.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
      if (!t || !meId) return null;
      if (!t.delegateIds.includes(meId)) {
        const nt = { ...t, delegateIds: [...t.delegateIds, meId] };
        await backendRef.current!.saveTrip(nt);
        await refresh();
        return nt;
      }
      return t;
    },
    async addCheckIn(c, photo) { await backendRef.current!.addCheckIn(c, photo); await refresh(); },
    staffLogin(pass) {
      if (pass.trim() !== STAFF_PASSCODE) return false;
      localStorage.setItem(STAFF_KEY, "1"); setIsStaff(true); return true;
    },
    staffLogout() { localStorage.removeItem(STAFF_KEY); setIsStaff(false); },
    async resetDemo() { await backendRef.current!.reset?.(); await refresh(); },
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = React.useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}
