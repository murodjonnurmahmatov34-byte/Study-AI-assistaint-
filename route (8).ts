import { cookies } from "next/headers";
import { destroySession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { ok } from "@/lib/api";

export async function POST() {
  try {
    const store = await cookies();
    const raw = store.get(SESSION_COOKIE)?.value;
    if (raw) await destroySession(raw);
  } catch (err) {
    console.error("Logout error:", err);
  }
  const res = ok({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return res;
}
