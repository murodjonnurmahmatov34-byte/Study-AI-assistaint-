import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { fail, handleApiError, ok } from "@/lib/api";
import { limits } from "@/lib/ratelimit";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!limits.generalPerUser(user.id)) {
      return fail(429, "Too many requests. Please try again shortly.");
    }

    const body = (await req.json().catch(() => null)) as {
      current?: string;
      next?: string;
      confirm?: string;
    } | null;

    const current = body?.current ?? "";
    const next = body?.next ?? "";
    const confirm = body?.confirm ?? "";

    if (!verifyPassword(current, user.passwordHash)) {
      return fail(401, "Your current password is incorrect.");
    }
    if (next.length < 8)
      return fail(400, "New password must be at least 8 characters long.");
    if (!/[a-zA-Z]/.test(next) || !/\d/.test(next))
      return fail(400, "New password must include at least one letter and one number.");
    if (next === current)
      return fail(400, "New password must be different from the current one.");
    if (next !== confirm) return fail(400, "Passwords do not match.");

    await db
      .update(users)
      .set({ passwordHash: hashPassword(next), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    return ok({ ok: true, message: "Password updated successfully." });
  } catch (err) {
    return handleApiError(err);
  }
}
