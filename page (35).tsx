"use client";

import { useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Markdown,
  Modal,
  Segmented,
  Select,
  Textarea,
} from "@/components/ui";
import {
  IcCheck,
  IcCheckCircle,
  IcCopy,
  IcFileText,
  IcRefresh,
  IcSparkles,
  IcTrash,
} from "@/components/icons";
import { cn, timeAgo, wordCount } from "@/lib/utils";
import { useToast } from "@/components/toast";

type Length = "short" | "medium" | "detailed";
type Difficulty = "beginner" | "intermediate" | "advanced";
type Style = "paragraph" | "bullets" | "study-guide";

interface SummaryResult {
  summary: string;
  keyPoints: string[];
  concepts: string[];
  keywords: string[];
  provider: "ai" | "local";
}

interface SavedSummary {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  concepts: string[];
  keywords: string[];
  length: string;
  difficulty: string;
  style: string;
  provider: string;
  createdAt: string;
}

export default function SummarizerPage() {
  const { push } = useToast();
  const [text, setText] = useState("");
  const [length, setLength] = useState<Length>("medium");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [style, setStyle] = useState<Style>("paragraph");
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [resultMeta, setResultMeta] = useState<{ length: Length; difficulty: Difficulty; style: Style } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [saved, setSaved] = useState<SavedSummary[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const lastInput = useRef<SummaryResult & { source: string } | null>(null);

  const wc = wordCount(text);

  useEffect(() => {
    fetch("/api/summaries")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setSaved(d.summaries as SavedSummary[]);
      })
      .catch(() => {});
  }, []);

  const generate = async (isRetry = false) => {
    if (!isRetry && text.trim().length < 200) {
      setError("Please paste at least a few sentences (200+ characters) to summarize.");
      return;
    }
    if (isRetry && lastInput.current) {
      setText(lastInput.current.source);
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, length, difficulty, style }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong while generating your summary. Please try again.");
        return;
      }
      const r: SummaryResult = {
        summary: data.summary,
        keyPoints: data.keyPoints ?? [],
        concepts: data.concepts ?? [],
        keywords: data.keywords ?? [],
        provider: data.provider,
      };
      setResult(r);
      setResultMeta({ length, difficulty, style });
      lastInput.current = { ...r, source: text };
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.summary);
      setCopied(true);
      push("success", "Summary copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      push("error", "Could not copy to clipboard.");
    }
  };

  const save = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch("/api/summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: saveTitle,
          sourceText: lastInput.current?.source ?? text,
          summary: result.summary,
          keyPoints: result.keyPoints,
          concepts: result.concepts,
          keywords: result.keywords,
          length: resultMeta?.length ?? length,
          difficulty: resultMeta?.difficulty ?? difficulty,
          style: resultMeta?.style ?? style,
          provider: result.provider,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        push("error", data.error ?? "Could not save the summary.");
        return;
      }
      push("success", "Summary saved to your library.");
      setSaveOpen(false);
      setSaveTitle("");
      const list = await fetch("/api/summaries").then((r) => (r.ok ? r.json() : null));
      if (list) setSaved(list.summaries as SavedSummary[]);
    } catch {
      push("error", "Could not save the summary.");
    } finally {
      setSaving(false);
    }
  };

  const deleteSaved = async (id: string) => {
    try {
      const res = await fetch(`/api/summaries/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        push("error", data.error ?? "Could not delete the summary.");
        return;
      }
      setSaved((s) => s.filter((x) => x.id !== id));
      push("success", "Summary deleted.");
    } catch {
      push("error", "Could not delete the summary.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[24px] font-extrabold tracking-tight text-ink">
          AI Summarizer
        </h1>
        <p className="mt-1 text-[14px] text-ink/50">
          Paste lecture notes, article text or a chapter — get a summary, key points, concepts and keywords.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Input */}
        <Card className="flex flex-col p-5">
          <div className="mb-3 flex items-center justify-between">
            <label htmlFor="source" className="text-[13px] font-bold text-ink">
              Source text
            </label>
            <span className={cn("text-[11.5px] font-semibold", wc >= 200 ? "text-brand-600" : "text-ink/35")}>
              {wc.toLocaleString()} words
            </span>
          </div>
          <Textarea
            id="source"
            rows={12}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error && text.trim().length >= 200) setError(null);
            }}
            placeholder="Paste your study material here. Minimum 200 characters — the longer the text, the better the summary."
            className="flex-1"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="mb-1.5 text-[12px] font-bold text-ink/60">Summary length</p>
              <Segmented
                value={length}
                onChange={setLength}
                options={[
                  { value: "short", label: "Short" },
                  { value: "medium", label: "Medium" },
                  { value: "detailed", label: "Detailed" },
                ]}
              />
            </div>
            <div>
              <p className="mb-1.5 text-[12px] font-bold text-ink/60">Difficulty</p>
              <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} aria-label="Difficulty level">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </div>
            <div>
              <p className="mb-1.5 text-[12px] font-bold text-ink/60">Style</p>
              <Select value={style} onChange={(e) => setStyle(e.target.value as Style)} aria-label="Summary style">
                <option value="paragraph">Paragraph</option>
                <option value="bullets">Bullet points</option>
                <option value="study-guide">Study guide</option>
              </Select>
            </div>
          </div>
          <Button size="lg" className="mt-4" loading={loading} onClick={() => void generate()}>
            <IcSparkles className="h-4 w-4" /> Generate Summary
          </Button>
        </Card>

        {/* Result */}
        <Card className="flex flex-col p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-bold text-ink">Summary</p>
            {result && (
              <Badge tone={result.provider === "ai" ? "brand" : "gold"}>
                {result.provider === "ai" ? "AI generated" : "Offline engine"}
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="flex-1 space-y-3 py-2">
              {[92, 100, 78, 96, 60, 88, 45].map((w, i) => (
                <div key={i} className="h-3.5 animate-pulse rounded-full bg-ink/8" style={{ width: `${w}%`, animationDelay: `${i * 90}ms` }} />
              ))}
              <p className="pt-2 text-[12.5px] font-semibold text-ink/40">
                Summarizing your text…
              </p>
            </div>
          ) : error ? (
            <ErrorState
              message={error}
              onRetry={() => void generate(true)}
              className="flex-1"
            />
          ) : result ? (
            <div className="flex-1 space-y-5 overflow-y-auto pr-1" style={{ maxHeight: "520px" }}>
              <div className="rounded-xl bg-cream p-4">
                <Markdown text={result.summary} />
              </div>
              {result.keyPoints.length > 0 && (
                <div>
                  <p className="mb-2 text-[12px] font-extrabold uppercase tracking-wider text-ink/40">Key points</p>
                  <ul className="space-y-1.5">
                    {result.keyPoints.map((k, i) => (
                      <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink/70">
                        <IcCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                        {k}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.concepts.length > 0 && (
                <div>
                  <p className="mb-2 text-[12px] font-extrabold uppercase tracking-wider text-ink/40">Important concepts</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.concepts.map((c, i) => (
                      <span key={i} className="rounded-full bg-brand-50 px-3 py-1 text-[12px] font-bold capitalize text-brand-800">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {result.keywords.length > 0 && (
                <div>
                  <p className="mb-2 text-[12px] font-extrabold uppercase tracking-wider text-ink/40">Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywords.map((k, i) => (
                      <span key={i} className="rounded-full border border-mist bg-white px-3 py-1 text-[12px] font-semibold capitalize text-ink/55">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2 border-t border-mist pt-4">
                <Button variant="outline" size="sm" onClick={() => void copy()}>
                  {copied ? <IcCheck className="h-3.5 w-3.5" /> : <IcCopy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => {
                    setSaveTitle(resultMeta ? result.summary.slice(0, 48) : "");
                    setSaveOpen(true);
                  }}
                >
                  <IcCheck className="h-3.5 w-3.5" /> Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void generate(true)}>
                  <IcRefresh className="h-3.5 w-3.5" /> Regenerate
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              className="flex-1 border-0 bg-transparent"
              icon={<IcFileText className="h-6 w-6" />}
              title="Your summary will appear here"
              message="Paste some text on the left and choose your preferred length, level and style."
            />
          )}
        </Card>
      </div>

      {/* Saved summaries */}
      <Card className="p-5">
        <h2 className="font-display text-[15px] font-bold text-ink">Saved summaries</h2>
        {saved.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-mist bg-cream px-4 py-8 text-center text-[13.5px] text-ink/45">
            Your saved summaries will appear here.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-mist">
            {saved.map((s) => (
              <li key={s.id}>
                <div className="flex items-center gap-3 py-3">
                  <button
                    onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-[14px] font-bold text-ink">{s.title}</p>
                    <p className="mt-0.5 text-[11.5px] font-medium text-ink/40">
                      {s.length} · {s.difficulty} · {timeAgo(s.createdAt)}
                      {s.provider === "ai" ? " · AI" : " · offline"}
                    </p>
                  </button>
                  <Button variant="ghost" size="sm" onClick={() => void deleteSaved(s.id)} aria-label={`Delete ${s.title}`}>
                    <IcTrash className="h-4 w-4" />
                  </Button>
                </div>
                {expanded === s.id && (
                  <div className="mb-3 space-y-3 rounded-lg bg-cream p-4">
                    <Markdown text={s.summary} />
                    {s.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {s.keywords.map((k, i) => (
                          <span key={i} className="rounded-full border border-mist bg-white px-2.5 py-0.5 text-[11.5px] font-semibold capitalize text-ink/50">
                            {k}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="Save summary"
        footer={
          <>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={() => void save()}>Save summary</Button>
          </>
        }
      >
        <label className="mb-1.5 block text-[13px] font-semibold text-ink/80" htmlFor="save-title">
          Title
        </label>
        <input
          id="save-title"
          value={saveTitle}
          onChange={(e) => setSaveTitle(e.target.value)}
          maxLength={120}
          placeholder="e.g. Cell biology — week 3 summary"
          className="w-full rounded-lg border border-mist bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          autoFocus
        />
        <p className="mt-2 text-[12px] text-ink/45">
          Saved to your library and counted as a study session.
        </p>
      </Modal>
    </div>
  );
}
