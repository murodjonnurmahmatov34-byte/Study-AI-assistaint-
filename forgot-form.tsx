"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, Field, Input } from "@/components/ui";
import { IcAlert, IcCheckCircle, IcMail, IcSparkles } from "@/components/icons";
import { isEmail } from "@/lib/utils";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [serverNote, setServerNote] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!isEmail(email)) {
      setFieldError("Enter a valid email address.");
      return;
    }
    setFieldError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSent(email);
      if (typeof data.message === "string") setServerNote(data.message);
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

      {sent ? (
        <div className="rounded-2xl border border-mist bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <IcCheckCircle className="h-7 w-7" />
          </span>
          <h1 className="mt-5 font-display text-[22px] font-extrabold tracking-tight text-ink">
            Check your inbox
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink/55">
            If an account exists for <strong className="text-ink">{sent}</strong>,
            a password reset link is on its way.
          </p>
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-[12.5px] leading-relaxed text-amber-800">
            <p className="font-bold">Good to know</p>
            <p className="mt-1">{serverNote || "Reset emails are delivered by an outbound email provider."}</p>
          </div>
          <Link
            href="/login"
            className="mt-6 inline-flex h-11 items-center rounded-lg bg-ink px-6 text-[14px] font-bold text-paper transition hover:bg-brand-800"
          >
            Back to Sign In
          </Link>
        </div>
      ) : (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <IcMail className="h-6 w-6" />
          </div>
          <h1 className="mt-5 font-display text-[26px] font-extrabold tracking-tight text-ink">
            Reset your password
          </h1>
          <p className="mt-2 text-[14px] text-ink/50">
            Enter the email on your account and we&apos;ll send you a reset link.
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
            <Field label="Email" error={fieldError}>
              <Input
                type="email"
                autoComplete="email"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </Field>
            <Button type="submit" size="lg" loading={loading} className="w-full">
              Send Reset Link
            </Button>
          </form>

          <p className="mt-7 text-center text-[13.5px] text-ink/50">
            Remembered it?{" "}
            <Link href="/login" className="font-bold text-brand-700 hover:underline">
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
