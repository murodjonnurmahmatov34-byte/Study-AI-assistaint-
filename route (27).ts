import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { summaries } from "@/db/schema";
import { logStudySession, requireUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api";
import { truncateText } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await db
      .select()
      .from(summaries)
      .where(eq(summaries.userId, user.id))
      .orderBy(desc(summaries.createdAt))
      .limit(100);
    return ok({
      summaries: rows.map((r) => ({
        id: r.id,
        title: r.title,
        summary: r.summary,
        keyPoints: r.keyPoints,
        concepts: r.concepts,
        keywords: r.keywords,
        length: r.length,
        difficulty: r.difficulty,
        style: r.style,
        provider: r.provider,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const strArray = (v: unknown, n: number): string[] | null =>
  Array.isArray(v)
    ? v
        .filter((x): x is string => typeof x === "string")
        .slice(0, n)
        .map((s) => s.slice(0, 400))
    : null;

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return fail(400, "Invalid request.");

    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 120)
        : "";
    const summary = typeof body.summary === "string" ? body.summary.slice(0, 8000) : "";
    const sourceText =
      typeof body.sourceText === "string" ? body.sourceText.slice(0, 20000) : "";
    const keyPoints = strArray(body.keyPoints, 8);
    const concepts = strArray(body.concepts, 8);
    const keywords = strArray(body.keywords, 10);
    const length = ["short", "medium", "detailed"].includes(String(body.length))
      ? String(body.length)
      : "medium";
    const difficulty = ["beginner", "intermediate", "advanced"].includes(String(body.difficulty))
      ? String(body.difficulty)
      : "intermediate";
    const style = ["paragraph", "bullets", "study-guide"].includes(String(body.style))
      ? String(body.style)
      : "paragraph";
    const provider = body.provider === "ai" ? "ai" : "local";

    if (!summary || !sourceText)
      return fail(400, "Summary and source text are required.");

    const finalTitle = title || truncateText(summary.replace(/\s+/g, " "), 48);
    const rows = await db
      .insert(summaries)
      .values({
        userId: user.id,
        title: finalTitle,
        sourceText,
        summary,
        keyPoints: keyPoints ?? [],
        concepts: concepts ?? [],
        keywords: keywords ?? [],
        length,
        difficulty,
        style,
        provider,
      })
      .returning();

    void logStudySession({
      userId: user.id,
      activity: "summarizer",
      topic: finalTitle,
      detail: "Saved a summary",
    });

    return ok(
      {
        summary: {
          id: rows[0].id,
          title: rows[0].title,
          createdAt: rows[0].createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    return handleApiError(err);
  }
}
