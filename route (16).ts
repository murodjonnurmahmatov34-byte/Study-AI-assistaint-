import { type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { requireUser } from "@/lib/auth";
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
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
      .update(notes)
      .set({ title, content, subject, tags: parseTags(body.tags), updatedAt: new Date() })
      .where(and(eq(notes.id, id), eq(notes.userId, user.id)))
      .returning();

    if (rows.length === 0) return fail(404, "Note not found.");
    return ok({ note: rows[0] });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const rows = await db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, user.id)))
      .returning({ id: notes.id });
    if (rows.length === 0) return fail(404, "Note not found.");
    return ok({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
