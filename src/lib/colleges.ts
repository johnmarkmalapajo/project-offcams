// GUESS: placeholder list of colleges/departments. Replace with your university's official list.
export const COLLEGES: { code: string; name: string; color: string; departments: string[] }[] = [
  { code: "CAS", name: "College of Arts and Sciences", color: "#6366f1", departments: ["Biology", "Chemistry", "Mathematics", "Psychology", "Communication"] },
  { code: "CEIT", name: "College of Engineering & IT", color: "#0ea5e9", departments: ["Civil Engineering", "Electrical Engineering", "Computer Engineering", "Information Technology", "Computer Science"] },
  { code: "CBA", name: "College of Business & Accountancy", color: "#f59e0b", departments: ["Accountancy", "Marketing", "Financial Management", "Entrepreneurship"] },
  { code: "CED", name: "College of Education", color: "#10b981", departments: ["Elementary Education", "Secondary Education", "Physical Education"] },
  { code: "CON", name: "College of Nursing & Health Sciences", color: "#ec4899", departments: ["Nursing", "Medical Technology", "Pharmacy"] },
  { code: "CCJE", name: "College of Criminal Justice Education", color: "#ef4444", departments: ["Criminology"] },
];

export const collegeColor = (code: string) => COLLEGES.find((c) => c.code === code)?.color ?? "#64748b";
export const collegeName = (code: string) => COLLEGES.find((c) => c.code === code)?.name ?? code;
