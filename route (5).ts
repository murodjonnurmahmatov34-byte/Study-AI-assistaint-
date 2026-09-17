import { type NextRequest } from "next/server";
import { AIGenerationError, generateSummary, type SummaryInput } from "@/lib/ai";
import { LocalUnsupportedError } from "@/lib/ai-local";
import { requireUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api";
import { limits } from "@/lib/ratelimit";
import { oneOf } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!limits.aiPerUser(user.id, "summarize")) {
      return fail(429, "You're generating summaries a little fast — give it a minute.");
    }

    const body = (await req.json().catch(() => null)) as Partial<SummaryInput> & {
      text?: string;
    } | null;

    const text = (body?.text ?? "").trim();
    if (text.length < 200)
      return fail(400, "Please paste at least a few sentences (200+ characters) to summarize.");
    if (text.length > 20000)
      return fail(400, "Text is too long (max 20,000 characters).");

    const input: SummaryInput = {
      text,
      length: oneOf(body?.length, ["short", "medium", "detailed"], "medium"),
      difficulty: oneOf(
        body?.difficulty,
        ["beginner", "intermediate", "advanced"],
        "intermediate",
      ),
      style: oneOf(body?.style, ["paragraph", "bullets", "study-guide"], "paragraph"),
    };

    let result;
    let provider;
    try {
      ({ result, provider } = await generateSummary(input));
    } catch (err) {
      if (err instanceof LocalUnsupportedError) return fail(400, err.message);
      if (err instanceof AIGenerationError) return fail(502, err.message);
      throw err;
    }

    return ok({ ...result, provider });
  } catch (err) {
    return handleApiError(err);
  }
}
