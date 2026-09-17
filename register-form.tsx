"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Field, Input } from "@/components/ui";
import { IcAlert, IcCheck, IcEye, IcEyeOff, IcSparkles } from "@/components/icons";
import { isEmail } from "@/lib/utils";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const pwChecks = [
    { ok: password.length >= 8, label: "8+ characters" },
    { ok: /[a-zA-Z]/.test(password) && /\d/.test(password), label: "letters & a number" },
    { ok: confirm.length > 0 && password === confirm, label: "matches confirmation" },
  ];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const fe: Record<string, string> = {};
    if (name.trim().length < 2) fe.name = "Enter your full name.";
    if (!isEmail(email)) fe.email = "Enter a valid email address.";
    if (password.length < 8) fe.password = "Password must be at least 8 characters.";
    else if (!/[a-zA-Z]/.test(password) || !/\d/.test(password))
      fe.password = "Include at least one letter and one number.";
    if (password !== confirm) fe.confirm = "Passwords do not match.";
    setFieldErrors(fe);
    if (Object.keys(fe).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email, password, confirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) {
          setFieldErrors({ email: data.error ?? "An account with this email already exists." });
        } else {
          setError(data.error ?? "Something went wrong. Please try again.");
        }
        return;
      }
      router.replace("/dashboard");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-2.5 lg:hidden">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
          <IcSparkles style={{ width: 18, height: 18 }} />
        </span>
        <span className="font-display text-lg font-extrabold text-ink">
          Study<span className="text-brand-600">AI</span>
        </span>
      </div>

      <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink">
        Create your account
      </h1>
      <p className="mt-2 text-[14px] text-ink/50">
        Free forever plan. No credit card, no catch.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] font-medium text-red-700"
        >
          <IcAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <Field label="Full name" error={fieldErrors.name}>
          <Input
            autoComplete="name"
            placeholder="Ada Lovelace"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </Field>
        <Field label="Email" error={fieldErrors.email}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@school.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </Field>
        <Field label="Password" error={fieldErrors.password}>
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-ink/35 transition hover:text-ink/70"
              aria-label={showPw ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPw ? <IcEyeOff className="h-4 w-4" /> : <IcEye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <div>
          <Field label="Confirm password" error={fieldErrors.confirm}>
            <Input
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
            />
          </Field>
          {password.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {pwChecks.map((c) => (
                <li
                  key={c.label}
                  className={
                    c.ok
                      ? "flex items-center gap-1 text-[11.5px] font-semibold text-emerald-600"
                      : "flex items-center gap-1 text-[11.5px] font-medium text-ink/35"
                  }
                >
                  <IcCheck className="h-3 w-3" /> {c.label}
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button type="submit" size="lg" loading={loading} className="w-full">
          Create Free Account
        </Button>
      </form>

      <p className="mt-4 text-center text-[12px] leading-relaxed text-ink/40">
        By creating an account you agree to use StudyAI responsibly.
      </p>
      <p className="mt-5 text-center text-[13.5px] text-ink/50">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
