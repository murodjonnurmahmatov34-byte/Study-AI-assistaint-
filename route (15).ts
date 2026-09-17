import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { studyMaterials } from "@/db/schema";
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
      .from(studyMaterials)
      .where(
        and(
          eq(studyMaterials.userId, user.id),
          q
            ? or(
                ilike(studyMaterials.title, `%${q}%`),
                ilike(studyMaterials.content, `%${q}%`),
                ilike(studyMaterials.description, `%${q}%`),
                ilike(studyMaterials.subject, `%${q}%`),
              )
            : undefined,
        ),
      );

    const list = rows
      .filter((r) =>
        subject ? r.subject.toLowerCase() === subject.toLowerCase() : true,
      )
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return ok({
      materials: list.map((m) => ({
        id: m.id,
        title: m.title,
        subject: m.subject,
        description: m.description,
        content: m.content,
        tags: m.tags,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
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
    const description =
      typeof body.description === "string" ? body.description.slice(0, 500) : "";
    const content = typeof body.content === "string" ? body.content : "";
    const subject =
      typeof body.subject === "string" && body.subject.trim()
        ? body.subject.trim().slice(0, 60)
        : "General";

    if (!title || title.length > 120)
      return fail(400, "Please enter a title (max 120 characters).");
    if (content.length > 30000)
      return fail(400, "Content is too long (max 30,000 characters).");

    const rows = await db
      .insert(studyMaterials)
      .values({
        userId: user.id,
        title,
        subject,
        description,
        content,
        tags: parseTags(body.tags),
      })
      .returning();

    void logStudySession({
      userId: user.id,
      activity: "materials",
      topic: subject,
      detail: `Added material “${title}”`,
    });

    return ok({ material: rows[0] }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
