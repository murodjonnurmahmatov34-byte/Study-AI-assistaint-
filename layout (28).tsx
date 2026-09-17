import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { studySessions } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { isAIConfigured } from "@/lib/ai";
import { DashShell } from "@/components/dash-shell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const activityRows = await db
    .select()
    .from(studySessions)
    .where(eq(studySessions.userId, user.id))
    .orderBy(desc(studySessions.createdAt))
    .limit(6);

  return (
    <DashShell
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        avatarHue: user.avatarHue,
      }}
      activity={activityRows.map((r) => ({
        id: r.id,
        activity: r.activity,
        topic: r.topic,
        detail: r.detail,
        createdAt: r.createdAt.toISOString(),
      }))}
      aiEnabled={isAIConfigured()}
    >
      {children}
    </DashShell>
  );
}
