"use client";

import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn, initials } from "@/lib/utils";
import { IcAlert, IcSpinner, IcX } from "./icons";

/* ---------- Button ---------- */

type Variant = "primary" | "dark" | "outline" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantCls: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm shadow-brand-900/20",
  dark: "bg-ink text-paper hover:bg-ink/90 active:bg-black shadow-sm",
  outline:
    "border border-mist bg-white text-ink hover:border-brand-400 hover:text-brand-700",
  ghost: "text-ink/70 hover:bg-ink/5 hover:text-ink",
  danger: "bg-red-600 text-white hover:bg-red-700",
  subtle: "bg-brand-50 text-brand-800 hover:bg-brand-100",
};
const sizeCls: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:pointer-events-none disabled:opacity-50",
        variantCls[variant],
        sizeCls[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <IcSpinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

/* ---------- Form primitives ---------- */

export function Label({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[13px] font-semibold text-ink/80"
    >
      {children}
    </label>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-[13px] text-red-600">
          <IcAlert className="h-3.5 w-3.5" /> {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] text-ink/45">{hint}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  "w-full rounded-lg border border-mist bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, className)} {...rest} />;
}

export function Textarea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(inputBase, "leading-relaxed", className)} {...rest} />
  );
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputBase, "appearance-none pr-8", className)} {...rest}>
      {children}
    </select>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-mist bg-white p-1",
        className,
      )}
      role="tablist"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-[13px] font-semibold transition-all",
            value === o.value
              ? "bg-ink text-paper shadow-sm"
              : "text-ink/55 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Surfaces ---------- */

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-mist bg-white shadow-[0_1px_2px_rgba(12,21,18,0.04),0_4px_16px_-8px_rgba(12,21,18,0.08)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "gold" | "success" | "danger";
  className?: string;
}) {
  const tones = {
    neutral: "bg-ink/5 text-ink/60",
    brand: "bg-brand-50 text-brand-700",
    gold: "bg-amber-50 text-amber-700",
    success: "bg-emerald-50 text-emerald-700",
    danger: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({
  name,
  hue,
  size = "md",
  className,
}: {
  name: string;
  hue: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "h-7 w-7 text-[11px]", md: "h-9 w-9 text-[13px]", lg: "h-16 w-16 text-xl" };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-display font-bold text-white",
        sizes[size],
        className,
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 45% 38%), hsl(${(hue + 40) % 360} 50% 26%))`,
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function ProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-ink/8", className)}>
      <div
        className="h-full rounded-full bg-brand-500 transition-all duration-700 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ---------- States ---------- */

export function EmptyState({
  icon,
  title,
  message,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-mist bg-white/60 px-6 py-14 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          {icon}
        </div>
      )}
      <h3 className="font-display text-[15px] font-bold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink/50">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-red-100 bg-red-50/60 px-6 py-10 text-center",
        className,
      )}
    >
      <IcAlert className="h-8 w-8 text-red-400" />
      <p className="max-w-md text-sm font-medium text-red-800">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/* ---------- Modal ---------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-ink/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (ref.current && !ref.current.contains(e.target as Node)) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "modal-in max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-mist bg-cream shadow-2xl sm:rounded-2xl",
          wide ? "sm:max-w-2xl" : "sm:max-w-md",
        )}
      >
        <div className="flex items-center justify-between border-b border-mist px-5 py-4">
          <h2 className="font-display text-[15px] font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-ink/40 transition hover:bg-ink/5 hover:text-ink"
            aria-label="Close dialog"
          >
            <IcX className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-mist px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Lightweight markdown renderer ---------- */

function inline(text: string, keyBase: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    const key = `${keyBase}-${i}`;
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) {
      return (
        <strong key={key} className="font-semibold text-ink">
          {p.slice(2, -2)}
        </strong>
      );
    }
    if (p.startsWith("`") && p.endsWith("`") && p.length > 2) {
      return (
        <code
          key={key}
          className="rounded bg-ink/6 px-1 py-0.5 font-mono text-[0.85em] text-brand-800"
        >
          {p.slice(1, -1)}
        </code>
      );
    }
    return <span key={key}>{p}</span>;
  });
}

export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trimStart().startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      blocks.push(
        <pre
          key={k++}
          className="overflow-x-auto rounded-lg bg-ink p-3 font-mono text-[12.5px] leading-relaxed text-paper/90"
        >
          {buf.join("\n")}
        </pre>,
      );
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={k++} className="space-y-1.5 pl-1">
          {items.map((it, j) => (
            <li key={j} className="flex gap-2.5">
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
              <span>{inline(it, `ul${k}-${j}`)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={k++} className="space-y-1.5">
          {items.map((it, j) => (
            <li key={j} className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">
                {j + 1}
              </span>
              <span>{inline(it, `ol${k}-${j}`)}</span>
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push(
        <h4 key={k++} className="pt-2 font-display text-[14px] font-bold text-ink">
          {inline(line.slice(4), `h4${k}`)}
        </h4>,
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(
        <h3 key={k++} className="pt-2 font-display text-[15px] font-bold text-ink">
          {inline(line.slice(3), `h3${k}`)}
        </h3>,
      );
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push(
        <h2 key={k++} className="pt-2 font-display text-base font-bold text-ink">
          {inline(line.slice(2), `h2${k}`)}
        </h2>,
      );
      i++;
      continue;
    }
    if (line.startsWith("> ")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        buf.push(lines[i].slice(2));
        i++;
      }
      blocks.push(
        <blockquote
          key={k++}
          className="rounded-r-lg border-l-[3px] border-gold-400 bg-gold-100/50 px-3.5 py-2.5 text-[13.5px] italic text-ink/70"
        >
          {buf.map((b, j) => (
            <p key={j}>{inline(b, `q${k}-${j}`)}</p>
          ))}
        </blockquote>,
      );
      continue;
    }

    if (!line.trim()) {
      i++;
      continue;
    }

    const buf: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#|>|\s*[-*]\s|\s*\d+\.\s|```)/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={k++} className="leading-relaxed">
        {buf.map((b, j) => (
          <span key={j}>
            {j > 0 && " "}
            {inline(b, `p${k}-${j}`)}
          </span>
        ))}
      </p>,
    );
  }

  return <div className="space-y-3 text-[14px] text-ink/75">{blocks}</div>;
}

/* ---------- Typing indicator ---------- */

export function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-1 py-1" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot h-1.5 w-1.5 rounded-full bg-brand-400"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}
