import { and, count, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  conversations,
  notes,
  quizAttempts,
  quizzes,
  studyMaterials,
  studySessions,
  summaries,
} from "@/db/schema";

export interface DayPoint {
  label: string;
  value: number;
}

export interface ActivityItem {
  id: string;
  activity: string;
  topic: string;
  detail: string;
  createdAt: string;
}

export interface DashboardData {
  totalSessions: number;
  topicsStudied: number;
  quizzesCompleted: number;
  averageScore: number | null;
  streak: number;
  weekly: DayPoint[];
  minutesThisWeek: number;
  recentActivity: ActivityItem[];
  recommended: string[];
  subjectCoverage: { subject: string; items: number }[];
  quick: {
    notes: number;
    materials: number;
    summaries: number;
    conversations: number;
  };
}

const DAY_MS = 86_400_000;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function computeStreak(dayKeys: Set<string>): number {
  let streak = 0;
  const cursor = new Date();
  // A streak can still be alive if yesterday was the last active day.
  if (!dayKeys.has(dayKey(cursor))) cursor.setTime(cursor.getTime() - DAY_MS);
  while (dayKeys.has(dayKey(cursor))) {
    streak += 1;
    cursor.setTime(cursor.getTime() - DAY_MS);
  }
  return streak;
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const since = new Date(Date.now() - 62 * DAY_MS);

  const [[sessAgg], [attemptAgg], [notesCount], [matsCount], [summCount], [convCount]] =
    await Promise.all([
      db
        .select({ c: count() })
        .from(studySessions)
        .where(eq(studySessions.userId, userId)),
      db
        .select({ c: count(), avg: sql<number>`avg(${quizAttempts.percentage})` })
        .from(quizAttempts)
        .where(eq(quizAttempts.userId, userId)),
      db.select({ c: count() }).from(notes).where(eq(notes.userId, userId)),
      db
        .select({ c: count() })
        .from(studyMaterials)
        .where(eq(studyMaterials.userId, userId)),
      db.select({ c: count() }).from(summaries).where(eq(summaries.userId, userId)),
      db
        .select({ c: count() })
        .from(conversations)
        .where(eq(conversations.userId, userId)),
    ]);

  const [sessionRows, sessionTopics, quizTopics] = await Promise.all([
    db
      .select({ at: studySessions.createdAt, duration: studySessions.durationMin })
      .from(studySessions)
      .where(and(eq(studySessions.userId, userId), gte(studySessions.createdAt, new Date(0)))),
    db
      .select({ t: studySessions.topic })
      .from(studySessions)
      .where(
        and(
          eq(studySessions.userId, userId),
          isNotNull(studySessions.topic),
          sql`${studySessions.topic} <> ''`,
        ),
      ),
    db.select({ t: quizzes.topic }).from(quizzes).where(eq(quizzes.userId, userId)),
  ]);

  const daySet = new Set(sessionRows.map((r) => dayKey(r.at)));
  const streak = computeStreak(daySet);

  const topicSet = new Set<string>();
  for (const t of sessionTopics) if (t.t.trim()) topicSet.add(t.t.trim());
  for (const t of quizTopics) if (t.t.trim()) topicSet.add(t.t.trim());

  // Weekly (last 7 days)
  const weekly: DayPoint[] = [];
  let minutesThisWeek = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY_MS);
    const key = dayKey(d);
    const inDay = sessionRows.filter((r) => dayKey(r.at) === key);
    minutesThisWeek += inDay.reduce((a, r) => a + (r.duration ?? 0), 0);
    weekly.push({
      label: d.toLocaleDateString("en", { weekday: "short" }),
      value: inDay.length,
    });
  }

  const recentRows = await db
    .select()
    .from(studySessions)
    .where(eq(studySessions.userId, userId))
    .orderBy(desc(studySessions.createdAt))
    .limit(8);

  // Subject coverage from notes + materials
  const noteSubjects = await db
    .select({ s: notes.subject, c: sql<number>`count(*)` })
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        isNotNull(notes.subject),
        sql`${notes.subject} <> ''`,
      ),
    )
    .groupBy(notes.subject);
  const matSubjects = await db
    .select({ s: studyMaterials.subject, c: sql<number>`count(*)` })
    .from(studyMaterials)
    .where(
      and(
        eq(studyMaterials.userId, userId),
        isNotNull(studyMaterials.subject),
        sql`${studyMaterials.subject} <> ''`,
      ),
    )
    .groupBy(studyMaterials.subject);

  const subjectMap = new Map<string, number>();
  for (const row of [...noteSubjects, ...matSubjects]) {
    const key = row.s.trim() || "General";
    subjectMap.set(key, (subjectMap.get(key) ?? 0) + Number(row.c));
  }
  const subjectCoverage = [...subjectMap.entries()]
    .map(([subject, items]) => ({ subject, items }))
    .sort((a, b) => b.items - a.items)
    .slice(0, 6);

  // Recommend subjects with the least recorded study activity.
  const studied = new Set(
    [...topicSet].map((t) => t.toLowerCase()),
  );
  const recommended = [...subjectMap.keys()]
    .filter((s) => !studied.has(s.toLowerCase()))
    .slice(0, 4);

  void since;

  return {
    totalSessions: sessAgg.c,
    topicsStudied: topicSet.size,
    quizzesCompleted: attemptAgg.c,
    // PG avg() over integers returns numeric, which the driver may give as a string.
    averageScore:
      attemptAgg.c > 0 ? Math.round(Number(attemptAgg.avg)) : null,
    streak,
    weekly,
    minutesThisWeek,
    recentActivity: recentRows.map((r) => ({
      id: r.id,
      activity: r.activity,
      topic: r.topic,
      detail: r.detail,
      createdAt: r.createdAt.toISOString(),
    })),
    recommended,
    subjectCoverage,
    quick: {
      notes: notesCount.c,
      materials: matsCount.c,
      summaries: summCount.c,
      conversations: convCount.c,
    },
  };
}

export interface ProgressData extends DashboardData {
  months: DayPoint[];
  quizPerformance: { label: string; value: number; title: string }[];
  activityByType: { label: string; value: number }[];
}

export async function getProgressData(userId: string): Promise<ProgressData> {
  const base = await getDashboardData(userId);

  const monthRows = await db
    .select({
      at: sql<Date>`date_trunc('month', ${studySessions.createdAt})`,
      c: count(),
    })
    .from(studySessions)
    .where(eq(studySessions.userId, userId))
    .groupBy(sql`date_trunc('month', ${studySessions.createdAt})`)
    .orderBy(sql`date_trunc('month', ${studySessions.createdAt})`)
    .limit(24);

  const byMonth = new Map<string, number>();
  for (const r of monthRows) {
    // date_trunc via raw SQL may come back as string or Date depending on driver.
    byMonth.set(new Date(r.at as unknown as string | Date).toISOString().slice(0, 7), r.c);
  }

  const months: DayPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    months.push({
      label: d.toLocaleDateString("en", { month: "short" }),
      value: byMonth.get(key) ?? 0,
    });
  }

  const attempts = await db
    .select({
      at: quizAttempts.createdAt,
      pct: quizAttempts.percentage,
      title: quizzes.title,
    })
    .from(quizAttempts)
    .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
    .where(eq(quizAttempts.userId, userId))
    .orderBy(desc(quizAttempts.createdAt))
    .limit(10);

  const quizPerformance = [...attempts]
    .reverse()
    .map((a) => ({
      label: a.at.toLocaleDateString("en", { month: "short", day: "numeric" }),
      value: a.pct,
      title: a.title,
    }));

  const typeRows = await db
    .select({ a: studySessions.activity, c: count() })
    .from(studySessions)
    .where(eq(studySessions.userId, userId))
    .groupBy(studySessions.activity);

  const labelMap: Record<string, string> = {
    tutor: "AI Tutor",
    summarizer: "Summarizer",
    quiz: "Quizzes",
    notes: "Notes",
    materials: "Materials",
  };
  const activityByType = typeRows
    .map((r) => ({ label: labelMap[r.a] ?? r.a, value: r.c }))
    .sort((a, b) => b.value - a.value);

  return {
    ...base,
    months,
    quizPerformance,
    activityByType,
  };
}
