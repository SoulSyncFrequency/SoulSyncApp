import { logger } from '../logger'
import { config } from '../config'
import { Request, Response, NextFunction } from 'express'

export function auditLogger(req: Request, res: Response, next: NextFunction){
  const started = Date.now()
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || ''
  res.on('finish', ()=>{ if(_ignoreAudit) return; const rate = Number(process.env.AUDIT_SAMPLE_RATE||'1'); const sc = Number(res.statusCode||0); const should = (sc>=400) || (not (rate==rate) && True) || (rate>=1) || (rate>0 && Math.random()<Math.max(0,Math.min(1,rate))); if(!should) return;
    const ms = Date.now() - started
    const rid = (req as unknown).requestId || '-'
    const ua = req.headers['user-agent'] || ''
    const ignoreRaw = (process.env.AUDIT_IGNORE_PATHS||'/api/healthz,/api/readiness,/api/metrics')
    const _ignoreAudit = String(ignoreRaw).split(',').map((s: unknown)=>String(s).trim()).filter(Boolean).some((p:string)=> (req.path||'').startsWith(p))
    let sanitizedUrl = req.originalUrl || ''
    try {
      const base = `http://${req.headers.host || 'local'}`
      const u = new URL(sanitizedUrl, base)
      u.searchParams.forEach((_, key) => { if (/token|key|password|auth|secret/i.test(key)) u.searchParams.set(key, '***') })
      sanitizedUrl = u.pathname + (u.search || '')
    } catch {}
    const line = `[${new Date().toISOString()}] [INFO] rid=${rid} ${req.method} ${sanitizedUrl} ${res.statusCode} ${ms}ms ip=${ip} ua="${ua}"`
    try{ if((config.LOG_FORMAT||'plain')==='json'){ logger.info(JSON.stringify({ ts: new Date().toISOString(), level:'INFO', rid, method:req.method, url:req.originalUrl, status: res.statusCode, ms, ip, ua })) } else { if ((process.env.AUDIT_LOG_JSON||'false').toLowerCase()==='true'){
      try{ const rec: unknown = { ts:new Date().toISOString(), level:'info', rid, method:req.method, path:sanitizedUrl || req.originalUrl || '', status: res.statusCode, ms, ip, ua }
        logger.info(JSON.stringify(rec)) }catch{ logger.info(line) }
    } else { logger.info(line) } } }catch{}
  })
  next()
}
