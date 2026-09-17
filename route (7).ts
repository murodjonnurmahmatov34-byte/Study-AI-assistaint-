import { type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  createSession,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api";
import { isEmail } from "@/lib/utils";
import { limits } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
    if (!limits.authPerIp(ip, "login")) {
      return fail(429, "Too many attempts. Please wait a few minutes and try again.");
    }

    const body = (await req.json().catch(() => null)) as {
      email?: string;
      password?: string;
    } | null;

    const email = (body?.email ?? "").trim().toLowerCase();
    const password = body?.password ?? "";

    if (!isEmail(email)) return fail(400, "Please enter a valid email address.");
    if (!password) return fail(400, "Please enter your password.");

    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    const user = rows[0];

    // Generic error to avoid account enumeration.
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return fail(401, "Invalid email or password.");
    }

    const cookie = await createSession(user.id);
    const res = ok({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarHue: user.avatarHue,
      },
    });
    res.cookies.set(SESSION_COOKIE, cookie, sessionCookieOptions(30 * 86_400));
    return res;
  } catch (err) {
    return handleApiError(err);
  }
}
