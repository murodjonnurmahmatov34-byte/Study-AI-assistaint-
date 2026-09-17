import { and, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import {
  conversations,
  notes,
  quizzes,
  studyMaterials,
  summaries,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return ok({ results: [] });
    const like = `%${q}%`;

    const [n, m, s, z, c] = await Promise.all([
      db
        .select({ title: notes.title })
        .from(notes)
        .where(and(eq(notes.userId, user.id), ilike(notes.title, like)))
        .limit(3),
      db
        .select({ title: studyMaterials.title })
        .from(studyMaterials)
        .where(and(eq(studyMaterials.userId, user.id), ilike(studyMaterials.title, like)))
        .limit(3),
      db
        .select({ title: summaries.title })
        .from(summaries)
        .where(and(eq(summaries.userId, user.id), ilike(summaries.title, like)))
        .limit(3),
      db
        .select({ id: quizzes.id, title: quizzes.title })
        .from(quizzes)
        .where(and(eq(quizzes.userId, user.id), ilike(quizzes.title, like)))
        .limit(3),
      db
        .select({ id: conversations.id, title: conversations.title })
        .from(conversations)
        .where(
          and(
            eq(conversations.userId, user.id),
            or(ilike(conversations.title, like)),
          ),
        )
        .limit(3),
    ]);

    const results = [
      ...n.map((r) => ({ type: "note", title: r.title, href: "/dashboard/notes" })),
      ...m.map((r) => ({
        type: "material",
        title: r.title,
        href: "/dashboard/materials",
      })),
      ...s.map((r) => ({
        type: "summary",
        title: r.title,
        href: "/dashboard/summarizer",
      })),
      ...z.map((r) => ({
        type: "quiz",
        title: r.title,
        href: "/dashboard/quiz",
      })),
      ...c.map((r) => ({
        type: "tutor",
        title: r.title,
        href: "/dashboard/tutor",
      })),
    ];

    return ok({ results });
  } catch (err) {
    return handleApiError(err);
  }
}
