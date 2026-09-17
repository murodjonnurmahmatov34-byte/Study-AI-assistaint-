import { type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { quizAnswers, quizAttempts, quizzes } from "@/db/schema";
import { logStudySession, requireUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api";
import { clampInt } from "@/lib/utils";

export async function POST(
  req: NextRequest,
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
    const quiz = rows[0];
    if (!quiz) return fail(404, "Quiz not found.");

    const body = (await req.json().catch(() => null)) as {
      answers?: unknown;
      timeTakenSec?: unknown;
    } | null;

    const rawAnswers = Array.isArray(body?.answers) ? body!.answers : null;
    if (!rawAnswers || rawAnswers.length !== quiz.questions.length) {
      return fail(400, "Please answer every question before submitting.");
    }
    const answers = rawAnswers.map((a) => (typeof a === "number" ? Math.floor(a) : -1));
    if (answers.some((a, i) => a < 0 || a >= quiz.questions[i].options.length)) {
      return fail(400, "Some answers are invalid.");
    }

    const timeTakenSec = clampInt(body?.timeTakenSec, 0, 36000, 0);
    const total = quiz.questions.length;
    const score = quiz.questions.reduce(
      (acc, q, i) => acc + (q.correctIndex === answers[i] ? 1 : 0),
      0,
    );
    const percentage = Math.round((score / total) * 100);

    const saved = await db
      .insert(quizAttempts)
      .values({
        userId: user.id,
        quizId: quiz.id,
        score,
        total,
        percentage,
        answers,
        timeTakenSec,
      })
      .returning();

    const attempt = saved[0];

    // Populate relational quiz_answers
    if (answers.length > 0) {
      await db.insert(quizAnswers).values(
        answers.map((ans, i) => ({
          attemptId: attempt.id,
          questionIndex: i,
          selectedIndex: ans,
          isCorrect: quiz.questions[i]?.correctIndex === ans,
        })),
      );
    }

    void logStudySession({
      userId: user.id,
      activity: "quiz",
      topic: quiz.topic,
      detail: `Scored ${score}/${total} (${percentage}%)`,
      durationMin: Math.max(1, Math.round(timeTakenSec / 60)),
    });

    return ok({
      attemptId: saved[0].id,
      score,
      total,
      percentage,
      results: quiz.questions.map((q, i) => ({
        index: i,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        selected: answers[i],
        explanation: q.explanation,
        correct: q.correctIndex === answers[i],
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
