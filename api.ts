import { NextResponse } from "next/server";
import { UnauthorizedError } from "./auth";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const fail = (status: number, message: string) =>
  NextResponse.json({ error: message }, { status });

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof UnauthorizedError) return fail(401, err.message);
  if (err instanceof ApiError) return fail(err.status, err.message);
  console.error("Unhandled API error:", err);
  return fail(500, "Something went wrong on our side. Please try again.");
}
