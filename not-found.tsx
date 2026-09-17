import Link from "next/link";
import { IcArrowLeft } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="font-display text-[80px] font-extrabold leading-none text-brand-200">404</p>
      <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">This page wandered off to study.</h1>
      <p className="mt-2 max-w-md text-[14.5px] text-ink/50">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-mist bg-white px-5 text-[14px] font-bold text-ink transition hover:border-brand-300"
        >
          <IcArrowLeft className="h-4 w-4" /> Home
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center rounded-lg bg-ink px-5 text-[14px] font-bold text-paper transition hover:bg-brand-800"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
