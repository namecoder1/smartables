import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

if (
  !process.env.UPSTASH_REDIS_REST_URL ||
  !process.env.UPSTASH_REDIS_REST_TOKEN
) {
  throw new Error("Missing Upstash Redis environment variables");
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Create a new ratelimiter, that allows 2 requests per 1 hour
export const bookingRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(2, "1 h"),
  analytics: true,
  prefix: "@upstash/ratelimit/booking",
});

export async function checkRateLimit(ip: string) {
  const { success, limit, reset, remaining } = await bookingRateLimit.limit(ip);
  return { success, limit, reset, remaining };
}
