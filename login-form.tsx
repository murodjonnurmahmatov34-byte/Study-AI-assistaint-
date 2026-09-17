"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Field, Input } from "@/components/ui";
import { IcAlert, IcEye, IcEyeOff, IcSparkles } from "@/components/icons";
import { isEmail } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const fe: { email?: string; password?: string } = {};
    if (!isEmail(email)) fe.email = "Enter a valid email address.";
    if (!password) fe.password = "Enter your password.";
    setFieldErrors(fe);
    if (Object.keys(fe).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
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
        Welcome back
      </h1>
      <p className="mt-2 text-[14px] text-ink/50">
        Sign in to continue your learning streak.
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
              autoComplete="current-password"
              placeholder="Your password"
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
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-[13px] font-semibold text-brand-700 hover:text-brand-800 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>

      <p className="mt-7 text-center text-[13.5px] text-ink/50">
        New to StudyAI?{" "}
        <Link href="/register" className="font-bold text-brand-700 hover:underline">
          Create a free account
        </Link>
      </p>
      <p className="mt-3 text-center">
        <Link href="/" className="text-[12.5px] font-medium text-ink/35 hover:text-ink/60">
          ← Back to studyai
        </Link>
      </p>
    </div>
  );
}
