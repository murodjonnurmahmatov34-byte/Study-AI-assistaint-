import { type NextRequest } from "next/server";
import { db } from "@/db";
import { quizQuestions, quizzes, type QuizQuestion } from "@/db/schema";
import { logStudySession, requireUser } from "@/lib/auth";
import { AIGenerationError, generateQuiz, type QuizInput } from "@/lib/ai";
import { LocalUnsupportedError } from "@/lib/ai-local";
import { fail, handleApiError, ok } from "@/lib/api";
import { limits } from "@/lib/ratelimit";
import { clampInt, oneOf } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!limits.aiPerUser(user.id, "quiz")) {
      return fail(429, "You're generating quizzes a little fast — give it a minute.");
    }

    const body = (await req.json().catch(() => null)) as Partial<QuizInput> | null;

    const topic = (body?.topic ?? "").trim();
    if (!topic || topic.length > 80)
      return fail(400, "Please enter a topic (up to 80 characters).");
    const material = (body?.material ?? "").trim();
    if (material.length > 20000)
      return fail(400, "Study material is too long (max 20,000 characters).");
    const questionCount = clampInt(body?.questionCount, 3, 10, 5);

    const input: QuizInput = {
      topic,
      material,
      questionCount,
      difficulty: oneOf(body?.difficulty, ["easy", "medium", "hard"], "medium"),
      questionType: oneOf(
        body?.questionType,
        ["multiple-choice", "true-false"],
        "multiple-choice",
      ),
    };

    let questions: QuizQuestion[];
    let provider;
    try {
      ({ questions, provider } = await generateQuiz(input));
    } catch (err) {
      if (err instanceof LocalUnsupportedError) return fail(400, err.message);
      if (err instanceof AIGenerationError) return fail(502, err.message);
      throw err;
    }

    const rows = await db
      .insert(quizzes)
      .values({
        userId: user.id,
        title: topic,
        topic,
        sourceMaterial: material,
        questionCount: questions.length,
        difficulty: input.difficulty,
        questionType: input.questionType,
        questions,
        provider,
      })
      .returning();

    const createdQuiz = rows[0];

    // Populate relational quiz_questions
    if (questions.length > 0) {
      await db.insert(quizQuestions).values(
        questions.map((q, i) => ({
          quizId: createdQuiz.id,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          orderIndex: i,
        })),
      );
    }

    void logStudySession({
      userId: user.id,
      activity: "quiz",
      topic,
      detail: `Generated a ${questions.length}-question ${input.questionType} quiz`,
    });

    return ok(
      { quiz: rows[0], provider },
      { status: 201 },
    );
  } catch (err) {
    return handleApiError(err);
  }
}
