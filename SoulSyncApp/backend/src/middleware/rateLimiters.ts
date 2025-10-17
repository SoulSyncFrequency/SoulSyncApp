import rateLimit from 'express-rate-limit'
function isAllowlisted(req: unknown){ try{ const raw=String(process.env.RATE_LIMIT_ALLOWLIST||'').trim(); if(!raw) return false; const ips=raw.split(',').map(s=>s.trim()).filter(Boolean); const ip = (req.headers['x-real-ip']||req.ip||'').toString(); return ips.includes(ip) }catch{ return false } }

export const cspReportLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20, // 20/min per IP
  standardHeaders: true,
  handler: (req, res, next, options)=>{ try{ if(options && options.message){} }catch{}; const ra = Math.ceil((options?.windowMs || 60000)/1000); try{ res.setHeader('Retry-After', String(ra)) }catch{}; return res.status(429).json({ error: 'rate_limited', requestId: (req as unknown)?.requestId || res.getHeader('X-Request-Id') || null }) },
  legacyHeaders: false
})


export const testErrorLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  handler: (req, res, next, options)=>{ try{ if(options && options.message){} }catch{}; const ra = Math.ceil((options?.windowMs || 60000)/1000); try{ res.setHeader('Retry-After', String(ra)) }catch{}; return res.status(429).json({ error: 'rate_limited', requestId: (req as unknown)?.requestId || res.getHeader('X-Request-Id') || null }) },
  legacyHeaders: false
})


export const globalApiLimiter = rateLimit({
  windowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS || '60000'),
  limit: Number(process.env.API_RATE_LIMIT_LIMIT || '300'),
  standardHeaders: true,
  handler: (req, res, next, options)=>{ try{ if(options && options.message){} }catch{}; const ra = Math.ceil((options?.windowMs || 60000)/1000); try{ res.setHeader('Retry-After', String(ra)) }catch{}; return res.status(429).json({ error: 'rate_limited', requestId: (req as unknown)?.requestId || res.getHeader('X-Request-Id') || null }) },
  legacyHeaders: false,
  skip: (req) => { if (isAllowlisted(req)) return true;
    const p = (req.path || '')
    return p.startsWith('/metrics') || p.startsWith('/healthz') || p.startsWith('/readiness') || p.startsWith('/status')
  }
})


export const authLimiter = rateLimit({
  skip: (req)=> isAllowlisted(req),
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '60000'),
  limit: Number(process.env.AUTH_RATE_LIMIT_LIMIT || '10'),
  standardHeaders: true,
  legacyHeaders: false
})
