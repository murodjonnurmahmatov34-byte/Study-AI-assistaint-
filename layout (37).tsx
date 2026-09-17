import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ToastProvider } from "@/components/toast";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL
  ? process.env.NEXT_PUBLIC_APP_URL
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "StudyAI — Learn Smarter with AI",
    template: "%s · StudyAI",
  },
  description:
    "StudyAI is an AI-powered learning platform that helps students understand complex topics, create study materials, practice with quizzes, and track their learning progress.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "StudyAI — Learn Smarter with AI",
    description:
      "AI tutor, smart summaries, quiz generator, study notes and progress tracking — all in one place.",
    type: "website",
    locale: "en_US",
    siteName: "StudyAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "StudyAI — Learn Smarter with AI",
    description:
      "AI tutor, smart summaries, quiz generator, study notes and progress tracking — all in one place.",
  },
  keywords: [
    "AI study assistant",
    "quiz generator",
    "summarizer",
    "study notes",
    "learning platform",
  ],
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b1512",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
