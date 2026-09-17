import type { QuizQuestion } from "@/db/schema";
import type {
  SummaryInput,
  SummaryResult,
} from "./ai";

/**
 * Offline fallback engine.
 * Used when no AI provider key is configured (or the provider call fails),
 * so every feature keeps working end-to-end without fabricated facts.
 */

export class LocalUnsupportedError extends Error {}

const STOP = new Set(
  (
    "the a an and or but if then else when while of in on at to from by for with about into over under again further once here there all any both each few more most other some such no nor not only own same so than too very can will just don should now is are was were be been being have has had do does did this that these those it its as which who whom what why how your you yours we us our they them themself he she its into upon out off up down"
  ).split(" "),
);

export function splitSentences(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const parts =
    clean.match(/[^.!?…]+[.!?…]+["')\]]*|[^.!?…]+$/g) ?? [clean];
  return parts
    .map((s) => s.trim())
    .filter((s) => s.length > 18 && s.length < 420 && /[a-zA-Z]{3,}/.test(s));
}

function contentWords(sentence: string): string[] {
  return (
    sentence
      .toLowerCase()
      .match(/[a-z][a-z'’-]{2,}/g) ?? []
  ).filter((w) => !STOP.has(w));
}

interface Scored {
  sentence: string;
  index: number;
  score: number;
  wordCount: number;
}

function scoreSentences(text: string): Scored[] {
  const sentences = splitSentences(text);
  const freq = new Map<string, number>();
  for (const s of sentences) {
    for (const w of new Set(contentWords(s))) {
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }
  return sentences.map((s, i) => {
    const ws = contentWords(s);
    const raw = ws.reduce((acc, w) => acc + (freq.get(w) ?? 0), 0);
    return {
      sentence: s,
      index: i,
      score: ws.length ? raw / Math.sqrt(ws.length) : 0,
      wordCount: s.split(" ").length,
    };
  });
}

export function truncateWords(sentence: string, maxWords: number): string {
  const words = sentence.split(" ");
  if (words.length <= maxWords) return sentence;
  return words.slice(0, maxWords).join(" ") + "…";
}

function topFrequent(text: string, limit: number, minCount = 1): string[] {
  const freq = new Map<string, number>();
  for (const w of contentWords(text)) {
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()]
    .filter(([, c]) => c >= minCount)
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, limit)
    .map(([w]) => w);
}

/* ---------- Summarizer (extractive) ---------- */

export function localSummarize(
  text: string,
  length: SummaryInput["length"],
  difficulty: SummaryInput["difficulty"],
): SummaryResult {
  const scored = scoreSentences(text);
  if (scored.length < 2) {
    throw new LocalUnsupportedError(
      "The text is too short to summarize meaningfully. Please paste at least a few full sentences.",
    );
  }

  const per = { short: 3, medium: 5, detailed: 8 }[length];
  const maxLen =
    difficulty === "beginner" ? 18 : difficulty === "advanced" ? 44 : 30;

  const ranked = [...scored].sort((a, b) => b.score - a.score);
  const preferred = ranked.filter((s) => s.wordCount <= maxLen);
  const pool = preferred.length >= 2 ? preferred : ranked;

  const chosen: number[] = [];
  for (const s of pool) {
    if (chosen.length >= per) break;
    // Keep some spacing so sentences don't repeat back-to-back phrasing.
    if (chosen.some((c) => Math.abs(s.index - c) < 2)) continue;
    chosen.push(s.index);
  }
  // If spacing filtering left us short, fill with remaining top scorers.
  if (chosen.length < per) {
    for (const s of pool) {
      if (chosen.length >= per) break;
      if (!chosen.includes(s.index)) chosen.push(s.index);
    }
  }

  const final = chosen
    .sort((a, b) => a - b)
    .map((i) => truncateWords(scored[i].sentence, maxLen + 8));

  const keyPoints = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(6, scored.length))
    .map((s) => truncateWords(s.sentence, 16));

  const concepts = topFrequent(text, 6, 2);
  const keywords = topFrequent(text, 8, 1);

  return {
    summary: final.join(" "),
    keyPoints: [...new Set(keyPoints)],
    concepts: concepts.length ? concepts : keywords.slice(0, 4),
    keywords: keywords.length ? keywords : concepts.slice(0, 4),
  };
}

/* ---------- Quiz generator (extractive, from material) ---------- */

const MCQ_STEMS = [
  "According to the study material, which of the following statements is correct?",
  "Which statement is supported by the study material?",
  "Based on the material, which of these statements is true?",
  "Which of the following best reflects what the material says?",
  "Which statement can be found in the study material?",
];

function negation(sentence: string): string {
  const m = sentence.match(
    /\b(is|are|was|were|can|could|does|do|did|has|have|had|will|would|should|may|might)\b/i,
  );
  if (m) {
    const idx = sentence.indexOf(m[1]);
    return (
      sentence.slice(0, idx) + m[1] + " not" + sentence.slice(idx + m[1].length)
    );
  }
  return `It is not true that ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function localQuiz(
  material: string,
  count: number,
  questionType: "multiple-choice" | "true-false",
): QuizQuestion[] {
  const scored = scoreSentences(material);
  if (scored.length < 4) {
    throw new LocalUnsupportedError(
      "Please provide at least a short paragraph (4+ full sentences) of study material so questions can be built from it.",
    );
  }
  const top = [...scored]
    .sort((a, b) => b.score - a.score)
    .map((s) => truncateWords(s.sentence, 28));

  if (questionType === "true-false") {
    const n = Math.min(count, top.length);
    return Array.from({ length: n }, (_, i) => {
      const original = top[i];
      const isTrue = i % 2 === 0;
      const statement = isTrue ? original : negation(original);
      return {
        question: `True or false: ${statement}`,
        options: ["True", "False"],
        correctIndex: isTrue ? 0 : 1,
        explanation: isTrue
          ? "This statement appears directly in the study material, so it is true."
          : `This is a distorted version of the material. The original says: “${original}”`,
      };
    });
  }

  // Multiple choice: correct option is a real sentence from the material,
  // distractors are other sentences from the same material.
  const n = Math.min(count, top.length);
  if (n < 1) return [];
  const questions: QuizQuestion[] = [];
  for (let i = 0; i < n; i++) {
    const correct = top[i];
    const distractors = top.filter((t, j) => j !== i).slice(0, 3);
    if (distractors.length < 3) continue;
    const options = shuffle([correct, ...distractors]);
    questions.push({
      question: MCQ_STEMS[i % MCQ_STEMS.length],
      options,
      correctIndex: options.indexOf(correct),
      explanation: `This statement comes directly from the study material you provided. The other options are different sentences from the same text.`,
    });
  }
  if (questions.length === 0) {
    throw new LocalUnsupportedError(
      "The material has too few distinct sentences to build multiple-choice questions. Paste a longer passage or switch to True/False.",
    );
  }
  return questions;
}

/* ---------- Tutor (honest, structured, no fabricated facts) ---------- */

export function localTutorReply(question: string): string {
  const topic = question
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\?+$/, "")
    .slice(0, 90);

  return [
    "> **Offline mode** — no AI provider is configured on this server, so I can't look anything up or explain specific subject matter. Set `AI_API_KEY` (plus optional `AI_BASE_URL` / `AI_MODEL`) in the environment to enable full AI tutoring. What I *can* do right now is structure your thinking about the question:",
    "",
    `## Your question\n“${topic || "…"}”`,
    "",
    "### A reliable way to crack any question like this",
    "1. **State the core definition.** Write the concept in one sentence in your own words, no jargon. If you can't, that's the gap to fill first.",
    "2. **Find the mechanism.** Ask *why* it happens, not just *what* it is — walk through the steps or causes in order.",
    "3. **Anchor it with an example.** One concrete, real example beats ten abstract sentences. Pick the simplest case that still shows the idea.",
    "4. **Break one counter-example.** Find a case where it *doesn't* apply — that's usually what exams (and interviews) probe.",
    "5. **Test yourself.** Close the notes and explain it out loud in 60 seconds. Stumbling points are exactly what to re-study.",
    "",
    "### Three self-check questions for this topic",
    `- Can you define “${topic || "this concept"}” in one plain-language sentence?`,
    `- What are two common misconceptions about it, and why are they wrong?`,
    `- Can you give one everyday example where this shows up?`,
    "",
    "When the AI provider is configured, I'll answer your question directly — with explanations, worked examples, and generated practice questions for this exact topic.",
  ].join("\n");
}
