"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui";
import {
  IcPen,
  IcPencil,
  IcPlus,
  IcSearch,
  IcTrash,
} from "@/components/icons";
import { cn, fmtDate, timeAgo } from "@/lib/utils";
import { useToast } from "@/components/toast";

interface Note {
  id: string;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM = { title: "", content: "", subject: "", tags: "" };

export default function NotesPage() {
  const { push } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("");
  const [sort, setSort] = useState<"updated" | "created" | "title">("updated");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Note | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async (query = q, subj = subject) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (subj) params.set("subject", subj);
    try {
      const res = await fetch(`/api/notes?${params}`);
      if (res.ok) {
        const data = (await res.json()) as { notes: Note[] };
        setNotes(data.notes);
      }
    } catch {
      push("error", "Could not load your notes.");
    } finally {
      setLoaded(true);
    }
  }, [q, subject, push]);

  useEffect(() => {
    const t = setTimeout(() => void load(q, subject), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [q, subject, load]);

  const subjects = useMemo(
    () => [...new Set(notes.map((n) => n.subject).filter(Boolean))].sort(),
    [notes],
  );

  const visible = useMemo(() => {
    let list = [...notes];
    if (subject) list = list.filter((n) => n.subject === subject);
    list.sort((a, b) =>
      sort === "updated"
        ? b.updatedAt.localeCompare(a.updatedAt)
        : sort === "created"
          ? b.createdAt.localeCompare(a.createdAt)
          : a.title.localeCompare(b.title),
    );
    return list;
  }, [notes, subject, sort]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setEditorOpen(true);
  };
  const openEdit = (n: Note) => {
    setEditing(n);
    setForm({
      title: n.title,
      content: n.content,
      subject: n.subject,
      tags: n.tags.join(", "),
    });
    setFormError("");
    setEditorOpen(true);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (form.title.trim().length < 1) {
      setFormError("Please give your note a title.");
      return;
    }
    setSaving(true);
    setFormError("");
    const payload = {
      title: form.title.trim(),
      content: form.content,
      subject: form.subject.trim() || "General",
      tags: form.tags,
    };
    try {
      const res = await fetch(editing ? `/api/notes/${editing.id}` : "/api/notes", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.error ?? "Could not save the note.");
        return;
      }
      push("success", editing ? "Note updated." : "Note created.");
      setEditorOpen(false);
      await load();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/notes/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        push("error", data.error ?? "Could not delete the note.");
        return;
      }
      push("success", "Note deleted.");
      setDeleting(null);
      await load();
    } catch {
      push("error", "Could not delete the note.");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] font-extrabold tracking-tight text-ink">Study Notes</h1>
          <p className="mt-1 text-[14px] text-ink/50">Capture, organize and search everything you learn.</p>
        </div>
        <Button onClick={openCreate}>
          <IcPlus className="h-4 w-4" /> New Note
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <IcSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes…"
            className="pl-10"
            aria-label="Search notes"
          />
        </div>
        <Select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-44" aria-label="Filter by subject">
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="w-40" aria-label="Sort notes">
          <option value="updated">Last updated</option>
          <option value="created">Newest first</option>
          <option value="title">Title A–Z</option>
        </Select>
      </div>

      {/* Grid */}
      {!loaded ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl border border-mist bg-white/70" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<IcPen className="h-6 w-6" />}
          title={q || subject ? "No notes match your filters" : "Your study notes will appear here"}
          message={
            q || subject
              ? "Try a different search term or clear the subject filter."
              : "Create your first note and start building your personal study library."
          }
          action={
            <Button onClick={openCreate}>
              <IcPlus className="h-4 w-4" /> Create a note
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((n) => (
            <Card
              key={n.id}
              className={cn(
                "group flex flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-[15px] font-bold leading-snug text-ink">{n.title}</h3>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(n)}
                    className="rounded-md p-1.5 text-ink/40 transition hover:bg-brand-50 hover:text-brand-700"
                    aria-label={`Edit ${n.title}`}
                  >
                    <IcPencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleting(n)}
                    className="rounded-md p-1.5 text-ink/40 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete ${n.title}`}
                  >
                    <IcTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-1.5">
                <Badge tone="brand">{n.subject}</Badge>
              </p>
              <p className="mt-3 flex-1 text-[13px] leading-relaxed text-ink/55 line-clamp-4">
                {n.content.trim() ? n.content.slice(0, 260) : "Empty note"}
              </p>
              {n.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {n.tags.slice(0, 4).map((t) => (
                    <span key={t} className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-ink/50">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-3 border-t border-mist pt-3 text-[11.5px] font-medium text-ink/35">
                Updated {timeAgo(n.updatedAt)} · created {fmtDate(n.createdAt)}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Editor modal */}
      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editing ? "Edit note" : "New note"}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={(e) => void save(e as unknown as FormEvent)}>
              {editing ? "Save changes" : "Create note"}
            </Button>
          </>
        }
      >
        <form onSubmit={(e) => void save(e)} className="space-y-4">
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Cell division — mitosis vs meiosis"
              maxLength={120}
              autoFocus
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Subject">
              <Input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Biology"
                list="subjects-list"
                maxLength={60}
              />
              <datalist id="subjects-list">
                {subjects.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </Field>
            <Field label="Tags" hint="Comma separated, e.g. mitosis, cell cycle">
              <Input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="mitosis, chapter 4"
              />
            </Field>
          </div>
          <Field label="Content">
            <Textarea
              rows={9}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Write your note… plain text, lists, formulas — anything that helps you remember."
            />
          </Field>
          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
              {formError}
            </p>
          )}
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete note?"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="danger" loading={deleteBusy} onClick={() => void doDelete()}>
              Delete note
            </Button>
          </>
        }
      >
        <p className="text-[14px] leading-relaxed text-ink/60">
          “{deleting?.title}” will be permanently deleted from your account.
        </p>
      </Modal>
    </div>
  );
}
