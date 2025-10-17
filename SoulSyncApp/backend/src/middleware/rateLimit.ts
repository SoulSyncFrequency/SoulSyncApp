import rateLimit from 'express-rate-limit'

export const globalLimiter = rateLimit({
  windowMs: Number(process.env.RL_WINDOW_MS || 60_000),
  max: Number(process.env.RL_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false
})

export const adminLimiter = rateLimit({
  windowMs: 60_000,
  max: 60
})

export const authLimiter = rateLimit({
  windowMs: 15*60_000,
  max: 20
})


// Backwards-compatible export used in some routes
export const rateLimit = globalLimiter


// Helper to attach policy header globally
export function rateLimitPolicyHeader(req, res, next){
  try { res.setHeader('RateLimit-Policy', 'per-ip;w=60;max=' + (process.env.RL_MAX || 300)) } catch {}
  next()
}
