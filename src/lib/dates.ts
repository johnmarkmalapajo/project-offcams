import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

export const ymd = (d: Date) => format(d, "yyyy-MM-dd");
export const todayYmd = () => ymd(new Date());

export function tripStatus(t: { ingress: string; egress: string }, now = new Date()) {
  const today = ymd(now);
  if (today < t.ingress) return "upcoming" as const;
  if (today > t.egress) return "completed" as const;
  return "ongoing" as const;
}

export function tripDayIndex(t: { ingress: string; egress: string }, now = new Date()) {
  const total = differenceInCalendarDays(parseISO(t.egress), parseISO(t.ingress)) + 1;
  const cur = differenceInCalendarDays(now, parseISO(t.ingress)) + 1;
  return { current: Math.min(Math.max(cur, 0), total), total };
}

export function daysBetween(ingress: string, egress: string) {
  const n = differenceInCalendarDays(parseISO(egress), parseISO(ingress)) + 1;
  return Array.from({ length: Math.max(n, 0) }, (_, i) => ymd(addDays(parseISO(ingress), i)));
}

export const prettyDate = (s: string) => format(parseISO(s), "MMMM d, yyyy");
export const shortDate = (s: string) => format(parseISO(s), "MMM d");
