import { and, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { logStudySession, requireUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api";

function parseTags(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 12);
  }
  if (typeof v === "string") {
    return v
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 12);
  }
  return [];
}

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const subject = url.searchParams.get("subject")?.trim() ?? "";

    const rows = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.userId, user.id),
          q
            ? or(
                ilike(notes.title, `%${q}%`),
                ilike(notes.content, `%${q}%`),
                ilike(notes.subject, `%${q}%`),
              )
            : undefined,
        ),
      );
    let list = rows.filter((r) =>
      subject ? r.subject.toLowerCase() === subject.toLowerCase() : true,
    );
    list = list
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 200);

    return ok({
      notes: list.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        subject: n.subject,
        tags: n.tags,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return fail(400, "Invalid request.");

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content : "";
    const subject =
      typeof body.subject === "string" && body.subject.trim()
        ? body.subject.trim().slice(0, 60)
        : "General";

    if (!title || title.length > 120)
      return fail(400, "Please enter a note title (max 120 characters).");
    if (content.length > 20000)
      return fail(400, "Note content is too long (max 20,000 characters).");

    const rows = await db
      .insert(notes)
      .values({
        userId: user.id,
        title,
        content,
        subject,
        tags: parseTags(body.tags),
      })
      .returning();

    void logStudySession({
      userId: user.id,
      activity: "notes",
      topic: subject,
      detail: `Created note “${title}”`,
    });

    return ok({ note: rows[0] }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
