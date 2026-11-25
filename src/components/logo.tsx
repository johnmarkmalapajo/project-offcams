import Link from "next/link";
export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-extrabold tracking-tight">
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-white shadow">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" /><path d="m9 10 2 2 4-4" /></svg>
      </span>
      <span>Off<span className="text-primary">Cams</span></span>
    </Link>
  );
}
