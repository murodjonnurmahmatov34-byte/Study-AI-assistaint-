import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userPreferences, users } from "@/db/schema";
import { getPreferences, requireUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api";
import { isEmail } from "@/lib/utils";

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return fail(400, "Invalid request.");

    // Profile
    let name = user.name;
    let email = user.email;
    let avatarHue = user.avatarHue;

    if (body.name !== undefined) {
      const n = String(body.name).trim();
      if (n.length < 2 || n.length > 80)
        return fail(400, "Name must be between 2 and 80 characters.");
      name = n;
    }
    if (body.email !== undefined) {
      const e = String(body.email).trim().toLowerCase();
      if (!isEmail(e)) return fail(400, "Please enter a valid email address.");
      if (e !== user.email) {
        const taken = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, e))
          .limit(1);
        if (taken.length > 0)
          return fail(409, "That email is already in use by another account.");
        email = e;
      }
    }
    if (body.avatarHue !== undefined) {
      const h = Math.floor(Number(body.avatarHue));
      if (Number.isFinite(h) && h >= 0 && h <= 359) avatarHue = h;
    }

    const updatedUser = await db
      .update(users)
      .set({ name, email, avatarHue, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning();

    // Preferences
    const prefs = await getPreferences(user.id);
    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (body.theme !== undefined) {
      set.theme = ["light", "dark", "system"].includes(String(body.theme))
        ? String(body.theme)
        : "system";
    }
    if (body.emailNotifications !== undefined)
      set.emailNotifications = Boolean(body.emailNotifications);
    if (body.productUpdates !== undefined)
      set.productUpdates = Boolean(body.productUpdates);
    if (body.weeklyGoalMinutes !== undefined) {
      const g = Math.floor(Number(body.weeklyGoalMinutes));
      if (Number.isFinite(g) && g >= 15 && g <= 1200) set.weeklyGoalMinutes = g;
    }
    if (body.defaultDifficulty !== undefined) {
      set.defaultDifficulty = ["easy", "medium", "hard", "beginner", "intermediate", "advanced"].includes(
        String(body.defaultDifficulty),
      )
        ? String(body.defaultDifficulty)
        : "intermediate";
    }
    await db
      .update(userPreferences)
      .set(set)
      .where(eq(userPreferences.userId, user.id));
    const newPrefs = await getPreferences(user.id);
    void prefs;

    return ok({
      user: {
        id: updatedUser[0].id,
        name: updatedUser[0].name,
        email: updatedUser[0].email,
        avatarHue: updatedUser[0].avatarHue,
      },
      preferences: newPrefs,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
