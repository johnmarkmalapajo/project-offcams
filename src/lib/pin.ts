// shortcut: PIN hash is readable by anyone with the public key, so it stops casual mix-ups, not attackers; move to Supabase Auth after the pilot.
export async function pinHash(studentNo: string, pin: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`offcams:${studentNo.trim().toUpperCase()}:${pin}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
