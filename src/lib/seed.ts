import { addDays } from "date-fns";
import type { CheckIn, DB, Student, Trip } from "./types";
import { ymd } from "./dates";

const svgPhoto = (label: string, hue: number) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='320'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${hue},10%,72%)'/><stop offset='1' stop-color='hsl(${hue},12%,48%)'/></linearGradient></defs><rect width='480' height='320' fill='url(#g)'/><circle cx='240' cy='130' r='34' fill='white' fill-opacity='.9'/><circle cx='240' cy='130' r='12' fill='hsl(${hue},10%,40%)'/><path d='M240 200 L214 150 L266 150 Z' fill='white' fill-opacity='.9'/><text x='240' y='260' font-family='sans-serif' font-size='22' fill='white' text-anchor='middle'>${label}</text><text x='240' y='290' font-family='sans-serif' font-size='13' fill='white' fill-opacity='.8' text-anchor='middle'>Sample proof photo</text></svg>`
  );

const S = (id: string, name: string, studentNo: string, college: string, department: string): Student => ({
  id, name, studentNo, college, department, createdAt: new Date().toISOString(),
});

// Approximate coordinates (GUESS) for demo purposes.
export const PLACES = {
  naia: { lat: 14.5086, lng: 121.0198, label: "NAIA Terminal 3, Manila" },
  gesAirport: { lat: 6.058, lng: 125.0961, label: "General Santos Int'l Airport" },
  gesLodging: { lat: 6.1128, lng: 125.1717, label: "Lodging, General Santos" },
  gmall: { lat: 6.1164, lng: 125.1716, label: "GMALL, General Santos" },
  davaoSMX: { lat: 7.0496, lng: 125.5886, label: "SMX Convention Center, Davao" },
  davaoHotel: { lat: 7.0731, lng: 125.6128, label: "Hotel, Davao City" },
  cebuIT: { lat: 10.3299, lng: 123.9058, label: "Cebu IT Park" },
  iloilo: { lat: 10.7202, lng: 122.5621, label: "Iloilo Convention Center" },
};

export function makeSeed(): DB {
  const today = new Date();
  const students: Student[] = [
    S("s1", "Juan Dela Cruz", "2023-00123", "CICS", "Computer Science"),
    S("s2", "Maria Santos", "2023-00456", "CICS", "Information Technology"),
    S("s3", "Paolo Reyes", "2022-01187", "COE", "Computer Engineering"),
    S("s4", "Angela Lim", "2024-00311", "CED", "Secondary Education"),
    S("s5", "Kevin Ramos", "2022-00992", "COE", "Civil Engineering"),
    S("s6", "Bea Villanueva", "2023-01540", "COE", "Electrical Engineering"),
    S("s7", "Carlo Mendoza", "2023-01612", "COE", "Electrical Engineering"),
    S("s8", "Ella Navarro", "2022-00777", "COE", "Mechanical Engineering"),
    S("s9", "Rafael Cruz", "2021-00451", "CICS", "Information Systems"),
    S("s10", "Sofia Garcia", "2021-00510", "CICS", "Information Systems"),
    S("s11", "Miguel Torres", "2024-00801", "CED", "Secondary Education"),
    S("s12", "Liza Bautista", "2023-00999", "CED", "Elementary Education"),
  ];

  const rel = (n: number) => ymd(addDays(today, n));
  const leg = (id: string, from: string, to: string, note?: string) => ({ id, from, to, note });

  const trips: Trip[] = [
    {
      id: "t1", code: "NSTW30", title: "DOST NSTW Level Up 3.0", destination: "General Santos City",
      purpose: "National Science and Technology Week delegation",
      ingress: "2026-11-25", egress: "2026-11-27",
      days: [
        { day: 1, date: "2026-11-25", legs: [leg("l1", "MNL", "Gensan", "Flight via NAIA T3")] },
        { day: 2, date: "2026-11-26", legs: [leg("l2", "Gensan (Lodging)", "GMALL (event location)")] },
        { day: 3, date: "2026-11-27", legs: [leg("l3", "Gensan (Lodging)", "GMALL (event location)"), leg("l4", "GMALL", "Airport")] },
      ],
      delegateIds: ["s1", "s2", "s3", "s4", "s5", "s12"], createdBy: "s1", createdAt: new Date().toISOString(),
    },
    {
      id: "t2", code: "NURSE4", title: "Regional Engineering Skills Olympics", destination: "Davao City",
      ingress: rel(-1), egress: rel(1),
      days: [
        { day: 1, date: rel(-1), legs: [leg("m1", "Campus", "Davao City (Hotel)")] },
        { day: 2, date: rel(0), legs: [leg("m2", "Hotel", "SMX Convention Center")] },
        { day: 3, date: rel(1), legs: [leg("m3", "SMX", "Campus")] },
      ],
      delegateIds: ["s6", "s7", "s8"], createdBy: "s6", createdAt: new Date().toISOString(),
    },
    {
      id: "t3", code: "CPA777", title: "Regional IT Quiz Bee", destination: "Cebu City",
      ingress: rel(5), egress: rel(7),
      days: [
        { day: 1, date: rel(5), legs: [leg("n1", "Campus", "Cebu City")] },
        { day: 2, date: rel(6), legs: [leg("n2", "Lodging", "Cebu IT Park")] },
        { day: 3, date: rel(7), legs: [leg("n3", "Cebu City", "Campus")] },
      ],
      delegateIds: ["s9", "s10"], createdBy: "s9", createdAt: new Date().toISOString(),
    },
    {
      id: "t4", code: "EDU101", title: "Teacher Education Summit", destination: "Iloilo City",
      ingress: rel(-12), egress: rel(-10),
      days: [
        { day: 1, date: rel(-12), legs: [leg("o1", "Campus", "Iloilo")] },
        { day: 2, date: rel(-11), legs: [leg("o2", "Lodging", "Iloilo Convention Center")] },
        { day: 3, date: rel(-10), legs: [leg("o3", "Iloilo", "Campus")] },
      ],
      delegateIds: ["s11", "s4"], createdBy: "s11", createdAt: new Date().toISOString(),
    },
  ];

  const jitter = (v: number) => v + (Math.random() - 0.5) * 0.004;
  const hoursAgo = (h: number) => new Date(Date.now() - h * 36e5).toISOString();
  const daysAgoAt = (d: number, hour: number) => { const x = addDays(today, -d); x.setHours(hour, Math.floor(Math.random() * 59)); return x.toISOString(); };
  let n = 0;
  const C = (tripId: string, studentId: string, p: { lat: number; lng: number; label: string }, createdAt: string, legId: string, legLabel: string, note?: string, hue = 220): CheckIn => ({
    id: `c${++n}`, tripId, studentId, lat: jitter(p.lat), lng: jitter(p.lng), accuracy: 12 + Math.round(Math.random() * 20),
    photo: svgPhoto(p.label, hue), note, legId, legLabel, createdAt,
  });

  const checkins: CheckIn[] = [];
  // DOST trip: everyone at NAIA, most landed in Gensan, a couple already at lodging; s12 has not checked in (overdue demo)
  for (const s of ["s1", "s2", "s3", "s4", "s5"]) checkins.push(C("t1", s, PLACES.naia, hoursAgo(9 + Math.random()), "l1", "MNL → Gensan", "Boarding at NAIA", 210));
  for (const s of ["s1", "s2", "s3", "s4"]) checkins.push(C("t1", s, PLACES.gesAirport, hoursAgo(4 + Math.random()), "l1", "MNL → Gensan", "Landed safely!", 160));
  for (const s of ["s1", "s3"]) checkins.push(C("t1", s, PLACES.gesLodging, hoursAgo(1 + Math.random()), "l1", "MNL → Gensan", "Checked in at lodging", 280));
  // Davao trip: day 1 + today
  for (const s of ["s6", "s7", "s8"]) checkins.push(C("t2", s, PLACES.davaoHotel, daysAgoAt(1, 15), "m1", "Campus → Davao City (Hotel)", undefined, 330));
  for (const s of ["s6", "s7"]) checkins.push(C("t2", s, PLACES.davaoSMX, hoursAgo(2 + Math.random() * 2), "m2", "Hotel → SMX Convention Center", "Competition starts 1PM", 20));
  // Completed Iloilo trip
  for (const [d, p] of [[12, PLACES.iloilo], [11, PLACES.iloilo], [10, PLACES.iloilo]] as const)
    for (const s of ["s11", "s4"]) checkins.push(C("t4", s, p, daysAgoAt(d, 9), "o2", "Lodging → Iloilo Convention Center", undefined, 100));

  return { students, trips, checkins };
}
