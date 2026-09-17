import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, getPreferences } from "@/lib/auth";
import { getDashboardData } from "@/lib/stats";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { BarChart, Donut, HBarList } from "@/components/charts";
import {
  IcArrowRight,
  IcAward,
  IcBulb,
  IcCap,
  IcFileText,
  IcFlame,
  IcFolder,
  IcMessage,
  IcPen,
  IcSparkles,
  IcTarget,
  IcZap,
} from "@/components/icons";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function activityMeta(activity: string) {
  switch (activity) {
    case "tutor":
      return { label: "AI Tutor", icon: IcMessage, cls: "bg-brand-50 text-brand-600" };
    case "summarizer":
      return { label: "Summarizer", icon: IcFileText, cls: "bg-sky-50 text-sky-600" };
    case "quiz":
      return { label: "Quiz", icon: IcTarget, cls: "bg-violet-50 text-violet-600" };
    case "notes":
      return { label: "Note", icon: IcPen, cls: "bg-amber-50 text-amber-600" };
    case "materials":
      return { label: "Material", icon: IcFolder, cls: "bg-rose-50 text-rose-600" };
    default:
      return { label: activity, icon: IcBulb, cls: "bg-brand-50 text-brand-600" };
  }
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [data, prefs] = await Promise.all([
    getDashboardData(user.id),
    getPreferences(user.id),
  ]);

  const firstName = user.name.split(" ")[0];
  const today = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const goal = prefs.weeklyGoalMinutes;
  const goalPct = Math.min(100, Math.round((data.minutesThisWeek / goal) * 100));

  const stats = [
    { label: "Study sessions", value: data.totalSessions, icon: IcZap, cls: "bg-brand-50 text-brand-600", sub: "all-time" },
    { label: "Topics studied", value: data.topicsStudied, icon: IcCap, cls: "bg-violet-50 text-violet-600", sub: "distinct" },
    { label: "Quizzes completed", value: data.quizzesCompleted, icon: IcTarget, cls: "bg-amber-50 text-amber-600", sub: "auto-graded" },
    { label: "Average quiz score", value: data.averageScore !== null ? `${data.averageScore}%` : "—", icon: IcAward, cls: "bg-sky-50 text-sky-600", sub: "across attempts" },
    { label: "Study streak", value: `${data.streak}d`, icon: IcFlame, cls: "bg-rose-50 text-rose-500", sub: data.streak > 0 ? "keep it alive!" : "start today" },
  ];

  const quick = [
    { href: "/dashboard/tutor", label: "Ask the AI tutor", icon: IcMessage, desc: "Explain anything, step by step" },
    { href: "/dashboard/summarizer", label: "Summarize material", icon: IcFileText, desc: "Paste text, get key points" },
    { href: "/dashboard/quiz", label: "Generate a quiz", icon: IcTarget, desc: "Practice with instant grading" },
    { href: "/dashboard/notes", label: "Write a note", icon: IcPen, desc: "Capture what you learn" },
  ];

  return (
    <div className="space-y-7">
      {/* Welcome */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wider text-ink/40">{today}</p>
          <h1 className="mt-1 font-display text-[26px] font-extrabold tracking-tight text-ink sm:text-[30px]">
            Welcome back, {firstName}
          </h1>
        </div>
        {data.streak > 0 && (
          <Badge tone="gold" className="px-3 py-1.5 text-[12.5px]">
            <IcFlame className="h-3.5 w-3.5" /> {data.streak}-day streak
          </Badge>
        )}
      </div>

      {/* Onboarding for brand-new accounts */}
      {data.totalSessions === 0 && (
        <Card className="overflow-hidden border-brand-200 bg-gradient-to-br from-white via-white to-brand-50 p-6">
          <div className="flex flex-wrap items-center gap-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <IcSparkles className="h-6 w-6" />
            </span>
            <div className="min-w-[220px] flex-1">
              <h2 className="font-display text-[16px] font-bold text-ink">
                Let&apos;s set up your first study session
              </h2>
              <p className="mt-1 text-[13.5px] text-ink/55">
                Everything on this dashboard is powered by your real activity. Start with any of these:
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/tutor" className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-ink px-4 text-[13px] font-bold text-paper transition hover:bg-brand-800">
                <IcMessage className="h-4 w-4" /> Ask the tutor
              </Link>
              <Link href="/dashboard/quiz" className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-mist bg-white px-4 text-[13px] font-bold text-ink transition hover:border-brand-300">
                <IcTarget className="h-4 w-4" /> Make a quiz
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${s.cls}`}>
                <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
              </span>
              <p className="mt-3 font-display text-[26px] font-extrabold tracking-tight text-ink">{s.value}</p>
              <p className="text-[12.5px] font-bold text-ink/60">{s.label}</p>
              <p className="text-[11px] font-medium text-ink/35">{s.sub}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Weekly activity */}
        <Card className="p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-[15px] font-bold text-ink">Study activity</h2>
              <p className="text-[12.5px] text-ink/45">Sessions over the last 7 days</p>
            </div>
            <Link href="/dashboard/progress" className="flex items-center gap-1 text-[12.5px] font-bold text-brand-700 hover:underline">
              Full progress <IcArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <BarChart data={data.weekly} />
        </Card>

        {/* Weekly goal */}
        <Card className="flex flex-col items-center justify-center p-6">
          <h2 className="self-start font-display text-[15px] font-bold text-ink">Weekly goal</h2>
          <p className="self-start text-[12.5px] text-ink/45">
            {data.minutesThisWeek}m of {goal}m this week
          </p>
          <div className="my-5">
            <Donut value={goalPct} sub="of weekly goal" />
          </div>
          <ProgressBar value={goalPct} className="w-full" />
          <p className="mt-3 text-center text-[12px] font-medium text-ink/45">
            {goalPct >= 100
              ? "Goal reached — outstanding work. 🎉"
              : `${goal - data.minutesThisWeek}m left to hit your goal.`}
          </p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Recent activity */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-display text-[15px] font-bold text-ink">Recent activity</h2>
          {data.recentActivity.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-mist bg-cream px-4 py-8 text-center text-[13.5px] text-ink/45">
              Your recent study sessions will appear here.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-mist">
              {data.recentActivity.map((a) => {
                const meta = activityMeta(a.activity);
                const Icon = meta.icon;
                return (
                  <li key={a.id} className="flex items-center gap-3.5 py-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.cls}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-ink/80">
                        {meta.label}
                        {a.topic ? <span className="text-ink/50"> · {a.topic}</span> : null}
                      </p>
                      {a.detail && <p className="truncate text-[12px] text-ink/45">{a.detail}</p>}
                    </div>
                    <span className="shrink-0 text-[11.5px] font-medium text-ink/35">{timeAgo(a.createdAt)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Recommended + subjects */}
        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="font-display text-[15px] font-bold text-ink">Recommended topics</h2>
            <p className="mt-1 text-[12.5px] text-ink/45">Subjects in your library with the least review so far.</p>
            {data.recommended.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-mist bg-cream px-4 py-6 text-center text-[13px] text-ink/45">
                Add notes or quizzes with subjects and StudyAI will recommend what to review next.
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {data.recommended.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3.5 py-1.5 text-[12.5px] font-bold text-brand-800">
                    <IcBulb className="h-3.5 w-3.5" /> {t}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {data.subjectCoverage.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 font-display text-[15px] font-bold text-ink">Your subjects</h2>
              <HBarList
                items={data.subjectCoverage.map((s) => ({
                  label: s.subject,
                  value: s.items,
                  hint: `${s.items} item${s.items === 1 ? "" : "s"}`,
                }))}
              />
            </Card>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quick.map((q) => {
          const Icon = q.icon;
          return (
            <Link
              key={q.href}
              href={q.href}
              className="group rounded-xl border border-mist bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-[0_16px_36px_-18px_rgba(11,21,18,0.25)]"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-3 flex items-center gap-1.5 text-[14px] font-bold text-ink">
                {q.label}
                <IcArrowRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </p>
              <p className="mt-0.5 text-[12.5px] text-ink/45">{q.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
