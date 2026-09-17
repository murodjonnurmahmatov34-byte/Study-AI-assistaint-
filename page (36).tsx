"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Markdown,
  Modal,
  TypingDots,
} from "@/components/ui";
import {
  IcMessage,
  IcPlus,
  IcSend,
  IcSparkles,
  IcTrash,
} from "@/components/icons";
import { cn, timeAgo } from "@/lib/utils";
import { useToast } from "@/components/toast";

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}
interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  provider?: "ai" | "local";
}

const SUGGESTIONS = [
  "Explain photosynthesis in simple terms with an example",
  "Give me a step-by-step breakdown of Newton's three laws",
  "What are the best ways to memorize French verb tenses?",
  "Help me build a study plan for a statistics midterm",
];

export default function TutorPage() {
  const { push } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState("New conversation");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = (await res.json()) as { conversations: Conversation[] };
        setConversations(data.conversations);
      }
    } catch {
      /* non-fatal */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading]);

  const selectConversation = useCallback(async (id: string) => {
    setActiveId(id);
    setMessages([]);
    setError(null);
    setListOpen(false);
    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
      if (res.ok) {
        const data = (await res.json()) as {
          conversation: { id: string; title: string };
          messages: Msg[];
        };
        setActiveTitle(data.conversation.title);
        setMessages(
          data.messages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({ ...m, role: m.role as "user" | "assistant" })),
        );
      }
    } catch {
      push("error", "Could not load this conversation.");
    }
  }, [push]);

  const startNew = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    setActiveTitle("New conversation");
    setError(null);
    setListOpen(false);
    inputRef.current?.focus();
  }, []);

  const clearConversation = useCallback(async () => {
    if (!activeId) return;
    setConfirmClear(false);
    try {
      const res = await fetch(`/api/conversations/${activeId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        push("error", data.error ?? "Could not delete the conversation.");
        return;
      }
      push("success", "Conversation deleted.");
      await loadConversations();
      startNew();
    } catch {
      push("error", "Could not delete the conversation.");
    }
  }, [activeId, loadConversations, push, startNew]);

  const send = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || loading) return;
      setInput("");
      setError(null);

      const tempUser: Msg = {
        id: `tmp-${Date.now()}`,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((m) => [...m, tempUser]);
      setLoading(true);

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: activeId, message: content }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "Something went wrong while generating your response. Please try again.");
          return;
        }
        setMessages((m) => [
          ...m,
          {
            id: data.message.id,
            role: "assistant",
            content: data.message.content,
            createdAt: data.message.createdAt,
            provider: data.message.provider,
          },
        ]);
        if (!activeId) {
          setActiveId(data.conversationId);
          setActiveTitle(data.conversation.title);
          setConversations((c) =>
            [
              {
                id: data.conversationId,
                title: data.conversation.title,
                updatedAt: data.conversation.updatedAt,
                messageCount: 2,
              },
              ...c,
            ],
          );
        } else {
          setConversations((c) =>
            c.map((cv) =>
              cv.id === data.conversationId
                ? { ...cv, title: data.conversation.title, updatedAt: data.conversation.updatedAt, messageCount: cv.messageCount + 2 }
                : cv,
            ),
          );
        }
      } catch {
        setError("Network error. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    [activeId, input, loading],
  );

  return (
    <div className="flex h-[calc(100vh-9.5rem)] min-h-[540px] gap-5">
      {/* Conversation list */}
      <div className={cn("w-full shrink-0 md:block md:w-64", listOpen ? "block" : "hidden")}>
        <Card className="flex h-full flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-mist px-4 py-3">
            <p className="text-[13px] font-bold text-ink">Conversations</p>
            <button
              onClick={startNew}
              className="flex items-center gap-1 rounded-md bg-brand-50 px-2.5 py-1.5 text-[12px] font-bold text-brand-700 transition hover:bg-brand-100"
            >
              <IcPlus className="h-3.5 w-3.5" /> New
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {!loaded && <p className="px-3 py-4 text-[13px] text-ink/40">Loading…</p>}
            {loaded && conversations.length === 0 && (
              <p className="px-3 py-4 text-[12.5px] leading-relaxed text-ink/40">
                Start a conversation with your AI tutor — it will show up here.
              </p>
            )}
            <ul className="space-y-1">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => selectConversation(c.id)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2.5 text-left transition",
                      activeId === c.id ? "bg-brand-50" : "hover:bg-ink/4",
                    )}
                  >
                    <p className={cn("truncate text-[13px] font-semibold", activeId === c.id ? "text-brand-800" : "text-ink/75")}>
                      {c.title}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-ink/35">
                      {c.messageCount} messages · {timeAgo(c.updatedAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {/* Chat area */}
      <Card className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-mist px-4 py-3">
          <button
            onClick={() => setListOpen((v) => !v)}
            className="rounded-md p-1.5 text-ink/50 transition hover:bg-ink/5 md:hidden"
            aria-label="Toggle conversation list"
          >
            <IcMessage className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
          </button>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
            <IcSparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold text-ink">
              {messages.length > 0 || activeId ? activeTitle : "AI Tutor"}
            </p>
            <p className="text-[11.5px] font-medium text-ink/40">
              {loading ? "Thinking…" : "Explains, examples, practice — always honest"}
            </p>
          </div>
          {activeId && (
            <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
              <IcTrash className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          {messages.length === 0 && !loading && (
            <EmptyState
              className="border-0 bg-transparent py-10"
              icon={<IcMessage className="h-6 w-6" />}
              title="What are you studying today?"
              message="Ask your AI tutor to explain a concept, simplify a topic, or generate practice questions."
              action={
                <div className="flex max-w-md flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => void send(s)}
                      className="rounded-full border border-mist bg-white px-3.5 py-2 text-[12.5px] font-semibold text-ink/65 transition hover:border-brand-300 hover:text-brand-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              }
            />
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[14px] leading-relaxed text-paper/95 sm:max-w-[70%]">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex gap-3">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white">
                  <IcSparkles className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 max-w-[88%] rounded-2xl rounded-tl-md border border-mist bg-cream px-4 py-3 sm:max-w-[75%]">
                  <Markdown text={m.content} />
                  {m.provider === "local" && (
                    <Badge tone="gold" className="mt-2.5">
                      Offline mode
                    </Badge>
                  )}
                </div>
              </div>
            ),
          )}

          {loading && (
            <div className="flex gap-3">
              <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white">
                <IcSparkles className="h-3.5 w-3.5" />
              </span>
              <div className="rounded-2xl rounded-tl-md border border-mist bg-cream px-4 py-3">
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="mx-4 mb-3 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 sm:mx-6">
            <p className="flex-1 text-[13px] font-medium text-red-700">{error}</p>
            <Button variant="outline" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        )}

        <div className="border-t border-mist p-3 sm:p-4">
          <div className="flex items-end gap-2.5">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={Math.min(4, Math.max(1, input.split("\n").length))}
              placeholder="Ask about any topic… (Enter to send, Shift+Enter for a new line)"
              className="max-h-32 flex-1 resize-none rounded-xl border border-mist bg-white px-4 py-3 text-[14px] leading-relaxed text-ink placeholder:text-ink/35 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              aria-label="Message the AI tutor"
              disabled={loading}
            />
            <Button
              onClick={() => void send()}
              loading={loading}
              disabled={!input.trim()}
              className="h-[46px] w-[46px] shrink-0 rounded-xl p-0"
              aria-label="Send message"
            >
              <IcSend className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
            </Button>
          </div>
          <p className="mt-2 px-1 text-[11px] font-medium text-ink/30">
            The tutor is honest about its limits — if it doesn&apos;t know, it will say so.
          </p>
        </div>
      </Card>

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear this conversation?"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmClear(false)}>
              Keep it
            </Button>
            <Button variant="danger" onClick={() => void clearConversation()}>
              Delete conversation
            </Button>
          </>
        }
      >
        <p className="text-[14px] leading-relaxed text-ink/60">
          This will permanently delete “{activeTitle}” and all of its messages
          from your account.
        </p>
      </Modal>
    </div>
  );
}
