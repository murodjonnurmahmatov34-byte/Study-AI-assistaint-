import type { QuizQuestion } from "@/db/schema";
import {
  LocalUnsupportedError,
  localQuiz,
  localSummarize,
  localTutorReply,
} from "./ai-local";

/* ---------- Types ---------- */

export interface ChatTurn {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface SummaryInput {
  text: string;
  length: "short" | "medium" | "detailed";
  difficulty: "beginner" | "intermediate" | "advanced";
  style: "paragraph" | "bullets" | "study-guide";
}

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  concepts: string[];
  keywords: string[];
}

export interface QuizInput {
  topic: string;
  material: string;
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
  questionType: "multiple-choice" | "true-false";
}

export type Provider = "ai" | "local";

export class AIGenerationError extends Error {}

/* ---------- Provider config (server-side only, never exposed to client) ---------- */

export const isAIConfigured = (): boolean =>
  Boolean(process.env.AI_API_KEY);

const baseUrl = () =>
  (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");

const model = () => process.env.AI_MODEL || "gpt-4o-mini";

async function chatCompletion(
  messages: ChatTurn[],
  opts: { temperature?: number; maxTokens?: number } = {},
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model(),
        messages,
        temperature: opts.temperature ?? 0.4,
        max_tokens: opts.maxTokens ?? 1800,
      }),
      cache: "no-store",
    });
  } catch {
    throw new AIGenerationError(
      "Could not reach the AI service. Please try again in a moment.",
    );
  }
  if (!res.ok) {
    const hint =
      res.status === 401
        ? " The API key may be invalid."
        : res.status === 429
          ? " The rate limit may have been reached."
          : "";
    throw new AIGenerationError(
      `The AI service returned an error (${res.status}).${hint}`,
    );
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content || !content.trim()) {
    throw new AIGenerationError("The AI service returned an empty response.");
  }
  return content;
}

function parseJsonLoose<T>(raw: string): T {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  try {
    return JSON.parse(s) as T;
  } catch {
    /* fall through */
  }
  const start = s.search(/[[{]/);
  const end = Math.max(s.lastIndexOf("]"), s.lastIndexOf("}"));
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(s.slice(start, end + 1)) as T;
    } catch {
      /* fall through */
    }
  }
  throw new AIGenerationError(
    "The AI returned an unreadable response. Please try again.",
  );
}

/* ---------- Sanitizers (never trust the model output shape) ---------- */

const str = (v: unknown, max = 4000): string =>
  typeof v === "string" ? v.slice(0, max) : "";

const strArray = (v: unknown, maxItems: number, maxLen = 300): string[] =>
  Array.isArray(v)
    ? v
        .filter((x): x is string => typeof x === "string")
        .slice(0, maxItems)
        .map((s) => s.slice(0, maxLen))
    : [];

function sanitizeSummary(raw: unknown): SummaryResult {
  const obj = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    summary: str(obj.summary, 8000) || "No summary produced.",
    keyPoints: strArray(obj.keyPoints, 8),
    concepts: strArray(obj.concepts, 8, 60),
    keywords: strArray(obj.keywords, 10, 40),
  };
}

function sanitizeQuiz(
  raw: unknown,
  type: "multiple-choice" | "true-false",
): QuizQuestion[] {
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>).questions
      : undefined;
  if (!Array.isArray(list)) return [];
  const out: QuizQuestion[] = [];
  for (const item of list.slice(0, 12)) {
    if (typeof item !== "object" || item === null) continue;
    const q = item as Record<string, unknown>;
    const question = str(q.question, 500);
    const explanation = str(q.explanation, 500) || "See the explanation above.";
    if (!question) continue;
    if (type === "true-false") {
      const correct =
        typeof q.correctIndex === "number" && q.correctIndex === 1 ? 1 : 0;
      out.push({ question, options: ["True", "False"], correctIndex: correct, explanation });
    } else {
      const options = strArray(q.options, 4, 400);
      if (options.length !== 4) continue;
      const ci =
        typeof q.correctIndex === "number" &&
        Number.isInteger(q.correctIndex) &&
        q.correctIndex >= 0 &&
        q.correctIndex < 4
          ? q.correctIndex
          : -1;
      if (ci === -1) continue;
      out.push({ question, options, correctIndex: ci, explanation });
    }
  }
  return out;
}

/* ---------- Tutor ---------- */

const TUTOR_SYSTEM = [
  "You are the StudyAI Tutor, an expert, patient study companion for students.",
  "Explain difficult concepts clearly with concrete examples, step-by-step reasoning, and short practice questions when helpful.",
  "Structure answers with short headings or numbered steps so they are easy to skim. Use markdown.",
  "Be honest and calibrated: if you do not know an answer, are unsure, or lack the information to answer accurately, say so plainly instead of guessing or inventing facts.",
  "Keep answers focused on what the student asked; do not lecture beyond the question.",
].join(" ");

export async function tutorReply(
  history: ChatTurn[],
): Promise<{ content: string; provider: Provider }> {
  if (isAIConfigured()) {
    try {
      const content = await chatCompletion([
        { role: "system", content: TUTOR_SYSTEM },
        ...history.slice(-16),
      ]);
      return { content, provider: "ai" };
    } catch (err) {
      console.error("AI tutor failed, falling back to local engine:", err);
    }
  }
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  return {
    content: localTutorReply(lastUser?.content ?? ""),
    provider: "local",
  };
}

/* ---------- Summarizer ---------- */

export async function generateSummary(
  input: SummaryInput,
): Promise<{ result: SummaryResult; provider: Provider }> {
  if (isAIConfigured()) {
    try {
      const prompt = [
        `Summarize the study text below.`,
        `Summary length: ${input.length}. Target difficulty: ${input.difficulty}. Style: ${input.style}.`,
        `Write the summary at a ${input.difficulty} level.`,
        `Respond with JSON only, in this exact shape:`,
        `{"summary": string, "keyPoints": string[], "concepts": string[], "keywords": string[]}`,
        `- "summary": the main summary (3-5 sentences if short, 6-9 if medium, 10-16 if detailed). If style is "bullets", use markdown bullet lines. If "study-guide", include a brief "Review tips" bullet list at the end.`,
        `- "keyPoints": up to 6 crisp bullet sentences.`,
        `- "concepts": up to 6 important named concepts or terms.`,
        `- "keywords": up to 10 single keywords or short phrases.`,
        `Do not invent facts not present in the text.`,
        ``,
        `TEXT:`,
        input.text.slice(0, 24000),
      ].join("\n");
      const raw = await chatCompletion(
        [{ role: "user", content: prompt }],
        { temperature: 0.3, maxTokens: 1600 },
      );
      const result = sanitizeSummary(parseJsonLoose<unknown>(raw));
      if (!result.summary || result.summary === "No summary produced.") {
        throw new AIGenerationError("The AI did not return a usable summary.");
      }
      return { result, provider: "ai" };
    } catch (err) {
      console.error("AI summarizer failed, falling back to local engine:", err);
    }
  }
  try {
    return {
      result: localSummarize(input.text, input.length, input.difficulty),
      provider: "local",
    };
  } catch (e) {
    if (e instanceof LocalUnsupportedError) throw e;
    throw new AIGenerationError(
      "Something went wrong while generating your summary. Please try again.",
    );
  }
}

/* ---------- Quiz generator ---------- */

export async function generateQuiz(
  input: QuizInput,
): Promise<{ questions: QuizQuestion[]; provider: Provider }> {
  if (isAIConfigured()) {
    try {
      const shape =
        input.questionType === "true-false"
          ? `{"questions":[{"question": "True or false: <statement>", "options": ["True", "False"], "correctIndex": 0, "explanation": "string"}]}`
          : `{"questions":[{"question": "string", "options": ["A", "B", "C", "D"], "correctIndex": 0-3, "explanation": "string"}]}`;
      const prompt = [
        `Generate a study quiz. Topic: ${input.topic}. Difficulty: ${input.difficulty}. Number of questions: ${input.questionCount}. Question type: ${input.questionType}.`,
        `Respond with JSON only in this exact shape: ${shape}`,
        "Rules: every question must have exactly one correct answer with a clear explanation. Make distractors plausible but clearly wrong. Base questions on the material when provided; otherwise use your solid knowledge of the topic, and only ask about things you know accurately.",
        input.material.trim()
          ? `\nSTUDY MATERIAL:\n${input.material.slice(0, 24000)}`
          : "\nNo material provided — use general knowledge of the topic.",
      ].join("\n");
      const raw = await chatCompletion(
        [{ role: "user", content: prompt }],
        { temperature: 0.5, maxTokens: 2200 },
      );
      const questions = sanitizeQuiz(parseJsonLoose<unknown>(raw), input.questionType);
      if (questions.length === 0) {
        throw new AIGenerationError(
          "The AI did not return usable questions. Please try again.",
        );
      }
      return { questions, provider: "ai" };
    } catch (err) {
      console.error("AI quiz failed, falling back to local engine:", err);
    }
  }
  if (!input.material.trim()) {
    throw new AIGenerationError(
      "Quiz generation for a bare topic needs an AI provider. Please paste your study material below (works without a provider), or configure AI_API_KEY on the server.",
    );
  }
  try {
    return {
      questions: localQuiz(input.material, input.questionCount, input.questionType),
      provider: "local",
    };
  } catch (e) {
    if (e instanceof LocalUnsupportedError) throw e;
    throw new AIGenerationError(
      "Something went wrong while generating your quiz. Please try again.",
    );
  }
}
