import { type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const rows = await db
      .delete(conversations)
      .where(
        and(eq(conversations.id, id), eq(conversations.userId, user.id)),
      )
      .returning({ id: conversations.id });

    if (rows.length === 0) return fail(404, "Conversation not found.");
    return ok({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
