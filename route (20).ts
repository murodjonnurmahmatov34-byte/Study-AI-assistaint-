import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { quizAttempts, quizzes } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await db
      .select({
        id: quizAttempts.id,
        score: quizAttempts.score,
        total: quizAttempts.total,
        percentage: quizAttempts.percentage,
        timeTakenSec: quizAttempts.timeTakenSec,
        createdAt: quizAttempts.createdAt,
        quizTitle: quizzes.title,
        quizType: quizzes.questionType,
      })
      .from(quizAttempts)
      .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
      .where(eq(quizAttempts.userId, user.id))
      .orderBy(desc(quizAttempts.createdAt))
      .limit(30);

    return ok({
      attempts: rows.map((r) => ({
        id: r.id,
        quizTitle: r.quizTitle,
        score: r.score,
        total: r.total,
        percentage: r.percentage,
        timeTakenSec: r.timeTakenSec,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
