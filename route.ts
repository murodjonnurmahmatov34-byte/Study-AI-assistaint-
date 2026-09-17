import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api";

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();

    const body = (await req.json().catch(() => null)) as { confirm?: string } | null;
    if (body?.confirm !== user.email) {
      return fail(400, "Type your account email to confirm deletion.");
    }

    // All user-owned data cascades via foreign keys.
    await db.delete(users).where(eq(users.id, user.id));

    const res = ok({ ok: true });
    const store = await cookies();
    const raw = store.get(SESSION_COOKIE)?.value;
    if (raw) res.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
    return res;
  } catch (err) {
    return handleApiError(err);
  }
}
