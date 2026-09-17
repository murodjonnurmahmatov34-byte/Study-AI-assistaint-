import { type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { summaries } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const rows = await db
      .select()
      .from(summaries)
      .where(and(eq(summaries.id, id), eq(summaries.userId, user.id)))
      .limit(1);
    if (rows.length === 0) return fail(404, "Summary not found.");
    return ok({ summary: rows[0] });
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
      .delete(summaries)
      .where(and(eq(summaries.id, id), eq(summaries.userId, user.id)))
      .returning({ id: summaries.id });
    if (rows.length === 0) return fail(404, "Summary not found.");
    return ok({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
