import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your StudyAI password.",
};

export default async function ForgotPasswordPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return <ForgotForm />;
}
