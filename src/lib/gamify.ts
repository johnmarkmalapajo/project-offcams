import { differenceInCalendarDays, parseISO } from "date-fns";
import type { DB } from "./types";
import { daysBetween, ymd } from "./dates";

export const XP = { checkin: 50, photo: 20, note: 5, firstOfDay: 25, createTrip: 30, joinTrip: 15 };
const XP_PER_LEVEL = 250;
const TITLES = ["Campus Rookie", "Wayfinder", "Trailblazer", "Road Scholar", "Globetrotter", "Delegate Legend"];

export type Badge = { id: string; name: string; desc: string; earned: boolean };

export function studentStats(studentId: string, db: DB) {
  const mine = db.checkins.filter((c) => c.studentId === studentId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const trips = db.trips.filter((t) => t.delegateIds.includes(studentId));
  const created = trips.filter((t) => t.createdBy === studentId);

  let xp = created.length * XP.createTrip + (trips.length - created.length) * XP.joinTrip;
  const seenDays = new Set<string>();
  for (const c of mine) {
    xp += XP.checkin;
    if (c.photo) xp += XP.photo;
    if (c.note) xp += XP.note;
    const d = c.tripId + ymd(new Date(c.createdAt));
    if (!seenDays.has(d)) { xp += XP.firstOfDay; seenDays.add(d); }
  }

  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const into = xp % XP_PER_LEVEL;
  const title = TITLES[Math.min(level - 1, TITLES.length - 1)];

  // streak: consecutive days with a check-in, ending today or yesterday
  const daySet = new Set(mine.map((c) => ymd(new Date(c.createdAt))));
  let streak = 0;
  const cursor = new Date();
  if (!daySet.has(ymd(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (daySet.has(ymd(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }

  const hours = mine.map((c) => new Date(c.createdAt).getHours());
  const today = ymd(new Date());
  const perfect = trips.some((t) => {
    const days = daysBetween(t.ingress, t.egress).filter((d) => d <= today);
    if (days.length < 2) return false;
    const got = new Set(mine.filter((c) => c.tripId === t.id).map((c) => ymd(new Date(c.createdAt))));
    return days.every((d) => got.has(d));
  });

  const badges: Badge[] = [
    { id: "first", name: "First Steps", desc: "Make your first check-in", earned: mine.length >= 1 },
    { id: "shutter", name: "Shutterbug", desc: "5 check-ins with photo proof", earned: mine.filter((c) => c.photo).length >= 5 },
    { id: "early", name: "Early Bird", desc: "Check in before 7:00 AM", earned: hours.some((h) => h < 7) },
    { id: "owl", name: "Night Owl", desc: "Check in after 9:00 PM", earned: hours.some((h) => h >= 21) },
    { id: "streak3", name: "On Fire", desc: "3-day check-in streak", earned: streak >= 3 },
    { id: "perfect", name: "Perfect Attendance", desc: "Check in every day of a trip", earned: perfect },
    { id: "planner", name: "Master Planner", desc: "Create a trip with 4+ itinerary legs", earned: created.some((t) => t.days.reduce((n, d) => n + d.legs.length, 0) >= 4) },
    { id: "explorer", name: "Explorer", desc: "Join trips to 3 different places", earned: new Set(trips.map((t) => t.destination.toLowerCase())).size >= 3 },
    { id: "squad", name: "Squad Goals", desc: "Be on a trip with 3+ delegates", earned: trips.some((t) => t.delegateIds.length >= 3) },
  ];

  return { xp, level, title, into, perLevel: XP_PER_LEVEL, streak, badges, checkins: mine.length, trips: trips.length };
}

export function xpForCheckIn(c: { photo?: string; note?: string; tripId: string; studentId: string }, db: DB) {
  const today = ymd(new Date());
  const already = db.checkins.some((x) => x.studentId === c.studentId && x.tripId === c.tripId && ymd(new Date(x.createdAt)) === today);
  return XP.checkin + (c.photo ? XP.photo : 0) + (c.note ? XP.note : 0) + (already ? 0 : XP.firstOfDay);
}

export const hoursSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / 36e5;
export const daysUntil = (d: string) => differenceInCalendarDays(parseISO(d), new Date());
