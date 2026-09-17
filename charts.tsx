"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { DayPoint } from "@/lib/stats";

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setM(true));
    return () => cancelAnimationFrame(t);
  }, []);
  return m;
}

/* ---------- Vertical bars (weekly/monthly activity) ---------- */

export function BarChart({
  data,
  height = 148,
  accent = "bg-brand-500",
  emptyLabel = "No activity yet",
}: {
  data: DayPoint[];
  height?: number;
  accent?: string;
  emptyLabel?: string;
}) {
  const mounted = useMounted();
  const max = Math.max(1, ...data.map((d) => d.value));
  const allZero = data.every((d) => d.value === 0);

  return (
    <div>
      <div
        className="relative flex items-end justify-between gap-2 sm:gap-3"
        style={{ height }}
      >
        {allZero && (
          <span className="absolute inset-0 flex items-center justify-center text-xs text-ink/35">
            {emptyLabel}
          </span>
        )}
        {data.map((d, i) => (
          <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-[11px] font-bold text-ink/45 opacity-0 transition group-hover:opacity-100">
              {d.value}
            </span>
            <div
              className={cn(
                "w-full max-w-9 rounded-t-md transition-all duration-700 ease-out group-hover:opacity-90",
                d.value > 0 ? accent : "bg-ink/8",
              )}
              style={{
                height: mounted ? `${Math.max(4, (d.value / max) * 100)}%` : "4%",
                transitionDelay: `${i * 45}ms`,
              }}
              title={`${d.label}: ${d.value}`}
            />
            <span className="text-[10.5px] font-semibold uppercase tracking-wide text-ink/40">
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Line/area (quiz performance) ---------- */

export function LineChart({
  data,
  height = 160,
  max = 100,
  emptyLabel = "Complete a quiz to see your trend",
}: {
  data: { label: string; value: number; title?: string }[];
  height?: number;
  max?: number;
  emptyLabel?: string;
}) {
  const mounted = useMounted();
  const W = 600;
  const H = 200;
  const pad = 18;
  const n = data.length;
  const allZero = n === 0;

  const pts = data.map((d, i) => {
    const x = n === 1 ? W / 2 : pad + (i * (W - pad * 2)) / (n - 1);
    const y = H - pad - (Math.min(d.value, max) / max) * (H - pad * 2);
    return { x, y, d };
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area =
    pts.length > 1
      ? `${path} L${pts[pts.length - 1].x},${H - pad} L${pts[0].x},${H - pad} Z`
      : "";

  return (
    <div className="relative">
      {allZero && (
        <span
          className="absolute inset-0 flex items-center justify-center text-xs text-ink/35"
          style={{ height }}
        >
          {emptyLabel}
        </span>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="Quiz performance over time"
      >
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-500, #21876d)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-brand-500, #21876d)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={pad}
            x2={W - pad}
            y1={H - pad - f * (H - pad * 2)}
            y2={H - pad - f * (H - pad * 2)}
            stroke="var(--color-mist, #e4e2d9)"
            strokeDasharray="3 5"
            strokeWidth="1"
          />
        ))}
        {area && <path d={area} fill="url(#lineFill)" opacity={mounted ? 1 : 0} style={{ transition: "opacity .8s ease" }} />}
        {path && (
          <path
            d={path}
            fill="none"
            stroke="var(--color-brand-600, #106e58)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={mounted ? 0 : 100}
            style={{ transition: "stroke-dashoffset 1.1s ease" }}
          />
        )}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={mounted ? 4.5 : 0}
            fill="var(--color-cream, #fcfbf8)"
            stroke="var(--color-brand-600, #106e58)"
            strokeWidth="2"
            style={{ transition: `r .3s ease ${0.5 + i * 0.08}s` }}
          >
            <title>{`${p.d.title ?? p.d.label}: ${p.d.value}%`}</title>
          </circle>
        ))}
      </svg>
      {n > 0 && (
        <div className="mt-1 flex justify-between px-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink/40">
          <span>{data[0].label}</span>
          {n > 2 && <span>{data[Math.floor(n / 2)].label}</span>}
          <span>{data[n - 1].label}</span>
        </div>
      )}
    </div>
  );
}

/* ---------- Donut (score / goal) ---------- */

export function Donut({
  value,
  size = 132,
  stroke = 11,
  label,
  sub,
  color = "var(--color-brand-500)",
}: {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  label?: string;
  sub?: string;
  color?: string;
}) {
  const mounted = useMounted();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-mist, #e4e2d9)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={mounted ? c - (pct / 100) * c : c}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.25,.8,.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-extrabold text-ink">{label ?? `${Math.round(pct)}%`}</span>
        {sub && <span className="text-[11px] font-semibold text-ink/45">{sub}</span>}
      </div>
    </div>
  );
}

/* ---------- Horizontal bars (activity mix / subjects) ---------- */

export function HBarList({
  items,
  emptyLabel,
}: {
  items: { label: string; value: number; hint?: string }[];
  emptyLabel?: string;
}) {
  const mounted = useMounted();
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-ink/35">
        {emptyLabel ?? "Nothing here yet"}
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((it, i) => (
        <li key={it.label}>
          <div className="mb-1 flex items-baseline justify-between text-[13px]">
            <span className="font-semibold text-ink/75">{it.label}</span>
            <span className="text-ink/40">{it.hint ?? it.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink/6">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-700 ease-out"
              style={{
                width: mounted ? `${(it.value / max) * 100}%` : "0%",
                transitionDelay: `${i * 60}ms`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
