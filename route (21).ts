import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { quizAttempts, quizzes } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();

    const quizRows = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.userId, user.id))
      .orderBy(desc(quizzes.createdAt))
      .limit(50);

    const attemptAgg = await db
      .select({
        quizId: quizAttempts.quizId,
        attempts: sql<number>`count(${quizAttempts.id})`,
        best: sql<number>`max(${quizAttempts.percentage})`,
        lastAt: sql<Date>`max(${quizAttempts.createdAt})`,
      })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, user.id))
      .groupBy(quizAttempts.quizId);

    const aggMap = new Map(attemptAgg.map((a) => [a.quizId, a]));

    return ok({
      quizzes: quizRows.map((q) => {
        const a = aggMap.get(q.id);
        return {
          id: q.id,
          title: q.title,
          topic: q.topic,
          questionCount: q.questionCount,
          difficulty: q.difficulty,
          questionType: q.questionType,
          provider: q.provider,
          createdAt: q.createdAt.toISOString(),
          attempts: a ? Number(a.attempts) : 0,
          bestScore: a ? Number(a.best) : null,
          lastAttemptAt: a
            ? new Date(a.lastAt as unknown as string | Date).toISOString()
            : null,
        };
      }),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
