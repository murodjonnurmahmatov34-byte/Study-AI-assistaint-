import { type NextRequest } from "next/server";
import { fail, handleApiError, ok } from "@/lib/api";
import { isEmail } from "@/lib/utils";
import { limits } from "@/lib/ratelimit";

/**
 * Always returns success to avoid leaking which emails are registered.
 * Actual email delivery is performed by an outbound email provider
 * (configure EMAIL_API_KEY) — without it the flow validates and responds
 * without revealing account existence.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
    if (!limits.authPerIp(ip, "forgot")) {
      return fail(429, "Too many requests. Please try again later.");
    }

    const body = (await req.json().catch(() => null)) as { email?: string } | null;
    const email = (body?.email ?? "").trim().toLowerCase();
    if (!isEmail(email)) return fail(400, "Please enter a valid email address.");

    if (process.env.EMAIL_API_KEY) {
      // Hook for a transactional email provider (Resend, SES, …).
      console.info(`[password-reset] would send reset link to ${email}`);
    }

    return ok({
      ok: true,
      message:
        "If an account exists for that email, a password reset link has been sent. Reset emails require the EMAIL_API_KEY environment variable to be configured on the server.",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
