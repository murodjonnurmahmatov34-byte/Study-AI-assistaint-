"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  IcArrowRight,
  IcBulb,
  IcCap,
  IcChart,
  IcCheck,
  IcChevronDown,
  IcFileText,
  IcFlame,
  IcLayers,
  IcMenu,
  IcMessage,
  IcPen,
  IcShield,
  IcSparkles,
  IcTarget,
  IcTrend,
  IcX,
  IcZap,
} from "@/components/icons";

/* ---------------- Motion helpers ---------------- */

function useRevealObserver() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((e) => e.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function Kicker({ children }: { children: string }) {
  return (
    <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-brand-700">
      <IcSparkles className="h-3.5 w-3.5" /> {children}
    </p>
  );
}

/* ---------------- Nav ---------------- */

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#about", label: "About" },
];

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-mist/80 bg-paper/85 shadow-[0_4px_24px_-12px_rgba(11,21,18,0.15)] backdrop-blur-md"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B1512] text-brand-400">
            <IcSparkles style={{ width: 17, height: 17 }} />
          </span>
          <span className="font-display text-[17px] font-extrabold tracking-tight text-ink">
            Study<span className="text-brand-600">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13.5px] font-semibold text-ink/60 transition hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-[13.5px] font-semibold text-ink/70 transition hover:bg-ink/5 hover:text-ink"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="group inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2.5 text-[13.5px] font-bold text-paper shadow-sm transition hover:bg-brand-800"
          >
            Get Started
            <IcArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          className="rounded-lg p-2 text-ink/70 hover:bg-ink/5 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <IcX className="h-5 w-5" /> : <IcMenu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-mist bg-paper px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[14px] font-semibold text-ink/70 hover:bg-ink/5"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-3 flex gap-2 border-t border-mist pt-3">
              <Link
                href="/login"
                className="flex-1 rounded-lg border border-mist bg-white px-4 py-2.5 text-center text-[13.5px] font-bold text-ink"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex-1 rounded-lg bg-ink px-4 py-2.5 text-center text-[13.5px] font-bold text-paper"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

/* ---------------- Hero product mock ---------------- */

function HeroMock() {
  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[460px] select-none sm:h-[480px]" aria-hidden="true">
      {/* Main chat card */}
      <div className="float-soft absolute left-1/2 top-1/2 w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-mist bg-white p-4 shadow-[0_24px_60px_-20px_rgba(11,21,18,0.35)] sm:w-[350px]">
        <div className="mb-3 flex items-center gap-2 border-b border-mist pb-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-white">
            <IcSparkles className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[12px] font-bold text-ink">AI Tutor</p>
            <p className="text-[10px] font-medium text-ink/40">Biology · Photosynthesis</p>
          </div>
          <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400" />
        </div>
        <div className="space-y-2.5">
          <div className="ml-auto w-[85%] rounded-xl rounded-tr-sm bg-ink px-3 py-2 text-[11.5px] leading-snug text-paper/90">
            Explain how photosynthesis converts light into energy — keep it simple.
          </div>
          <div className="w-[92%] space-y-1.5 rounded-xl rounded-tl-sm bg-brand-50 px-3 py-2.5">
            <p className="text-[11px] font-semibold text-brand-900">
              1. Light reactions capture photons…
            </p>
            <div className="h-1.5 w-11/12 rounded-full bg-brand-200" />
            <div className="h-1.5 w-4/5 rounded-full bg-brand-200" />
            <div className="h-1.5 w-3/5 rounded-full bg-brand-200" />
            <p className="pt-1 text-[11px] font-semibold text-brand-900">
              2. …then the Calvin cycle fixes CO₂ 🌱
            </p>
            <div className="h-1.5 w-10/12 rounded-full bg-brand-200" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-mist bg-cream px-3 py-2">
          <span className="text-[11px] text-ink/35">Ask a follow-up…</span>
          <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-white">
            <IcArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* Quiz card */}
      <div
        className="float-soft absolute -top-2 right-0 w-[210px] rounded-xl border border-mist bg-white p-3.5 shadow-[0_18px_44px_-18px_rgba(11,21,18,0.3)] sm:-right-2"
        style={{ animationDelay: "1.2s", ["--float-rot" as string]: "3deg" }}
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-ink">
            <IcTarget className="h-3.5 w-3.5 text-brand-600" /> Quiz · Q3/5
          </p>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
            80%
          </span>
        </div>
        <p className="text-[11px] font-medium leading-snug text-ink/70">
          True or false: Chlorophyll absorbs red and blue light.
        </p>
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700">
            <IcCheck className="h-3 w-3" /> True
          </div>
          <div className="rounded-lg border border-mist px-2.5 py-1.5 text-[11px] font-semibold text-ink/40">
            False
          </div>
        </div>
      </div>

      {/* Streak / progress card */}
      <div
        className="float-soft absolute -bottom-1 left-0 w-[200px] rounded-xl border border-mist bg-white p-3.5 shadow-[0_18px_44px_-18px_rgba(11,21,18,0.3)] sm:-left-3"
        style={{ animationDelay: "0.6s", ["--float-rot" as string]: "-3deg" }}
      >
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-ink">
          <IcFlame className="h-3.5 w-3.5 text-gold-500" /> Study streak
        </p>
        <div className="flex items-end justify-between gap-1">
          {[38, 62, 45, 80, 55, 92, 70].map((h, i) => (
            <div
              key={i}
              className={cn("w-full rounded-sm", i === 5 ? "bg-brand-500" : "bg-brand-100")}
              style={{ height: `${h * 0.42}px` }}
            />
          ))}
        </div>
        <p className="mt-2 text-[10.5px] font-semibold text-ink/45">
          6-day streak · 3h 20m this week
        </p>
      </div>
    </div>
  );
}

/* ---------------- Sections ---------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
      {/* Ambient washes */}
      <div className="pointer-events-none absolute -top-40 right-[-10%] h-[420px] w-[420px] rounded-full bg-brand-100/70 blur-3xl" />
      <div className="pointer-events-none absolute top-40 left-[-8%] h-[300px] w-[300px] rounded-full bg-gold-100/80 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="reveal is-in">
            <Kicker>AI-powered study companion</Kicker>
          </div>
          <h1 className="font-display text-[42px] font-extrabold leading-[1.04] tracking-tight text-ink sm:text-[58px]">
            <span className="line-mask">Learn Smarter</span>
            <span className="line-mask text-brand-700" style={{ ["--mask-delay" as string]: "140ms" }}>
              with AI
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-[16.5px] leading-relaxed text-ink/60">
            StudyAI helps you understand complex topics, create personalized
            study materials, practice with AI-generated quizzes, and track your
            learning progress — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="group inline-flex h-12 items-center gap-2 rounded-lg bg-ink px-6 text-[15px] font-bold text-paper shadow-lg shadow-ink/20 transition-all hover:-translate-y-0.5 hover:bg-brand-800"
            >
              Get Started Free
              <IcArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#features"
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-mist bg-white px-6 text-[15px] font-bold text-ink transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700"
            >
              Explore Features
            </a>
          </div>
          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-semibold text-ink/50">
            {["Free to start", "No credit card", "Your data stays yours"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <IcCheck className="h-3.5 w-3.5 text-brand-600" /> {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="reveal is-in" style={{ ["--reveal-delay" as string]: "150ms" }}>
          <HeroMock />
        </div>
      </div>
    </section>
  );
}

function SubjectMarquee() {
  const subjects = [
    "Biology", "Calculus", "World History", "Physics", "Spanish", "Chemistry",
    "Economics", "Psychology", "Literature", "Statistics", "Computer Science", "Philosophy",
  ];
  const row = [...subjects, ...subjects];
  return (
    <section className="border-y border-mist bg-cream py-5" aria-label="Subjects covered">
      <div className="relative overflow-hidden">
        <div className="marquee-track flex w-max items-center gap-3">
          {row.map((s, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 rounded-full border border-mist bg-white px-4 py-1.5 text-[12.5px] font-semibold text-ink/55"
            >
              <IcCap className="h-3.5 w-3.5 text-brand-500" /> {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: IcMessage,
    title: "AI Study Assistant",
    body: "Ask anything, get patient step-by-step explanations with examples. The tutor breaks hard concepts down until they click — and is honest when it doesn't know.",
    span: "md:col-span-4",
    mock: (
      <div className="mt-5 space-y-2 rounded-xl border border-mist bg-cream p-3.5">
        <div className="ml-auto w-2/3 rounded-lg bg-ink px-3 py-1.5 text-[11px] text-paper/90">
          Why does the sky scatter blue light more than red?
        </div>
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-ink/75">
            Short version: Rayleigh scattering. It&apos;s stronger for short wavelengths…
          </p>
          <div className="h-1.5 w-full rounded-full bg-mist" />
          <div className="h-1.5 w-11/12 rounded-full bg-mist" />
          <div className="h-1.5 w-3/5 rounded-full bg-mist" />
        </div>
      </div>
    ),
  },
  {
    icon: IcFileText,
    title: "Smart Summaries",
    body: "Paste lecture notes or article text and get a tight summary, key points, concepts and keywords — in the length and style you need.",
    span: "md:col-span-2",
    mock: (
      <div className="mt-5 space-y-1.5 rounded-xl border border-mist bg-cream p-3.5">
        {["Photosynthesis occurs in chloroplasts", "Light reactions → ATP & NADPH", "Calvin cycle fixes CO₂"].map((t) => (
          <p key={t} className="flex items-start gap-1.5 text-[11px] font-medium text-ink/65">
            <IcCheck className="mt-0.5 h-3 w-3 shrink-0 text-brand-500" /> {t}
          </p>
        ))}
      </div>
    ),
  },
  {
    icon: IcTarget,
    title: "AI Quiz Generator",
    body: "Turn any topic or your own material into multiple-choice or true/false quizzes with explanations for every answer.",
    span: "md:col-span-2",
    mock: (
      <div className="mt-5 rounded-xl border border-mist bg-cream p-3.5">
        <p className="text-[11px] font-bold text-ink/80">Q1 · Which organelle makes ATP?</p>
        <div className="mt-2 space-y-1">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10.5px] font-semibold text-emerald-700">Mitochondria ✓</div>
          <div className="rounded-md border border-mist px-2.5 py-1 text-[10.5px] font-medium text-ink/40">Ribosome</div>
          <div className="rounded-md border border-mist px-2.5 py-1 text-[10.5px] font-medium text-ink/40">Nucleus</div>
        </div>
      </div>
    ),
  },
  {
    icon: IcPen,
    title: "Study Notes",
    body: "A clean home for your notes — organized by subject, searchable, tagged, and always synced to your account.",
    span: "md:col-span-2",
    mock: (
      <div className="mt-5 space-y-1.5">
        {["Organic chem reactions", "French verbs — future", "Essay outline: Rome"].map((t) => (
          <div key={t} className="flex items-center gap-2 rounded-lg border border-mist bg-white px-3 py-2">
            <IcPen className="h-3 w-3 text-brand-500" />
            <span className="text-[11px] font-semibold text-ink/70">{t}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: IcTrend,
    title: "Learning Progress",
    body: "Real stats from your activity: streaks, weekly effort, quiz trends and the subjects that need your attention.",
    span: "md:col-span-2",
    mock: (
      <div className="mt-5 rounded-xl border border-mist bg-cream p-3.5">
        <div className="flex h-16 items-end gap-1.5">
          {[40, 65, 30, 80, 55, 95, 70].map((h, i) => (
            <div key={i} className="w-full rounded-sm bg-brand-400/80" style={{ height: `${h}%` }} />
          ))}
        </div>
        <p className="mt-2 text-[10.5px] font-semibold text-ink/45">Weekly activity ↑</p>
      </div>
    ),
  },
  {
    icon: IcLayers,
    title: "Personalized Learning",
    body: "StudyAI adapts to you: it remembers your subjects, recommends what to review next, and shapes difficulty around your level. Set a weekly goal and watch yourself close the gap.",
    span: "md:col-span-6",
    mock: (
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {["Biology", "Calculus II", "Spanish", "Microeconomics"].map((t, i) => (
          <span
            key={t}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[12px] font-bold",
              i === 0 ? "bg-brand-600 text-white" : "border border-mist bg-white text-ink/60",
            )}
          >
            {i === 0 ? `Review next: ${t}` : t}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-1.5 text-[12px] font-bold text-gold-600">
          <IcFlame className="h-4 w-4" /> Goal: 2h this week
        </span>
      </div>
    ),
  },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
      <div className="reveal max-w-2xl">
        <Kicker>Everything you need to study better</Kicker>
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          One workspace, six superpowers
        </h2>
        <p className="mt-4 text-[15.5px] leading-relaxed text-ink/55">
          Stop juggling chatbots, note apps, flashcard sites and spreadsheets.
          StudyAI brings the whole study workflow together.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-6">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <article
              key={f.title}
              className={cn(
                "reveal group rounded-2xl border border-mist bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_-20px_rgba(11,21,18,0.25)]",
                f.span,
              )}
              style={{ ["--reveal-delay" as string]: `${(i % 3) * 90}ms` }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-display text-[16px] font-bold text-ink">{f.title}</h3>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-ink/55">{f.body}</p>
              {f.mock}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: IcBulb,
      title: "Bring your material",
      body: "Paste lecture notes, article text or just a topic. Ask your AI tutor anything, and save what matters as notes and study materials.",
    },
    {
      icon: IcZap,
      title: "Learn & practice",
      body: "Get summaries tuned to your level, then lock it in with AI-generated quizzes — every answer comes with an explanation.",
    },
    {
      icon: IcChart,
      title: "Track your progress",
      body: "Every session feeds your dashboard: streaks, weekly activity, quiz trends and smart recommendations for what to study next.",
    },
  ];
  return (
    <section id="how" className="bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal mx-auto max-w-2xl text-center">
          <Kicker>How StudyAI works</Kicker>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            From confused to confident in three steps
          </h2>
        </div>
        <div className="relative mt-14 grid gap-8 md:grid-cols-3">
          <div className="absolute left-[16%] right-[16%] top-7 hidden border-t-2 border-dashed border-brand-200 md:block" aria-hidden="true" />
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="reveal relative text-center"
                style={{ ["--reveal-delay" as string]: `${i * 120}ms` }}
              >
                <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-200 bg-white text-brand-600 shadow-sm">
                  <Icon className="h-6 w-6" />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink font-display text-[11px] font-bold text-paper">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-[16px] font-bold text-ink">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-ink/55">
                  {s.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    {
      quote:
        "I went from dreading organic chemistry to actually explaining it to my study group. The quiz generator is scary good at finding my weak spots.",
      name: "Maya R.",
      role: "Pre-med student",
      hue: 160,
      stars: 5,
    },
    {
      quote:
        "The summarizer saves me hours before every exam. I paste my lecture notes, get key points, and turn them into quizzes the same night.",
      name: "Daniel K.",
      role: "Engineering undergrad",
      hue: 25,
      stars: 5,
    },
    {
      quote:
        "Honestly, it's the progress page that kept me going. Seeing my streak and quiz scores climb made studying feel like a game I wanted to win.",
      name: "Sofia L.",
      role: "Language learner",
      hue: 265,
      stars: 5,
    },
  ];
  return (
    <section id="testimonials" className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
      <div className="reveal mx-auto max-w-2xl text-center">
        <Kicker>From the study group</Kicker>
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Students who stopped cramming
        </h2>
      </div>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {quotes.map((q, i) => (
          <figure
            key={q.name}
            className={cn(
              "reveal flex flex-col rounded-2xl border border-mist bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_-20px_rgba(11,21,18,0.22)]",
              i === 1 && "md:translate-y-6",
            )}
            style={{ ["--reveal-delay" as string]: `${i * 110}ms` }}
          >
            <div className="flex gap-1 text-gold-500" aria-label={`${q.stars} out of 5 stars`}>
              {Array.from({ length: q.stars }).map((_, j) => (
                <svg key={j} viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                  <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <blockquote className="mt-4 flex-1 text-[14px] leading-relaxed text-ink/70">
              “{q.quote}”
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-mist pt-4">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full font-display text-[13px] font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, hsl(${q.hue} 45% 40%), hsl(${(q.hue + 40) % 360} 50% 27%))`,
                }}
              >
                {q.name.split(" ").map((w) => w[0]).join("")}
              </span>
              <div>
                <p className="text-[13.5px] font-bold text-ink">{q.name}</p>
                <p className="text-[12px] font-medium text-ink/45">{q.role}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    {
      name: "Starter",
      price: "$0",
      period: "forever",
      blurb: "For getting the feel of AI-powered studying.",
      features: ["AI tutor conversations", "3 summaries / day", "5 quizzes / week", "Notes & materials", "Basic progress tracking"],
      cta: "Start free",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$12",
      period: "per month",
      blurb: "For serious students who study every week.",
      features: ["Unlimited AI tutor", "Unlimited summaries & quizzes", "Advanced progress analytics", "Recommended study topics", "Priority AI responses"],
      cta: "Get started free",
      highlight: true,
    },
    {
      name: "Campus",
      price: "$29",
      period: "per month",
      blurb: "For study groups, clubs and shared classrooms.",
      features: ["Everything in Pro", "Up to 10 members", "Shared study materials", "Group quiz challenges", "Shared progress board"],
      cta: "Get started free",
      highlight: false,
    },
  ];
  return (
    <section id="pricing" className="bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal mx-auto max-w-2xl text-center">
          <Kicker>Pricing</Kicker>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Start free. Upgrade when it clicks.
          </h2>
        </div>
        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
          {tiers.map((t, i) => (
            <div
              key={t.name}
              className={cn(
                "reveal relative flex flex-col rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1",
                t.highlight
                  ? "border-brand-600 bg-[#0B1512] text-paper shadow-[0_30px_60px_-24px_rgba(11,21,18,0.6)]"
                  : "border-mist bg-white text-ink hover:shadow-[0_20px_44px_-20px_rgba(11,21,18,0.2)]",
              )}
              style={{ ["--reveal-delay" as string]: `${i * 100}ms` }}
            >
              {t.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold-400 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#0B1512]">
                  Most popular
                </span>
              )}
              <h3 className={cn("font-display text-[15px] font-bold", t.highlight ? "text-paper" : "text-ink")}>
                {t.name}
              </h3>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-extrabold tracking-tight">{t.price}</span>
                <span className={cn("text-[13px] font-medium", t.highlight ? "text-paper/50" : "text-ink/45")}>
                  {t.period}
                </span>
              </div>
              <p className={cn("mt-2 text-[13.5px] leading-relaxed", t.highlight ? "text-paper/60" : "text-ink/55")}>
                {t.blurb}
              </p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13.5px] font-medium">
                    <IcCheck
                      className={cn("mt-0.5 h-4 w-4 shrink-0", t.highlight ? "text-brand-400" : "text-brand-600")}
                    />
                    <span className={t.highlight ? "text-paper/85" : "text-ink/70"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={cn(
                  "mt-8 inline-flex h-11 items-center justify-center rounded-lg text-[14px] font-bold transition-all",
                  t.highlight
                    ? "bg-brand-500 text-white hover:bg-brand-400"
                    : "bg-ink text-paper hover:bg-brand-800",
                )}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="reveal mt-8 text-center text-[12.5px] font-medium text-ink/40">
          All plans include secure accounts, data isolation and the ability to delete your data at any time.
        </p>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "What exactly can the AI tutor do?",
      a: "It explains difficult concepts step by step, gives examples, simplifies dense material, and generates practice questions. It also stays honest — if it isn't sure about something, it tells you instead of making things up.",
    },
    {
      q: "Is my study data private?",
      a: "Yes. Every conversation, note, quiz and summary belongs to your account only. Data is isolated per user in the database, passwords are hashed, and you can delete your account and everything in it at any time from Settings.",
    },
    {
      q: "How are quizzes generated?",
      a: "You pick a topic, paste optional study material, choose the number of questions, difficulty and type (multiple choice or true/false). StudyAI generates the quiz, auto-grades your attempt, and shows an explanation for every answer.",
    },
    {
      q: "Can I use it on my phone?",
      a: "Absolutely. StudyAI is fully responsive — the dashboard, tutor chat, quiz player and notes all work on phone, tablet and desktop.",
    },
    {
      q: "What happens if the AI service is unavailable?",
      a: "Summaries and material-based quizzes still work through a built-in offline engine, and the tutor will tell you transparently when it's in offline mode. AI-generated features resume automatically once the service is back.",
    },
    {
      q: "Do I need a credit card to start?",
      a: "No. The Starter plan is free to begin with — create an account and start studying immediately.",
    },
  ];
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-20 sm:py-28">
      <div className="reveal text-center">
        <Kicker>FAQ</Kicker>
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Questions, answered
        </h2>
      </div>
      <div className="mt-10 space-y-3">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div
              key={f.q}
              className={cn(
                "reveal overflow-hidden rounded-xl border bg-white transition-colors",
                isOpen ? "border-brand-300" : "border-mist",
              )}
            >
              <button
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
              >
                <span className="font-display text-[14.5px] font-bold text-ink">{f.q}</span>
                <IcChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-ink/40 transition-transform duration-300",
                    isOpen && "rotate-180 text-brand-600",
                  )}
                />
              </button>
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-[14px] leading-relaxed text-ink/60">{f.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AboutBand() {
  return (
    <section id="about" className="border-y border-mist bg-white py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 md:grid-cols-[1.2fr_0.8fr]">
        <div className="reveal">
          <Kicker>About StudyAI</Kicker>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink">
            Built by students, for students.
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink/60">
            StudyAI exists because studying alone is hard, and generic search
            results rarely teach the way you need. We combine a patient AI
            tutor, honest grading and real progress tracking so every study
            session moves you closer to the exam — not away from sleep.
          </p>
        </div>
        <div className="reveal grid grid-cols-2 gap-4" style={{ ["--reveal-delay" as string]: "120ms" }}>
          {[
            { icon: IcShield, label: "Private by design", sub: "Per-user data isolation" },
            { icon: IcZap, label: "Instant feedback", sub: "Auto-graded quizzes" },
            { icon: IcFlame, label: "Momentum", sub: "Streaks & weekly goals" },
            { icon: IcBulb, label: "Honest AI", sub: "Says 'I don't know' when unsure" },
          ].map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.label} className="rounded-xl border border-mist bg-cream p-4">
                <Icon className="h-5 w-5 text-brand-600" />
                <p className="mt-2.5 text-[13px] font-bold text-ink">{b.label}</p>
                <p className="mt-0.5 text-[11.5px] font-medium text-ink/45">{b.sub}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[#0B1512] py-20 sm:py-24">
      <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-brand-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-1/5 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
      <div className="relative mx-auto max-w-3xl px-5 text-center">
        <h2 className="reveal font-display text-3xl font-extrabold tracking-tight text-paper sm:text-[42px] sm:leading-[1.1]">
          Your next exam deserves better than highlighters.
        </h2>
        <p className="reveal mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-paper/55">
          Create a free account in under a minute. Your AI tutor, quiz bank and
          progress tracker will be waiting.
        </p>
        <div className="reveal mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="group inline-flex h-12 items-center gap-2 rounded-lg bg-brand-500 px-7 text-[15px] font-bold text-white shadow-lg shadow-brand-950/50 transition-all hover:-translate-y-0.5 hover:bg-brand-400"
          >
            Get Started Free
            <IcArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center rounded-lg border border-paper/20 px-7 text-[15px] font-bold text-paper/85 transition hover:border-paper/40 hover:text-paper"
          >
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-mist bg-cream">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B1512] text-brand-400">
                <IcSparkles style={{ width: 17, height: 17 }} />
              </span>
              <span className="font-display text-[16px] font-extrabold text-ink">
                Study<span className="text-brand-600">AI</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-ink/50">
              The AI-powered learning platform for students who want to
              understand, not just memorize.
            </p>
          </div>
          {[
            {
              title: "Product",
              links: [
                { label: "Features", href: "#features" },
                { label: "How it works", href: "#how" },
                { label: "Pricing", href: "#pricing" },
              ],
            },
            {
              title: "Get started",
              links: [
                { label: "Create account", href: "/register" },
                { label: "Sign in", href: "/login" },
                { label: "Forgot password", href: "/forgot-password" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About", href: "#about" },
                { label: "FAQ", href: "#faq" },
                { label: "Testimonials", href: "#testimonials" },
              ],
            },
          ].map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-[11.5px] font-extrabold uppercase tracking-[0.14em] text-ink/35">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-[13.5px] font-semibold text-ink/60 transition hover:text-brand-700">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-mist pt-6 sm:flex-row sm:items-center">
          <p className="text-[12px] font-medium text-ink/40">
            © {new Date().getFullYear()} StudyAI. Built with Next.js, PostgreSQL and a lot of coffee.
          </p>
          <p className="text-[12px] font-medium text-ink/40">
            Made for students, everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- Page ---------------- */

export default function LandingPage() {
  useRevealObserver();
  return (
    <div className="min-h-screen bg-paper">
      <Nav />
      <main>
        <Hero />
        <SubjectMarquee />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <AboutBand />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
