import { type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { quizzes } from "@/db/schema";
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
      .from(quizzes)
      .where(and(eq(quizzes.id, id), eq(quizzes.userId, user.id)))
      .limit(1);
    if (rows.length === 0) return fail(404, "Quiz not found.");
    const q = rows[0];
    return ok({
      quiz: {
        id: q.id,
        title: q.title,
        topic: q.topic,
        questionCount: q.questionCount,
        difficulty: q.difficulty,
        questionType: q.questionType,
        provider: q.provider,
        createdAt: q.createdAt.toISOString(),
        questions: q.questions,
      },
    });
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
      .delete(quizzes)
      .where(and(eq(quizzes.id, id), eq(quizzes.userId, user.id)))
      .returning({ id: quizzes.id });
    if (rows.length === 0) return fail(404, "Quiz not found.");
    return ok({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
