"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  Select,
} from "@/components/ui";
import {
  IcCheck,
  IcLock,
  IcLogout,
  IcShield,
  IcSliders,
  IcTrash,
  IcUser,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/toast";

interface Props {
  user: { id: string; name: string; email: string; avatarHue: number };
  prefs: {
    theme: string;
    emailNotifications: boolean;
    productUpdates: boolean;
    weeklyGoalMinutes: number;
    defaultDifficulty: string;
  };
}

function SectionTitle({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-mist px-5 py-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>
      <div>
        <h2 className="font-display text-[15px] font-bold text-ink">{title}</h2>
        <p className="text-[12px] text-ink/45">{sub}</p>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-[13.5px] font-bold text-ink/80">{label}</p>
        <p className="text-[12px] text-ink/45">{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand-600" : "bg-ink/15",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}

export function SettingsForm({ user, prefs }: Props) {
  const { push } = useToast();
  const router = useRouter();

  // Profile
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [hue, setHue] = useState(user.avatarHue);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Preferences
  const [theme, setTheme] = useState(prefs.theme);
  const [emailNotif, setEmailNotif] = useState(prefs.emailNotifications);
  const [productUpdates, setProductUpdates] = useState(prefs.productUpdates);
  const [goal, setGoal] = useState(prefs.weeklyGoalMinutes);
  const [diff, setDiff] = useState(prefs.defaultDifficulty);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Security
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  // Account
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    setProfileErr("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, avatarHue: hue }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileErr(data.error ?? "Could not update your profile.");
        return;
      }
      setProfileMsg("Profile saved.");
      push("success", "Profile updated.");
    } catch {
      setProfileErr("Network error. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePrefs = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          emailNotifications: emailNotif,
          productUpdates,
          weeklyGoalMinutes: goal,
          defaultDifficulty: diff,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        push("error", data.error ?? "Could not save preferences.");
        return;
      }
      push("success", "Preferences saved.");
    } catch {
      push("error", "Network error. Please try again.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwErr("");
    setPwMsg("");
    if (next.length < 8 || !/[a-zA-Z]/.test(next) || !/\d/.test(next)) {
      setPwErr("New password needs 8+ characters with a letter and a number.");
      return;
    }
    if (next !== confirm) {
      setPwErr("New passwords do not match.");
      return;
    }
    setSavingPw(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next, confirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwErr(data.error ?? "Could not change your password.");
        return;
      }
      setPwMsg("Password updated successfully.");
      setCurrent("");
      setNext("");
      setConfirm("");
      push("success", "Password changed.");
    } catch {
      setPwErr("Network error. Please try again.");
    } finally {
      setSavingPw(false);
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleting(false);
        push("error", data.error ?? "Could not delete your account.");
        return;
      }
      push("success", "Your account and data have been deleted.");
      router.replace("/");
    } catch {
      setDeleting(false);
      push("error", "Network error. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-[24px] font-extrabold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-[14px] text-ink/50">Manage your profile, preferences and account security.</p>
      </div>

      {/* Profile */}
      <Card>
        <SectionTitle icon={<IcUser className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />} title="Profile" sub="How you appear across StudyAI" />
        <form onSubmit={saveProfile} className="space-y-4 p-5">
          <div className="flex items-center gap-4">
            <Avatar name={name || user.name} hue={hue} size="lg" />
            <div className="flex-1">
              <p className="text-[13px] font-bold text-ink/80">Avatar color</p>
              <input
                type="range"
                min={0}
                max={359}
                value={hue}
                onChange={(e) => setHue(Number(e.target.value))}
                className="mt-2 w-full accent-[#106e58]"
                aria-label="Avatar color hue"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            </Field>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          </div>
          {profileErr && (
            <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">{profileErr}</p>
          )}
          {profileMsg && (
            <p className="rounded-lg bg-emerald-50 px-3.5 py-2.5 text-[13px] font-medium text-emerald-700">{profileMsg}</p>
          )}
          <div className="flex justify-end">
            <Button type="submit" loading={savingProfile}>Save profile</Button>
          </div>
        </form>
      </Card>

      {/* Preferences */}
      <Card>
        <SectionTitle
          icon={<IcSliders className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />}
          title="Preferences"
          sub="Learning style, notifications and goals"
        />
        <form onSubmit={savePrefs} className="p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Theme">
              <Select value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </Select>
            </Field>
            <Field label="Weekly study goal">
              <Input
                type="number"
                min={15}
                max={1200}
                step={15}
                value={goal}
                onChange={(e) => setGoal(Number(e.target.value))}
              />
            </Field>
            <Field label="Default difficulty">
              <Select value={diff} onChange={(e) => setDiff(e.target.value)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </Field>
          </div>
          <div className="mt-2 divide-y divide-mist">
            <Toggle
              checked={emailNotif}
              onChange={setEmailNotif}
              label="Study reminders"
              desc="A nudge when your streak is at risk (requires email service configuration)."
            />
            <Toggle
              checked={productUpdates}
              onChange={setProductUpdates}
              label="Product updates"
              desc="Occasional news about new StudyAI features."
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit" loading={savingPrefs}>Save preferences</Button>
          </div>
        </form>
      </Card>

      {/* Security */}
      <Card>
        <SectionTitle icon={<IcLock className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />} title="Security" sub="Change your password" />
        <form onSubmit={savePassword} className="space-y-4 p-5">
          <Field label="Current password">
            <Input
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="New password">
              <Input
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
            </Field>
            <Field label="Confirm new password">
              <Input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
          </div>
          {pwErr && (
            <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">{pwErr}</p>
          )}
          {pwMsg && (
            <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3.5 py-2.5 text-[13px] font-medium text-emerald-700">
              <IcCheck className="h-4 w-4" /> {pwMsg}
            </p>
          )}
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.replace("/login");
              }}
            >
              <IcLogout className="h-4 w-4" /> Log out
            </Button>
            <Button type="submit" loading={savingPw}>Change password</Button>
          </div>
        </form>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200">
        <SectionTitle icon={<IcShield className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />} title="Account" sub="This action cannot be undone" />
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-[13.5px] font-bold text-ink/80">Delete account</p>
            <p className="text-[12.5px] text-ink/45">
              Permanently removes your profile, conversations, notes, quizzes and history.
            </p>
          </div>
          <Button variant="danger" onClick={() => { setDeleteConfirm(""); setDeleteOpen(true); }}>
            <IcTrash className="h-4 w-4" /> Delete account
          </Button>
        </div>
      </Card>

      <p className="text-center">
        <Badge tone="neutral">Signed in as {user.email}</Badge>
      </p>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete your account?"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              loading={deleting}
              disabled={deleteConfirm !== user.email}
              onClick={() => void doDelete()}
            >
              Permanently delete
            </Button>
          </>
        }
      >
        <p className="text-[14px] leading-relaxed text-ink/60">
          This will permanently delete your StudyAI account and <strong className="text-ink">all of your data</strong> —
          conversations, notes, materials, quizzes and progress. There is no way to undo this.
        </p>
        <label className="mt-4 block text-[13px] font-semibold text-ink/80" htmlFor="del-confirm">
          Type your email ({user.email}) to confirm
        </label>
        <Input
          id="del-confirm"
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder={user.email}
          className="mt-1.5"
          autoFocus
        />
      </Modal>
    </div>
  );
}
