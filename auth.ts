import { cookies } from "next/headers";
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import {
  sessions,
  studySessions,
  userPreferences,
  users,
  type User,
  type UserPreferences,
} from "@/db/schema";

export const SESSION_COOKIE = "studyai_session";
const SESSION_DAYS = 30;

const secret = () => process.env.AUTH_SECRET || "studyai-dev-secret-change-me";

/* ---------- Password hashing (scrypt, per-user salt) ---------- */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const candidate = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return (
      candidate.length === expected.length &&
      timingSafeEqual(candidate, expected)
    );
  } catch {
    return false;
  }
}

/* ---------- Signed session cookies ---------- */

function sign(token: string): string {
  const mac = createHmac("sha256", secret()).update(token).digest("hex");
  return `${token}.${mac}`;
}

function safeUnsign(signed: string): string | null {
  const i = signed.lastIndexOf(".");
  if (i <= 0) return null;
  const token = signed.slice(0, i);
  const mac = signed.slice(i + 1);
  const expected = createHmac("sha256", secret()).update(token).digest("hex");
  const a = Buffer.from(mac, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return token;
}

export interface SessionCookieOptions {
  httpOnly: true;
  sameSite: "lax" | "strict";
  secure: boolean;
  path: string;
  maxAge?: number;
}

export function sessionCookieOptions(
  maxAgeSec: number,
): SessionCookieOptions {
  const isHttpLocal =
    process.env.NEXT_PUBLIC_APP_URL?.startsWith("http://") ||
    process.env.COOKIE_SECURE === "false";
  const secure = process.env.NODE_ENV === "production" && !isHttpLocal;

  return {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: maxAgeSec,
  };
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({ id: token, userId, expiresAt });
  return sign(token);
}

export async function destroySession(cookieValue: string): Promise<void> {
  const token = safeUnsign(cookieValue);
  if (!token) return;
  await db.delete(sessions).where(eq(sessions.id, token));
}

export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const token = safeUnsign(raw);
  if (!token) return null;
  const rows = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, token), gt(sessions.expiresAt, new Date())));
  return rows[0]?.user ?? null;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("You must be signed in to access this resource.");
  }
}

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

/* ---------- Preferences ---------- */

export async function getPreferences(userId: string): Promise<UserPreferences> {
  const rows = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId));
  if (rows[0]) return rows[0];
  const inserted = await db
    .insert(userPreferences)
    .values({ userId })
    .returning();
  return inserted[0];
}

export async function logStudySession(input: {
  userId: string;
  activity: string;
  topic?: string;
  detail?: string;
  durationMin?: number;
}): Promise<void> {
  try {
    await db.insert(studySessions).values({
      userId: input.userId,
      activity: input.activity,
      topic: input.topic ?? "",
      detail: input.detail ?? "",
      durationMin: input.durationMin ?? null,
    });
  } catch (err) {
    console.error("Failed to log study session:", err);
  }
}
