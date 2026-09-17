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
  IcFolder,
  IcPencil,
  IcPlus,
  IcSearch,
  IcTrash,
} from "@/components/icons";
import { fmtDate, timeAgo } from "@/lib/utils";
import { useToast } from "@/components/toast";

interface Material {
  id: string;
  title: string;
  subject: string;
  description: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM = { title: "", subject: "", description: "", content: "", tags: "" };

export default function MaterialsPage() {
  const { push } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("");
  const [sort, setSort] = useState<"updated" | "created" | "title">("updated");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Material | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async (query = q, subj = subject) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (subj) params.set("subject", subj);
    try {
      const res = await fetch(`/api/materials?${params}`);
      if (res.ok) {
        const data = (await res.json()) as { materials: Material[] };
        setMaterials(data.materials);
      }
    } catch {
      push("error", "Could not load your study materials.");
    } finally {
      setLoaded(true);
    }
  }, [q, subject, push]);

  useEffect(() => {
    const t = setTimeout(() => void load(q, subject), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [q, subject, load]);

  const subjects = useMemo(
    () => [...new Set(materials.map((m) => m.subject).filter(Boolean))].sort(),
    [materials],
  );

  const visible = useMemo(() => {
    let list = [...materials];
    if (subject) list = list.filter((m) => m.subject === subject);
    list.sort((a, b) =>
      sort === "updated"
        ? b.updatedAt.localeCompare(a.updatedAt)
        : sort === "created"
          ? b.createdAt.localeCompare(a.createdAt)
          : a.title.localeCompare(b.title),
    );
    return list;
  }, [materials, subject, sort]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setEditorOpen(true);
  };
  const openEdit = (m: Material) => {
    setEditing(m);
    setForm({
      title: m.title,
      subject: m.subject,
      description: m.description,
      content: m.content,
      tags: m.tags.join(", "),
    });
    setFormError("");
    setEditorOpen(true);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (form.title.trim().length < 1) {
      setFormError("Please give this material a title.");
      return;
    }
    setSaving(true);
    setFormError("");
    const payload = {
      title: form.title.trim(),
      subject: form.subject.trim() || "General",
      description: form.description,
      content: form.content,
      tags: form.tags,
    };
    try {
      const res = await fetch(editing ? `/api/materials/${editing.id}` : "/api/materials", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.error ?? "Could not save the material.");
        return;
      }
      push("success", editing ? "Material updated." : "Material added to your library.");
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
      const res = await fetch(`/api/materials/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        push("error", data.error ?? "Could not delete the material.");
        return;
      }
      push("success", "Material deleted.");
      setDeleting(null);
      await load();
    } catch {
      push("error", "Could not delete the material.");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] font-extrabold tracking-tight text-ink">Study Materials</h1>
          <p className="mt-1 text-[14px] text-ink/50">
            Your personal library of chapters, slides, articles and reference text.
          </p>
        </div>
        <Button onClick={openCreate}>
          <IcPlus className="h-4 w-4" /> Add Material
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <IcSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search materials…"
            className="pl-10"
            aria-label="Search study materials"
          />
        </div>
        <Select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-44" aria-label="Filter by subject">
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="w-40" aria-label="Sort materials">
          <option value="updated">Last updated</option>
          <option value="created">Newest first</option>
          <option value="title">Title A–Z</option>
        </Select>
      </div>

      {!loaded ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl border border-mist bg-white/70" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<IcFolder className="h-6 w-6" />}
          title={q || subject ? "No materials match your filters" : "Add your first study material to get started"}
          message={
            q || subject
              ? "Try a different search term or clear the subject filter."
              : "Store chapters and articles here, then feed them straight into the summarizer and quiz generator."
          }
          action={
            <Button onClick={openCreate}>
              <IcPlus className="h-4 w-4" /> Add material
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((m) => (
            <Card key={m.id} className="group flex flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-display text-[15px] font-bold leading-snug text-ink">{m.title}</h3>
                  <p className="mt-1.5">
                    <Badge tone="brand">{m.subject}</Badge>
                  </p>
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(m)}
                    className="rounded-md p-1.5 text-ink/40 transition hover:bg-brand-50 hover:text-brand-700"
                    aria-label={`Edit ${m.title}`}
                  >
                    <IcPencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleting(m)}
                    className="rounded-md p-1.5 text-ink/40 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete ${m.title}`}
                  >
                    <IcTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {m.description && (
                <p className="mt-3 text-[13px] font-medium text-ink/60">{m.description}</p>
              )}
              {m.content && (
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-ink/45 line-clamp-4">
                  {m.content.slice(0, 300)}
                </p>
              )}
              {m.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.tags.slice(0, 5).map((t) => (
                    <span key={t} className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-ink/50">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-3 border-t border-mist pt-3 text-[11.5px] font-medium text-ink/35">
                Updated {timeAgo(m.updatedAt)} · created {fmtDate(m.createdAt)}
              </p>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editing ? "Edit material" : "Add study material"}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={(e) => void save(e as unknown as FormEvent)}>
              {editing ? "Save changes" : "Add material"}
            </Button>
          </>
        }
      >
        <form onSubmit={(e) => void save(e)} className="space-y-4">
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Organic Chemistry — Chapter 5: Alkenes"
              maxLength={120}
              autoFocus
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Subject">
              <Input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Chemistry"
                list="materials-subjects"
                maxLength={60}
              />
              <datalist id="materials-subjects">
                {subjects.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </Field>
            <Field label="Tags" hint="Comma separated">
              <Input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="alkenes, reactions"
              />
            </Field>
          </div>
          <Field label="Description" hint="One or two lines — what is this material?">
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="e.g. Lecture notes on addition reactions and Markovnikov's rule"
              maxLength={500}
            />
          </Field>
          <Field label="Content">
            <Textarea
              rows={9}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Paste or write the full material here…"
            />
          </Field>
          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
              {formError}
            </p>
          )}
        </form>
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete material?"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="danger" loading={deleteBusy} onClick={() => void doDelete()}>
              Delete material
            </Button>
          </>
        }
      >
        <p className="text-[14px] leading-relaxed text-ink/60">
          “{deleting?.title}” will be permanently deleted from your library.
        </p>
      </Modal>
    </div>
  );
}
