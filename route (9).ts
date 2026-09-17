import { type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userPreferences, users } from "@/db/schema";
import {
  createSession,
  getPreferences,
  hashPassword,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api";
import { isEmail } from "@/lib/utils";
import { limits } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
    if (!limits.authPerIp(ip, "register")) {
      return fail(429, "Too many attempts. Please wait a few minutes and try again.");
    }

    const body = (await req.json().catch(() => null)) as {
      name?: string;
      email?: string;
      password?: string;
      confirm?: string;
    } | null;

    const name = (body?.name ?? "").trim();
    const email = (body?.email ?? "").trim().toLowerCase();
    const password = body?.password ?? "";
    const confirm = body?.confirm ?? "";

    if (name.length < 2 || name.length > 80)
      return fail(400, "Please enter your full name.");
    if (!isEmail(email))
      return fail(400, "Please enter a valid email address.");
    if (password.length < 8)
      return fail(400, "Password must be at least 8 characters long.");
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password))
      return fail(400, "Password must include at least one letter and one number.");
    if (password.length > 128)
      return fail(400, "Password is too long.");
    if (password !== confirm)
      return fail(400, "Passwords do not match.");

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing.length > 0)
      return fail(409, "An account with this email already exists. Try signing in.");

    const inserted = await db
      .insert(users)
      .values({ name, email, passwordHash: hashPassword(password) })
      .returning();
    const user = inserted[0];
    await getPreferences(user.id);

    const cookie = await createSession(user.id);
    const res = ok(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarHue: user.avatarHue,
        },
      },
      { status: 201 },
    );
    res.cookies.set(SESSION_COOKIE, cookie, sessionCookieOptions(30 * 86_400));
    return res;
  } catch (err) {
    return handleApiError(err);
  }
}
