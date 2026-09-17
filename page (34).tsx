import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPreferences, getSessionUser } from "@/lib/auth";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const prefs = await getPreferences(user.id);

  return (
    <SettingsForm
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        avatarHue: user.avatarHue,
      }}
      prefs={{
        theme: prefs.theme,
        emailNotifications: prefs.emailNotifications,
        productUpdates: prefs.productUpdates,
        weeklyGoalMinutes: prefs.weeklyGoalMinutes,
        defaultDifficulty: prefs.defaultDifficulty,
      }}
    />
  );
}
