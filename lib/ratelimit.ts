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

// Public booking form — 2 prenotazioni per ora per IP
// Basso per prevenire flooding di prenotazioni false dal form pubblico.
export const bookingRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, "1 h"),
  analytics: true,
  prefix: "@upstash/ratelimit/booking",
});

// QR order (tavolo) — 10 ordini per ora per IP
// Più generoso del booking: un tavolo può ordinare più volte in una serata.
export const orderRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  analytics: true,
  prefix: "@upstash/ratelimit/order",
});

// WhatsApp Flow endpoint — 60 richieste per minuto per IP
// L'endpoint è protetto da firma Meta (HMAC-SHA256), ma questo limite
// previene abuse/discovery da IP non Meta in caso la firma sia bypassata.
export const flowRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/flow",
});

export async function checkRateLimit(ip: string) {
  const { success, limit, reset, remaining } = await bookingRateLimit.limit(ip);
  return { success, limit, reset, remaining };
}

export async function checkOrderRateLimit(ip: string) {
  const { success, limit, reset, remaining } = await orderRateLimit.limit(ip);
  return { success, limit, reset, remaining };
}

export async function checkFlowRateLimit(ip: string) {
  const { success, limit, reset, remaining } = await flowRateLimit.limit(ip);
  return { success, limit, reset, remaining };
}
