// middleware/tierPricing.ts
import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

type Tier = { rpm: number; dailyCap?: number; name: string };

// Env pattern: KEY_TIER_<TIERNAME>_DAY or _RPM; map API key -> tier name via KEY_MAP_<APIKEY>=<TIERNAME>
function envMap(prefix: string): Record<string,string> {
  const out: Record<string,string> = {};
  Object.entries(process.env).forEach(([k,v]) => {
    if (k.startsWith(prefix) && v) out[k.slice(prefix.length)] = v;
  });
  return out;
}

const tierDefs: Record<string, Tier> = Object.entries(process.env)
  .filter(([k]) => k.startsWith("KEY_TIER_") && (k.endsWith("_RPM") || k.endsWith("_DAY")))
  .reduce((acc, [k, v]) => {
    const m = k.match(/^KEY_TIER_(.+)_(RPM|DAY)$/);
    if (!m) return acc;
    const name = m[1];
    const which = m[2];
    acc[name] = acc[name] || { name, rpm: 60 };
    if (which === "RPM") acc[name].rpm = parseInt(v || "60", 10);
    if (which === "DAY") acc[name].dailyCap = parseInt(v || "0", 10);
    return acc;
  }, {} as Record<string, Tier>);

const keyToTier = envMap("KEY_MAP_"); // e.g., KEY_MAP_abcd123=PRO, KEY_MAP_public=FREE

export function tierResolver(req: Request): Tier {
  const key = (req.header("x-api-key") || "").trim();
  const tname = keyToTier[key] || process.env.DEFAULT_TIER || "FREE";
  return tierDefs[tname] || { name: "FREE", rpm: 30, dailyCap: 1000 };
}

export function perKeyRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    keyGenerator: (req) => req.header("x-api-key") || req.ip,
    max: (req) => tierResolver(req).rpm,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => res.setHeader('Retry-After', '1'); res.setHeader('X-RateLimit-Remaining','0'); res.setHeader('X-RateLimit-Limit', String(limit)); res.status(429).json({ error: "rate_limit", message: "Rate limit exceeded" }),
  });
}

// Optional: daily cap accounting would require a store (Redis) to count per key per day.
