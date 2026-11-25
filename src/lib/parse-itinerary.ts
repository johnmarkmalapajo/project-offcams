import type { ItineraryDay } from "./types";

/**
 * Parses a pasted itinerary like:
 *   DOST NSTW Level Up 3.0
 *   General Santos City
 *   Ingress: November 25, 2026
 *   Egress: November 27, 2026
 *   Activities
 *   Day 1 - MNL to Gensan
 *   Day 3 - Gensan (Lodging) to GMALL (event location)
 *   - GMALL to Airport
 */
export function parseItinerary(text: string) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: { title?: string; destination?: string; ingress?: string; egress?: string; legs: Record<number, { from: string; to: string }[]> } = { legs: {} };
  const header: string[] = [];
  let curDay = 0;
  const toYmd = (s: string) => { const d = new Date(s); return isNaN(+d) ? undefined : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const splitLeg = (s: string) => {
    const m = s.split(/\s+(?:to|→|->)\s+/i);
    return m.length >= 2 ? { from: m[0].trim(), to: m.slice(1).join(" to ").replace(/\s*(etc\.*)$/i, "").trim() } : { from: s.trim(), to: "" };
  };
  for (const l of lines) {
    let m;
    if ((m = l.match(/^ingress\s*:\s*(.+)$/i))) { out.ingress = toYmd(m[1]); continue; }
    if ((m = l.match(/^egress\s*:\s*(.+)$/i))) { out.egress = toYmd(m[1]); continue; }
    if (/^activities?$/i.test(l)) continue;
    if ((m = l.match(/^day\s*(\d+)\s*[-–:]\s*(.+)$/i))) { curDay = +m[1]; (out.legs[curDay] ||= []).push(splitLeg(m[2])); continue; }
    if ((m = l.match(/^[-–•]\s*(.+)$/)) && curDay) { out.legs[curDay].push(splitLeg(m[1])); continue; }
    if (!curDay) header.push(l);
  }
  out.title = header[0];
  out.destination = header[1];
  return out;
}

export function mergeLegs(days: ItineraryDay[], legs: Record<number, { from: string; to: string }[]>, mkId: () => string) {
  return days.map((d) => (legs[d.day] ? { ...d, legs: legs[d.day].map((l) => ({ id: mkId(), ...l })) } : d));
}
