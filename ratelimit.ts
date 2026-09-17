/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for single-instance deployments; swap for Redis in larger setups.
 */
const buckets = new Map<string, number[]>();

const MAX_KEYS = 10_000;

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  if (buckets.size > MAX_KEYS) buckets.clear();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    buckets.set(key, arr);
    return false;
  }
  arr.push(now);
  buckets.set(key, arr);
  return true;
}

const MIN = 60_000;

export const limits = {
  aiPerUser: (userId: string, op: string) =>
    rateLimit(`ai:${userId}:${op}`, 15, 10 * MIN),
  authPerIp: (ip: string, op: string) =>
    rateLimit(`auth:${ip}:${op}`, 10, 10 * MIN),
  generalPerUser: (userId: string) =>
    rateLimit(`api:${userId}`, 120, MIN),
};
