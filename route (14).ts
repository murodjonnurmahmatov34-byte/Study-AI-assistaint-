import { type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { studyMaterials } from "@/db/schema";
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
      .update(studyMaterials)
      .set({
        title,
        subject,
        description,
        content,
        tags: parseTags(body.tags),
        updatedAt: new Date(),
      })
      .where(and(eq(studyMaterials.id, id), eq(studyMaterials.userId, user.id)))
      .returning();

    if (rows.length === 0) return fail(404, "Material not found.");
    return ok({ material: rows[0] });
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
      .delete(studyMaterials)
      .where(and(eq(studyMaterials.id, id), eq(studyMaterials.userId, user.id)))
      .returning({ id: studyMaterials.id });
    if (rows.length === 0) return fail(404, "Material not found.");
    return ok({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
