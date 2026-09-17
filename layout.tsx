import type { ReactNode } from "react";
import Link from "next/link";
import { IcCheck, IcSparkles, IcTrend } from "@/components/icons";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-paper">
      {/* Brand panel */}
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-[#0B1512] p-10 lg:flex">
        <div className="pointer-events-none absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-10 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
            <IcSparkles style={{ width: 18, height: 18 }} />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-paper">
            Study<span className="text-brand-400">AI</span>
          </span>
        </Link>

        <div className="relative">
          <blockquote className="max-w-md">
            <p className="font-display text-[22px] font-bold leading-snug text-paper">
              “The quiz generator is scary good at finding my weak spots. I
              stopped cramming and started understanding.”
            </p>
            <footer className="mt-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 font-display text-[13px] font-bold text-white">
                MR
              </span>
              <div>
                <p className="text-[13.5px] font-bold text-paper/90">Maya R.</p>
                <p className="text-[12px] font-medium text-paper/45">Pre-med student</p>
              </div>
            </footer>
          </blockquote>

          <ul className="mt-10 space-y-3">
            {[
              "AI tutor that explains, never pretends",
              "Auto-graded quizzes with explanations",
              "Progress you can actually see",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-[13.5px] font-semibold text-paper/60">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/20 text-brand-400">
                  <IcCheck className="h-3 w-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-[12px] font-medium text-paper/35">
          <IcTrend className="h-4 w-4 text-brand-400" />
          Study smarter, not longer.
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  );
}
