import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getProgressData } from "@/lib/stats";
import { Card } from "@/components/ui";
import { BarChart, Donut, HBarList, LineChart } from "@/components/charts";
import {
  IcAward,
  IcCap,
  IcFlame,
  IcTarget,
  IcZap,
} from "@/components/icons";

export const metadata: Metadata = { title: "Progress" };

export default async function ProgressPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const data = await getProgressData(user.id);
  const firstName = user.name.split(" ")[0];

  const stats = [
    { label: "Total study sessions", value: String(data.totalSessions), icon: IcZap, cls: "bg-brand-50 text-brand-600" },
    { label: "Total quizzes taken", value: String(data.quizzesCompleted), icon: IcTarget, cls: "bg-amber-50 text-amber-600" },
    { label: "Average score", value: data.averageScore !== null ? `${data.averageScore}%` : "—", icon: IcAward, cls: "bg-sky-50 text-sky-600" },
    { label: "Current streak", value: `${data.streak}d`, icon: IcFlame, cls: "bg-rose-50 text-rose-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] font-extrabold tracking-tight text-ink">Progress</h1>
          <p className="mt-1 text-[14px] text-ink/50">
            Real numbers from your study history, {firstName} — nothing here is estimated.
          </p>
        </div>
        <Link
          href="/dashboard/tutor"
          className="inline-flex h-10 items-center rounded-lg bg-ink px-4 text-[13px] font-bold text-paper transition hover:bg-brand-800"
        >
          + New study session
        </Link>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5">
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${s.cls}`}>
                <Icon style={{ width: 18, height: 18 }} />
              </span>
              <p className="mt-3 font-display text-[26px] font-extrabold tracking-tight text-ink">{s.value}</p>
              <p className="text-[12.5px] font-bold text-ink/60">{s.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Weekly + monthly */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-[15px] font-bold text-ink">Weekly study activity</h2>
          <p className="mb-5 text-[12.5px] text-ink/45">Sessions this week, day by day</p>
          <BarChart data={data.weekly} height={170} />
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-[15px] font-bold text-ink">Monthly activity</h2>
          <p className="mb-5 text-[12.5px] text-ink/45">Sessions over the last 6 months</p>
          <BarChart data={data.months} height={170} accent="bg-brand-700" />
        </Card>
      </div>

      {/* Quiz performance + activity mix */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-display text-[15px] font-bold text-ink">Quiz performance</h2>
          <p className="mb-5 text-[12.5px] text-ink/45">Score of your last {data.quizPerformance.length || 10} attempts</p>
          <LineChart
            data={data.quizPerformance}
            height={190}
            emptyLabel="Complete a quiz to see your trend line"
          />
        </Card>
        <div className="space-y-5">
          <Card className="flex flex-col items-center p-6">
            <h2 className="self-start font-display text-[15px] font-bold text-ink">Overall average</h2>
            <div className="my-4">
              <Donut
                value={data.averageScore ?? 0}
                sub={data.averageScore !== null ? "avg score" : "no quizzes yet"}
              />
            </div>
            <p className="text-center text-[12px] font-medium text-ink/45">
              Across {data.quizzesCompleted} quiz attempt{data.quizzesCompleted === 1 ? "" : "s"}
            </p>
          </Card>
        </div>
      </div>

      {/* Topics + activity breakdown */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-[15px] font-bold text-ink">Topics studied</h2>
          <p className="mb-4 text-[12.5px] text-ink/45">
            {data.topicsStudied} distinct topic{data.topicsStudied === 1 ? "" : "s"} across your quizzes and sessions
          </p>
          {data.subjectCoverage.length === 0 ? (
            <p className="rounded-lg border border-dashed border-mist bg-cream px-4 py-8 text-center text-[13px] text-ink/45">
              Add notes, materials or quizzes with subjects to see your topic spread here.
            </p>
          ) : (
            <HBarList
              items={data.subjectCoverage.map((s) => ({
                label: s.subject,
                value: s.items,
                hint: `${s.items} item${s.items === 1 ? "" : "s"}`,
              }))}
            />
          )}
        </Card>
        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
            <IcCap className="h-4 w-4 text-brand-600" /> Where your time goes
          </h2>
          <p className="mb-4 text-[12.5px] text-ink/45">Session count by activity type</p>
          <HBarList
            items={data.activityByType.map((a) => ({ label: a.label, value: a.value, hint: `${a.value} session${a.value === 1 ? "" : "s"}` }))}
            emptyLabel="Your activity mix will appear here once you start studying."
          />
        </Card>
      </div>
    </div>
  );
}
