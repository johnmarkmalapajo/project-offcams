export type Leg = { id: string; from: string; to: string; note?: string };
export type ItineraryDay = { day: number; date: string; legs: Leg[] };

export type Student = {
  id: string;
  name: string;
  studentNo: string;
  college: string;
  department: string;
  pinHash?: string;
  createdAt: string;
};

export type Trip = {
  id: string;
  code: string; // join code for co-delegates
  title: string;
  destination: string;
  purpose?: string;
  ingress: string; // yyyy-mm-dd
  egress: string; // yyyy-mm-dd
  days: ItineraryDay[];
  delegateIds: string[];
  createdBy: string;
  createdAt: string;
};

export type CheckIn = {
  id: string;
  tripId: string;
  studentId: string;
  lat: number;
  lng: number;
  accuracy?: number;
  photo?: string; // data URL (demo) or storage URL (Supabase)
  note?: string;
  day?: number;
  legId?: string;
  legLabel?: string;
  createdAt: string; // ISO
};

export type DB = { students: Student[]; trips: Trip[]; checkins: CheckIn[] };
