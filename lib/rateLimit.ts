// Extremely simple in-memory rate limiter. Good enough for a demo / single
// instance. NOTE: on serverless multi-instance deployments this is not shared
// across instances; for production use a shared store (Redis / Upstash).

const hits = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit = 20,
  windowMs = 60 * 60 * 1000
): boolean {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  return true;
}
