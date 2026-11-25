// Pilot list from VPSAS (2026-11-25). Departments are suggestions only; students can type their own.
export const COLLEGES: { code: string; name: string; color: string; departments: string[] }[] = [
  { code: "CICS", name: "College of Information and Computing Sciences", color: "#0891b2", departments: ["Computer Science", "Information Technology", "Information Systems"] },
  { code: "COE", name: "College of Engineering", color: "#d97706", departments: ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering", "Computer Engineering"] },
  { code: "CED", name: "College of Education", color: "#16a34a", departments: ["Elementary Education", "Secondary Education", "Physical Education"] },
];

export const collegeColor = (code: string) => COLLEGES.find((c) => c.code === code)?.color ?? "#64748b";
export const collegeName = (code: string) => COLLEGES.find((c) => c.code === code)?.name ?? code;
