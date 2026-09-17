"use client";

import { useEffect, useRef, useState } from "react";
import type { QuizQuestion } from "@/db/schema";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  ProgressBar,
  Segmented,
  Select,
  Textarea,
} from "@/components/ui";
import { Donut } from "@/components/charts";
import {
  IcAlert,
  IcArrowLeft,
  IcArrowRight,
  IcCheck,
  IcCheckCircle,
  IcRefresh,
  IcSparkles,
  IcTarget,
  IcTrash,
  IcX,
} from "@/components/icons";
import { cn, fmtDateTime, timeAgo } from "@/lib/utils";
import { useToast } from "@/components/toast";

type Phase = "setup" | "taking" | "results";
type QType = "multiple-choice" | "true-false";

interface SavedQuiz {
  id: string;
  title: string;
  questionCount: number;
  difficulty: string;
  questionType: string;
  provider: string;
  createdAt: string;
  attempts: number;
  bestScore: number | null;
}
interface Attempt {
  id: string;
  quizTitle: string;
  score: number;
  total: number;
  percentage: number;
  createdAt: string;
}
interface ResultItem {
  index: number;
  question: string;
  options: string[];
  correctIndex: number;
  selected: number;
  explanation: string;
  correct: boolean;
}

const perfLabel = (pct: number) =>
  pct >= 90 ? "Outstanding — you've mastered this." :
  pct >= 70 ? "Great work — a solid understanding." :
  pct >= 50 ? "Good start — review the misses below." :
  "Tough round — reread the explanations and try again.";

export default function QuizPage() {
  const { push } = useToast();

  // setup
  const [topic, setTopic] = useState("");
  const [material, setMaterial] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [type, setType] = useState<QType>("multiple-choice");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);

  // taking
  const [phase, setPhase] = useState<Phase>("setup");
  const [quiz, setQuiz] = useState<{ id: string; title: string; questions: QuizQuestion[] } | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitOpen, setSubmitOpen] = useState(false);
  const startedAt = useRef<number>(0);

  // results
  const [result, setResult] = useState<{
    score: number;
    total: number;
    percentage: number;
    results: ResultItem[];
  } | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [retaking, setRetaking] = useState<string | null>(null);

  const loadLists = async () => {
    try {
      const [q, a] = await Promise.all([
        fetch("/api/quizzes").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/quizzes/attempts").then((r) => (r.ok ? r.json() : null)),
      ]);
      if (q) setSavedQuizzes(q.quizzes as SavedQuiz[]);
      if (a) setAttempts(a.attempts as Attempt[]);
    } catch {
      /* non-fatal */
    }
  };

  useEffect(() => {
    void loadLists();
  }, []);

  const beginQuiz = (q: { id: string; title: string; questions: QuizQuestion[] }) => {
    setQuiz(q);
    setIdx(0);
    setAnswers(new Array(q.questions.length).fill(-1));
    setResult(null);
    setPhase("taking");
    startedAt.current = Date.now();
  };

  const generate = async () => {
    if (!topic.trim()) {
      setGenError("Enter the topic you want to be quizzed on.");
      return;
    }
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          material,
          questionCount: count,
          difficulty,
          questionType: type,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGenError(data.error ?? "Something went wrong while generating your quiz. Please try again.");
        return;
      }
      push("success", `Quiz ready — ${data.quiz.questionCount} questions.`);
      void loadLists();
      beginQuiz({
        id: data.quiz.id,
        title: data.quiz.title,
        questions: data.quiz.questions,
      });
    } catch {
      setGenError("Network error. Please check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  };

  const retake = async (id: string) => {
    setRetaking(id);
    try {
      const res = await fetch(`/api/quizzes/${id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        push("error", data.error ?? "Could not load this quiz.");
        return;
      }
      beginQuiz({ id: data.quiz.id, title: data.quiz.title, questions: data.quiz.questions });
    } catch {
      push("error", "Could not load this quiz.");
    } finally {
      setRetaking(null);
    }
  };

  const submit = async () => {
    if (!quiz) return;
    setSubmitOpen(false);
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          timeTakenSec: Math.round((Date.now() - startedAt.current) / 1000),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        push("error", data.error ?? "Could not submit the quiz.");
        return;
      }
      setResult({
        score: data.score,
        total: data.total,
        percentage: data.percentage,
        results: data.results,
      });
      setPhase("results");
      push("success", `Quiz complete — you scored ${data.percentage}%.`);
      void loadLists();
    } catch {
      push("error", "Network error while submitting the quiz.");
    }
  };

  const deleteQuiz = async (id: string) => {
    try {
      const res = await fetch(`/api/quizzes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        push("error", data.error ?? "Could not delete this quiz.");
        return;
      }
      setSavedQuizzes((sq) => sq.filter((x) => x.id !== id));
      push("success", "Quiz deleted.");
      void loadLists();
    } catch {
      push("error", "Could not delete this quiz.");
    }
  };

  const unanswered = answers.filter((a) => a === -1).length;
  const current = quiz?.questions[idx];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[24px] font-extrabold tracking-tight text-ink">AI Quiz Generator</h1>
        <p className="mt-1 text-[14px] text-ink/50">
          Turn any topic — or your own study material — into an auto-graded quiz with explanations.
        </p>
      </div>

      {/* ============ SETUP ============ */}
      {phase === "setup" && (
        <>
          <div className="grid gap-5 lg:grid-cols-5">
            <Card className="p-5 lg:col-span-3">
              <div className="space-y-4">
                <Field label="Topic" hint="What should the quiz cover?">
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    maxLength={80}
                    placeholder="e.g. Photosynthesis, World War II, Derivatives…"
                  />
                </Field>
                <Field
                  label="Study material (optional)"
                  hint="Paste notes to base questions on. Without a provider key, material is required."
                >
                  <Textarea
                    rows={7}
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="Paste lecture notes or article text here…"
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Questions">
                    <Select value={count} onChange={(e) => setCount(Number(e.target.value))}>
                      {[3, 4, 5, 6, 8, 10].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Difficulty">
                    <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </Select>
                  </Field>
                  <div>
                    <p className="mb-1.5 text-[13px] font-semibold text-ink/80">Question type</p>
                    <Segmented
                      value={type}
                      onChange={setType}
                      options={[
                        { value: "multiple-choice", label: "Multiple choice" },
                        { value: "true-false", label: "True / False" },
                      ]}
                    />
                  </div>
                </div>
                {genError && (
                  <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
                    <IcAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    {genError}
                  </div>
                )}
                <Button size="lg" loading={generating} onClick={() => void generate()}>
                  <IcSparkles className="h-4 w-4" />
                  {generating ? "Generating quiz…" : "Generate Quiz"}
                </Button>
              </div>
            </Card>

            {/* Saved quizzes */}
            <Card className="p-5 lg:col-span-2">
              <h2 className="text-[13px] font-bold text-ink">Your quizzes</h2>
              {savedQuizzes.length === 0 ? (
                <p className="mt-3 rounded-lg border border-dashed border-mist bg-cream px-4 py-10 text-center text-[13px] text-ink/45">
                  Create your first AI-powered quiz.
                </p>
              ) : (
                <ul className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {savedQuizzes.map((q) => (
                    <li key={q.id} className="rounded-xl border border-mist bg-white p-3.5 transition hover:border-brand-300">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-bold text-ink">{q.title}</p>
                          <p className="mt-0.5 text-[11.5px] font-medium text-ink/40">
                            {q.questionCount} Q · {q.difficulty} · {q.questionType === "multiple-choice" ? "MC" : "T/F"} · {timeAgo(q.createdAt)}
                          </p>
                        </div>
                        {q.bestScore !== null && (
                          <Badge tone={q.bestScore >= 70 ? "success" : "neutral"}>best {q.bestScore}%</Badge>
                        )}
                      </div>
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <Button size="sm" variant="subtle" loading={retaking === q.id} onClick={() => void retake(q.id)}>
                          <IcTarget className="h-3.5 w-3.5" /> Take quiz
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void deleteQuiz(q.id)}
                          aria-label={`Delete ${q.title}`}
                          className="text-ink/40 hover:text-red-600"
                        >
                          <IcTrash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Attempt history */}
          <Card className="p-5">
            <h2 className="text-[13px] font-bold text-ink">Quiz history</h2>
            {attempts.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-mist bg-cream px-4 py-8 text-center text-[13px] text-ink/45">
                Complete your first quiz to see your performance.
              </p>
            ) : (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {attempts.slice(0, 9).map((a) => (
                  <li key={a.id} className="flex items-center gap-3 rounded-xl border border-mist bg-white px-3.5 py-3">
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display text-[14px] font-extrabold",
                        a.percentage >= 70 ? "bg-emerald-50 text-emerald-600" : a.percentage >= 50 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500",
                      )}
                    >
                      {a.percentage}%
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-ink">{a.quizTitle}</p>
                      <p className="text-[11.5px] font-medium text-ink/40">
                        {a.score}/{a.total} correct · {fmtDateTime(a.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      {/* ============ TAKING ============ */}
      {phase === "taking" && quiz && current && (
        <Card className="mx-auto max-w-3xl overflow-hidden">
          <div className="border-b border-mist bg-cream px-6 py-4">
            <div className="flex items-center justify-between text-[12.5px] font-bold text-ink/50">
              <span className="truncate">
                <IcTarget className="mr-1.5 inline h-3.5 w-3.5 text-brand-600" />
                {quiz.title}
              </span>
              <span>
                Question {idx + 1} of {quiz.questions.length}
              </span>
            </div>
            <ProgressBar value={((idx + 1) / quiz.questions.length) * 100} className="mt-3" />
          </div>

          <div className="p-6 sm:p-8">
            <p className="font-display text-[17px] font-bold leading-relaxed text-ink">
              {current.question}
            </p>
            <div className="mt-6 space-y-2.5">
              {current.options.map((opt, i) => {
                const selected = answers[idx] === i;
                return (
                  <button
                    key={i}
                    onClick={() =>
                      setAnswers((a) => a.map((v, j) => (j === idx ? i : v)))
                    }
                    className={cn(
                      "flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left text-[14.5px] font-medium transition-all",
                      selected
                        ? "border-brand-500 bg-brand-50 text-brand-900 shadow-sm"
                        : "border-mist bg-white text-ink/70 hover:border-brand-300 hover:bg-brand-50/40",
                    )}
                    role="radio"
                    aria-checked={selected}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-extrabold transition-colors",
                        selected ? "border-brand-600 bg-brand-600 text-white" : "border-mist bg-white text-ink/40",
                      )}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-mist bg-cream px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0}
            >
              <IcArrowLeft className="h-4 w-4" /> Previous
            </Button>
            <div className="hidden gap-1.5 sm:flex" aria-hidden="true">
              {quiz.questions.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === idx ? "w-6 bg-brand-600" : i < idx ? "w-2.5 bg-brand-300" : "w-2.5 bg-mist",
                  )}
                />
              ))}
            </div>
            {idx < quiz.questions.length - 1 ? (
              <Button onClick={() => setIdx((i) => i + 1)}>
                Next <IcArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="dark" onClick={() => setSubmitOpen(true)}>
                Submit Quiz
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* ============ RESULTS ============ */}
      {phase === "results" && result && (
        <div className="mx-auto max-w-3xl space-y-5">
          <Card className="overflow-hidden">
            <div className={cn("px-6 py-5", result.percentage >= 70 ? "bg-brand-600" : "bg-[#0B1512]")}>
              <div className="flex flex-wrap items-center gap-6">
                <div className="rounded-full bg-white/10 p-2">
                  <Donut
                    value={result.percentage}
                    size={104}
                    stroke={9}
                    color="var(--color-gold-400)"
                    sub="score"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold uppercase tracking-wider text-paper/60">Quiz complete</p>
                  <p className="font-display text-[24px] font-extrabold text-paper">
                    {result.score} of {result.total} correct
                  </p>
                  <p className="mt-1 text-[14px] font-medium text-paper/70">{perfLabel(result.percentage)}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 px-6 py-4">
              <Button variant="subtle" size="sm" onClick={() => quiz && beginQuiz(quiz)}>
                <IcRefresh className="h-3.5 w-3.5" /> Retake this quiz
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPhase("setup");
                  setResult(null);
                }}
              >
                <IcArrowLeft className="h-3.5 w-3.5" /> Back to generator
              </Button>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-[15px] font-bold text-ink">Answer review</h2>
            <ul className="mt-4 space-y-4">
              {result.results.map((r) => (
                <li key={r.index} className="rounded-xl border border-mist bg-white p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                        r.correct ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500",
                      )}
                    >
                      {r.correct ? <IcCheck className="h-3.5 w-3.5" /> : <IcX className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-ink">{r.index + 1}. {r.question}</p>
                      <div className="mt-3 space-y-1.5">
                        {r.options.map((opt, i) => (
                          <div
                            key={i}
                            className={cn(
                              "rounded-lg border px-3 py-2 text-[13px] font-medium",
                              i === r.correctIndex
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                : i === r.selected
                                  ? "border-red-300 bg-red-50 text-red-700"
                                  : "border-mist text-ink/50",
                            )}
                          >
                            {opt}
                            {i === r.correctIndex && <span className="ml-2 text-[11px] font-extrabold uppercase">correct</span>}
                            {i === r.selected && i !== r.correctIndex && (
                              <span className="ml-2 text-[11px] font-extrabold uppercase">your answer</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 rounded-lg bg-cream px-3.5 py-2.5 text-[13px] leading-relaxed text-ink/65">
                        <span className="font-bold text-ink/80">Why: </span>
                        {r.explanation}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Abandon / submit confirmations */}
      <Modal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        title="Submit quiz?"
        footer={
          <>
            <Button variant="outline" onClick={() => setSubmitOpen(false)}>Keep answering</Button>
            <Button onClick={() => void submit()}>
              {unanswered > 0 ? "Submit anyway" : "Submit quiz"}
            </Button>
          </>
        }
      >
        {unanswered > 0 ? (
          <p className="text-[14px] leading-relaxed text-ink/60">
            You still have <strong className="text-ink">{unanswered}</strong> unanswered
            question{unanswered === 1 ? "" : "s"}. Unanswered questions will be marked wrong.
          </p>
        ) : (
          <p className="text-[14px] leading-relaxed text-ink/60">
            You answered all {quiz?.questions.length} questions. Ready to see your score?
          </p>
        )}
      </Modal>
    </div>
  );
}
