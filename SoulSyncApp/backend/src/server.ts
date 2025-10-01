import { PrismaClient } from '@prisma/client'
import { attachPrismaSlowLogger } from '../lib/prismaSlowLog'
import { initQueueMetrics } from './metrics/queueMetrics'
import { burstLimit } from './middleware/burstLimit'
import { logSampling } from './middleware/logSampling'
import { jobQueue } from './middleware/jobQueue'
import { slowRequests } from './middleware/slowRequests'
import { concurrencyLimit } from './middleware/concurrencyLimit'
import { httpCache } from './middleware/httpCache'
import { mountCsrf } from './middleware/csrf'
import { metricsMiddleware, metricsHandler } from './metrics'
import responseTime from 'response-time'
import { loggingMiddleware } from './middleware/logging'
import { tracingMiddleware } from './middleware/tracing'
import { redactMiddleware } from './middleware/redact'
import { readinessGate } from './middleware/readinessGate'
import { accessLog, accessTeelog } from './middleware/accessLog'
import adminQueues from './routes/adminQueues'
import adminQueuesUI from './routes/adminQueuesUI'
import swaggerUi from 'swagger-ui-express'
import fs from 'fs'
import path from 'path'
import { conditionalCache } from './middleware/conditionalCache'
import { queryValidator } from './middleware/queryValidator'
import { requestValidator } from './middleware/requestValidator'
import { responseValidator } from './middleware/responseValidator'
import { ReportsDailySendNowRequestSchema, WebhookTestRequestSchema } from './middleware/requestValidator'
import { withETag } from './middleware/etag'
import { cacheControl } from './middleware/cacheControl'
import { verifyWebhookSignature } from './middleware/verifyWebhookSignature'
import { bootQueues } from './queue'
import { auditLog } from './middleware/auditLog'
import { requireRole } from './middleware/rbac'
import { reportsRateLimiter } from './middleware/rateLimit'
import { validateParams } from './middleware/validateParamsQuery' 
import { LoginResponseSchema } from './schemas/auth'
import { TherapyResponseSchema } from './schemas/therapy'
import { TherapyGenerateSchema } from './schemas/therapyGenerate'
import { ExportPdfQuerySchema } from './schemas/exportPdf'
import { TherapyQuerySchema } from './schemas/therapyQuery'
import { ReportsDailySendNowSchema } from './schemas/reports'
import { WebhookTestRequestSchema } from './schemas/webhooks'
import { WebhookIdParamsSchema } from './schemas/webhookParams'
import './sentry'
import { loadConfig } from './config'
import express from 'express'
import supplementsScheduleRouter from './routes/supplements.schedule.routes'
import opsAccessTailRouter from './routes/ops.accesstail.routes'
import opsSnapshotRouter from './routes/ops.snapshot.routes'
import opsProcessStatsRouter from './routes/ops.processstats.routes'\nimport opsIncidentReportRouter from './routes/ops.incidentreport.routes'\nimport opsRouteDetailRouter from './routes/ops.routedetail.routes'
import opsErrorBudgetRouter from './routes/ops.errorbudget.routes'
import opsFlagsAuditRouter from './routes/ops.flagsaudit.routes'
import opsSlowSqlRouter from './routes/ops.slowqueries.sql.routes'\nimport opsSimulateRouter from './routes/ops.simulate.routes'\nimport opsLoopLagRouter from './routes/ops.looplag.routes'\nimport { requestLogger } from './middleware/requestLogger'\nimport opsSloStatusRouter from './routes/ops.slostatus.routes'\nimport opsRlDryrunRouter from './routes/ops.rldryrun.routes'\nimport opsTopErrorsRouter from './routes/ops.toperrors.routes'\nimport opsEnvExportRouter from './routes/ops.envexport.routes'\nimport opsConfigLintRouter from './routes/ops.configlint.routes'\nimport opsRcaHintsRouter from './routes/ops.rcahints.routes'\nimport opsAlertsRouter from './routes/ops.alerts.routes'\nimport opsTopRoutesRouter from './routes/ops.toproutes.routes'\nimport opsMetricsExportRouter from './routes/ops.metricsexport.routes'
import opsDashboardRouter from './routes/ops.dashboard.routes'
import opsAnomalyHintsRouter from './routes/ops.anomalyhints.routes'
import opsRlProposalRouter from './routes/ops.ratelimit.proposal.routes'
import opsReleaseNotesRouter from './routes/ops.releasenotes.routes'\nimport opsSafetyLintRouter from './routes/ops.safetylint.routes'\nimport { maybeCompression } from './middleware/maybeCompression'\nimport { jsonEtag } from './middleware/jsonEtag'\nimport opsVersionRouter from './routes/ops.version.routes'
import opsNotifyRouter from './routes/ops.notify.routes'
import opsBackupStatusRouter from './routes/ops.backupstatus.routes'
import opsPingS3Router from './routes/ops.pings3.routes'
import opsPingSmtpRouter from './routes/ops.pingsmtp.routes'
import opsPingRedisRouter from './routes/ops.pingredis.routes'
import opsPingDbRouter from './routes/ops.pingdb.routes'
import { openapiCache } from './middleware/openapiCache'
import opsPingRouter from './routes/ops.ping.routes'
import openapiHashRouter from './routes/openapi.hash.routes'
import opsConfigRouter from './routes/ops.config.routes'
import opsHeatmapRouter from './routes/ops.heatmap.routes'
import opsMaintenanceRouter from './routes/ops.maintenance.routes'
import type { Request, Response, NextFunction } from 'express'
import { exposeUsefulHeaders } from './middleware/cors'
import { sentryContext } from './middleware/sentryContext'
import debugHeadersRouter from './routes/debug.headers.routes'\nimport opsStatusRouter from './routes/ops.status.routes'\nimport { staticCache } from './middleware/staticCache'\nimport webhooksRouter from './routes/webhooks.routes'\nimport opsFlagsRouter from './routes/ops.flags.routes'
import supplementsRouter from './routes/supplements.routes'
import pregnenoloneRouter from './routes/pregnenolone.routes'
import adminAuditListRouter from './routes/admin.audit.list.routes'
import { appVersion } from './middleware/appVersion'
import { echoRequestId, generateRequestId } from './middleware/requestId'
import adminAuditExportRouter from './routes/admin.audit.routes'
import selfTestRouter from './routes/selftest.routes'
import { forceHttps } from './middleware/forceHttps'
import { loadEnv } from './config/env'
import { maintenanceMode } from './middleware/maintenance'
import { adminAudit } from './middleware/adminAudit'
import { deprecation } from './middleware/deprecation'
import versionRouter from './routes/version.routes'
import { noCache } from './middleware/nocache'
import openapiRouter from './routes/openapi.routes'
import liveReadyRouter from './routes/liveness_readiness.routes'\nimport cspReportRouter from './routes/csp.report.routes'\nimport { adminAuth } from './middleware/adminAuth'
import adminProgestERouter from './routes/admin.progeste.routes'
import progesteRouter from './routes/progeste.routes'
import { csp } from './middleware/csp'
import { latencyMiddleware, metricsHandler } from './metrics/latencyHistogram'
import { adminAuth } from './middleware/adminAuth'
import * as Sentry from '@sentry/node'
import hpp from 'hpp'
import compression from 'compression'
import fs from 'fs'
import path from 'path'
import { apiLimiter } from './middleware/rateLimit'
import { securityHeaders } from './middleware/securityHeaders'
import { auditLogger } from './middleware/audit'
import { sanitizeBody } from './middleware/sanitize'
import { hostAllowlist } from './middleware/hostAllowlist'
import { basicAuthGuard } from './middleware/basicAuth'
import { idempotencyGuard } from './middleware/idempotency'
import { cspReportLimiter, testErrorLimiter, globalApiLimiter, authLimiter } from './middleware/rateLimiters'
import { compress } from './middleware/compress'
import { corsMw } from './middleware/cors'
import { requestId } from './middleware/requestId'
import { respTiming } from './middleware/respTiming'
import healthRouter from './health'
import { metricsHttp } from './middleware/metrics'
import { validateQuery } from './middleware/validate'
import { validateRequest } from './middleware/validateRequest'
import { errorHandler } from './middleware/error'
import { logsQuerySchema } from './schemas'
import { config } from './config'

import { errorHandler } from './middleware/errorHandler'

const config = loadConfig()
const prisma = new PrismaClient()
attachPrismaSlowLogger(prisma)

const app = express()
// Validate & load env
loadEnv()
initSentry(app)
initQueueMetrics()

// Sentry instrumentation (feature-flagged via SENTRY_DSN)
import * as Sentry from '@sentry/node'
import '@sentry/tracing'
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV || 'development',
  })
  app.use(requestId())
app.use(accessLog())
app.use(Sentry.Handlers.requestHandler()
  app.use(Sentry.Handlers.tracingHandler())\napp.use(requestTimeout())\napp.use(jsonEtag())\napp.use(requestLogger())\napp.use(maybeCompression())
app.use((req,res,next)=> req.path==='/openapi.json'? openapiCache()(req,res,next): next())
app.use(exposeUsefulHeaders())
app.use(sentryContext())\napp.use(staticCache())
app.use(appVersion())
app.use(generateRequestId())
app.use(echoRequestId())
app.use(forceHttps())
app.use(maintenanceMode())
app.use(deprecation())
app.use(noCache())
app.use(latencyMiddleware())
}


// Serve OpenAPI JSON (generated) and Swagger UI
try {
  const openapiPath = path.resolve(process.cwd(), 'backend', 'openapi', 'openapi.json')
  if (fs.existsSync(openapiPath)) {
    const openapiDoc = JSON.parse(fs.readFileSync(openapiPath, 'utf-8'))
    app.get('/api/openapi.json', (_req, res) => res.json(openapiDoc))
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc))
  }
} catch {}

app.use(conditionalCache)
app.use(withETag)
app.use(httpCache)
app.use(cacheControl)
app.get('/livez', livez)
app.get('/readyz', readyz)
bootQueues(process.env.REDIS_URL)
app.use(auditLog)
app.use(burstLimit())
app.use(jobQueue)
app.use(concurrencyLimit())

if (process.env.COOP_COEP_ENABLED === 'true') {
  app.use((_, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
    next()
  })
}

if (process.env.CSRF_ENABLED === 'true') { mountCsrf(app) }
app.use('/health', healthRouter)\napp.use('/', opsIncidentReportRouter)\napp.use('/', opsRouteDetailRouter)\napp.use('/', opsLoopLagRouter)
app.use('/', adminProgestERouter)
app.use(queryValidator)
app.use(requestValidator)
app.use(responseValidator)

// Release version wiring
const RELEASE_VERSION = process.env.RELEASE_VERSION || require('../package.json').version
try {
  buildInfo.set({ version: RELEASE_VERSION, git: process.env.GIT_SHA || '' }, 1)
} catch(e) { /* metric not available */ }

app.use((req: unknown,res: unknown,next: unknown)=>{ try{ if((process.env.ENABLE_X_REQUEST_START||'true').toLowerCase()==='true'){ const t=Date.now(); res.setHeader('X-Request-Start', String(t)) } }catch{} next() })
app.set('json spaces', Number(process.env.JSON_SPACES||'0'))
app.set('query parser', process.env.QUERY_PARSER || 'simple')
app.use(requestId())
app.use(accessLog())
app.use(Sentry.Handlers.requestHandler()
app.use(Sentry.Handlers.tracingHandler())\napp.use(requestTimeout())\napp.use(jsonEtag())\napp.use(requestLogger())\napp.use(maybeCompression())
app.use((req,res,next)=> req.path==='/openapi.json'? openapiCache()(req,res,next): next())
app.use(exposeUsefulHeaders())
app.use(sentryContext())\napp.use(staticCache())
app.use(appVersion())
app.use(generateRequestId())
app.use(echoRequestId())
app.use(forceHttps())
app.use(maintenanceMode())
app.use(deprecation())
app.use(noCache())
app.use(latencyMiddleware())
// Attach request metadata to Sentry scope
app.use((req: unknown,_res: unknown,next: unknown)=>{
  try {
    const rid = (req as unknown).requestId
    Sentry.configureScope(scope=>{
      if(rid) scope.setTag('request_id', rid)
      if(req.ip) scope.setTag('ip', req.ip)
      const ua = req.headers['user-agent'] || ''
      if(ua) scope.setTag('ua', String(ua).slice(0,120))
      if(req.route?.path) scope.setTag('route', req.route.path)
      const tp = req.headers['traceparent']; if (tp) scope.setTag('traceparent', String(tp).slice(0,256)); const cfr = req.headers['cf-ray']; if (cfr) scope.setTag('cf_ray', String(cfr).slice(0,64))
    })
  } catch {}
  next()
})

app.set('etag', false)
// Set build_info metric once on startup
try {
  const fs = require('fs')
  const path = require('path')
  const pkgPath = path.join(process.cwd(), 'backend', 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath,'utf8'))
  const git = process.env.GIT_SHA || ''
  buildInfo.set({ version: pkg.version || '0.0.0', git }, 1)
} catch {}

app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use(compress)
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }))
app.use(express.urlencoded({ limit: process.env.FORM_BODY_LIMIT || '1mb', extended: true }))
app.use(securityHeaders)
app.use(csp() /* CSP report-only by default */))
app.use(hostAllowlist)

// In-flight tracker & load shedding
;(globalThis as unknown).__SOULSYNC_INFLIGHT__ = (globalThis as unknown).__SOULSYNC_INFLIGHT__ || 0
app.use((req: unknown,res: unknown,next: unknown)=>{
  try{
    ;(globalThis as unknown).__SOULSYNC_INFLIGHT__++
    const lim = Number(process.env.MAX_INFLIGHT_REQUESTS||'0')
    if (lim>0 && (globalThis as unknown).__SOULSYNC_INFLIGHT__ > lim){
      try{ res.setHeader('Retry-After','1') }catch{}
      const rid = (req as unknown)?.requestId || res.getHeader('X-Request-Id') || null
      ;(globalThis as unknown).__SOULSYNC_INFLIGHT__--
      return res.status(503).json({ error:'server_busy', requestId: rid })
    }
    res.on('finish', ()=>{ try{ (globalThis as unknown).__SOULSYNC_INFLIGHT__-- }catch{} })
    res.on('close',  ()=>{ try{ (globalThis as unknown).__SOULSYNC_INFLIGHT__-- }catch{} })
  }catch{}
  next()
})

// Blocklisted User-Agents (best-effort)
app.use((req: unknown,res: unknown,next: unknown)=>{ try{ const pat = String(process.env.BLOCKED_UA_PATTERNS||'').trim(); if(pat){ const ua = String(req.headers['user-agent']||''); if (new RegExp(pat,'i').test(ua)){ const rid=(req as unknown)?.requestId || res.getHeader('X-Request-Id') || null; return res.status(403).json({ error:'blocked_ua', requestId:rid }) } } }catch{}; next() })
// Optional HTTPS enforce + HSTS
app.use((req: unknown,res: unknown,next: unknown)=>{
  try{
    const enforce = (process.env.ENFORCE_HTTPS||'false').toLowerCase()==='true'
    const xfproto = String((req.headers['x-forwarded-proto']||'')).toLowerCase()
    const secure = req.secure || xfproto.includes('https')
    if (enforce && !secure){
      // redirect GET/HEAD; block others to avoid unsafe replays
      if (req.method==='GET' || req.method==='HEAD'){
        const host = req.headers['x-forwarded-host'] || req.headers['host']
        const url = 'https://' + host + (req.originalUrl||req.url||'/')
        return res.redirect(308, url)
      }
      return res.status(400).json({ error:'https_required' })
    }
    if (enforce && secure){
      const maxAge = Number(process.env.HSTS_MAX_AGE||'15552000')
      const incSub = (process.env.HSTS_INCLUDE_SUBDOMAINS||'true').toLowerCase()==='true'
      const preload = (process.env.HSTS_PRELOAD||'false').toLowerCase()==='true'
      let val = `max-age=${Math.max(0,maxAge)}`
      if (incSub) val += '; includeSubDomains'
      if (preload) val += '; preload'
      try { res.setHeader('Strict-Transport-Security', val) } catch {}
    }
  } catch {}
  next()
})
// Cookie hardening (ensure Secure/HttpOnly/SameSite)
app.use((req: unknown,res: unknown,next: unknown)=>{
  if((process.env.COOKIE_HARDENING||'true').toLowerCase()!=='true') return next()
  const orig = res.setHeader.bind(res)
  function hardenCookie(v:string){
    try{
      let s = String(v)
      const hasHttpOnly = /;\s*httponly/i.test(s)
      const hasSecure = /;\s*secure/i.test(s)
      const m = /;\s*samesite=([a-zA-Z]+)/i.exec(s)
      let same = m ? m[1].toLowerCase() : ''
      const defSS = String(process.env.COOKIE_SAMESITE_DEFAULT||'Lax')
      if(!m){ s += '; SameSite=' + defSS }
      if(!hasHttpOnly) s += '; HttpOnly'
      if(same==='none' && !hasSecure) s += '; Secure'
      if(same!== 'none' && !hasSecure) s += '; Secure'  // prefer Secure by default
      return s
    }catch{ return v }
  }
  ;(res as unknown).setHeader = (name: unknown, value: unknown)=>{
    try{
      if(String(name).toLowerCase()==='set-cookie'){
        const arr = Array.isArray(value)? value : [String(value)]
        const hardened = arr.map(hardenCookie)
        return orig(name, hardened)
      }
    }catch{}
    return orig(name, value)
  }
  next()
})

// Query guards (count, param length, array length)
app.use((req: unknown,res: unknown,next: unknown)=>{
  try{
    const maxParams = Number(process.env.MAX_QUERY_PARAMS||'200')
    const maxLen = Number(process.env.MAX_QUERY_PARAM_LENGTH||'2048')
    const maxArr = Number(process.env.MAX_QUERY_ARRAY_LENGTH||'100')
    const base = `http://${req.headers.host || 'local'}`
    const u = new URL(req.originalUrl || req.url || '', base)
    const usp = u.searchParams
    let count = 0
    let invalid = ''
    const seen: Record<string, number> = {}
    usp.forEach((v,k)=>{
      count++; seen[k] = (seen[k]||0)+1
      if (v && v.length > maxLen) invalid = 'param_too_long'
    })
    if (!invalid){
      for (const [k,n] of Object.entries(seen)){ if (n>maxArr){ invalid = 'array_too_long'; break } }
    }
    if (!invalid && maxParams>0 && count > maxParams) invalid = 'too_many_params'
    if (invalid){ 
      const rid = (req as unknown)?.requestId || res.getHeader('X-Request-Id') || null
      return res.status(400).json({ error:'invalid_query', code: invalid, requestId: rid }) 
    }
  } catch {}
  next()
})

// Path traversal guard
app.use((req: unknown,res: unknown,next: unknown)=>{ try{ if((process.env.ENABLE_PATH_GUARD||'true').toLowerCase()==='true'){ const u=String(req.originalUrl||''); if(/[\\\/]\.\.(?:[\\\/]|$)/.test(u) || /%2e%2e/i.test(u)){ return res.status(400).json({ error:'invalid_path' }) } } }catch{}; next() })

// Draining flag for graceful shutdown
;(globalThis as unknown).__SOULSYNC_DRAINING__ = (globalThis as unknown).__SOULSYNC_DRAINING__ || false
// Set Connection: close while draining; flip readiness to 503
app.use((req: unknown,res: unknown,next: unknown)=>{ try{ if((globalThis as unknown).__SOULSYNC_DRAINING__){ res.setHeader('Connection','close') } }catch{}; next() })
app.use('/api/readiness', (req: unknown,res: unknown,next: unknown)=>{ if((globalThis as unknown).__SOULSYNC_DRAINING__){ return res.status(503).json({ ok:false, draining:true }) } next() })

app.use((req: unknown,res: unknown,next: unknown)=>{ const m=req.method; if(m==='TRACE'||m==='TRACK'||m==='CONNECT'){ const rid=(req as unknown)?.requestId || res.getHeader('X-Request-Id') || null; return res.status(405).json({ error:'method_not_allowed', requestId: rid }) } res.setHeader('Timing-Allow-Origin', process.env.TIMING_ALLOW_ORIGIN || '*'); const apiVer = process.env.API_VERSION || process.env.GIT_SHA || ''; if(apiVer) res.setHeader('X-API-Version', apiVer); if(!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', process.env.API_CACHE_CONTROL || 'no-store'); next() })
// Optional per-request timeout
app.use((req: unknown,res: unknown,next: unknown)=>{ const ms = Number(process.env.REQUEST_TIMEOUT_MS||'0'); if(ms>0){ try{ res.setTimeout(ms, ()=>{ try{ if(!res.headersSent){ res.status(503).json({ error:'timeout' }) } }catch{} }) }catch{} } res.setHeader('Timing-Allow-Origin', process.env.TIMING_ALLOW_ORIGIN || '*'); const apiVer = process.env.API_VERSION || process.env.GIT_SHA || ''; if(apiVer) res.setHeader('X-API-Version', apiVer); if(!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', process.env.API_CACHE_CONTROL || 'no-store'); next() })
// Guard: URL length
app.use((req: unknown,res: unknown,next: unknown)=>{ try{ const max = Number(process.env.MAX_URL_LENGTH||'8192'); if (req.originalUrl && max>0 && req.originalUrl.length>max) return res.status(414).json({ error: 'URI Too Long' }); }catch{} res.setHeader('Timing-Allow-Origin', process.env.TIMING_ALLOW_ORIGIN || '*'); const apiVer = process.env.API_VERSION || process.env.GIT_SHA || ''; if(apiVer) res.setHeader('X-API-Version', apiVer); if(!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', process.env.API_CACHE_CONTROL || 'no-store'); next() })

// Optional response compression (skip metrics)
app.use((req: unknown,_res: unknown,next: unknown)=>{ (req as unknown).__skipCompression = req.path?.startsWith('/api/metrics'); res.setHeader('Timing-Allow-Origin', process.env.TIMING_ALLOW_ORIGIN || '*'); const apiVer = process.env.API_VERSION || process.env.GIT_SHA || ''; if(apiVer) res.setHeader('X-API-Version', apiVer); if(!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', process.env.API_CACHE_CONTROL || 'no-store'); next() })
if ((process.env.ENABLE_COMPRESSION||'true').toLowerCase()==='true'){
  app.use(compression({ threshold: 1024, filter: (req: unknown,res: unknown)=>{ if((req as unknown).__skipCompression) return false; return compression.filter(req,res) } }))
}
app.use(hpp())
// Light CSP in Report-Only mode (won't break runtime, but reports violations)
app.use((req: unknown,res: unknown,next: unknown)=>{
  const csp = [
    "default-src 'self'",
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'self'"
  ].join('; ')
  res.setHeader('Content-Security-Policy-Report-Only', csp + '; report-to="csp-endpoint"; report-uri /api/csp-report')
  res.setHeader('Report-To', JSON.stringify({ group:'csp-endpoint', max_age:10886400, endpoints:[{url:'/api/csp-report'}] }))
  next()
})


// Avoid caching API responses
function nocache(_req: unknown,res: unknown,next: unknown){ res.setHeader('Cache-Control','no-store'); next() }
app.use('/api', nocache)


// Maintenance mode (returns 503 for non-essential endpoints)
app.use('/api', (req: unknown,res: unknown,next: unknown)=>{
  try{ res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive') }catch{}
  // Optional: accept inbound X-Request-Id (sanitized) for correlation
  try{
    if ((process.env.ACCEPT_CLIENT_REQUEST_ID||'false').toLowerCase()==='true'){
      const inc = (req.headers['x-request-id']||'').toString()
      if (inc){
        const clean = inc.replace(/[^a-zA-Z0-9_\-:.]/g,'').slice(0,128) || ''
        if (clean){ try{ res.setHeader('X-Request-Id', clean) }catch{}; try{ (req as unknown).requestId = clean }catch{} }
      }
    }
  }catch{}

  try{ if((process.env.EXPOSE_CLIENT_IP||'false').toLowerCase()==='true'){ const ip = (req.headers['x-real-ip']||req.ip||'').toString(); if(ip) res.setHeader('X-Client-IP', ip) } }catch{}
  // options fast path
  if (req.method==='OPTIONS'){ try{ res.setHeader('Vary','Origin, Access-Control-Request-Method, Access-Control-Request-Headers') }catch{}; return res.status(204).end(); }
  try{
    const _origJson = res.json.bind(res)
    res.json = (body: unknown)=>{
      try{
        const replacer = ((process.env.JSON_BIGINT_STRINGS||'false').toLowerCase()==='true') ? (k: unknown,v: unknown)=> (typeof v==='bigint'? String(v): v) : undefined
        const s = JSON.stringify(body, replacer)
        try{ res.setHeader('X-Response-Size', String(Buffer.byteLength(s,'utf8'))) }catch{}
        const max = Number(process.env.RESPONSE_JSON_MAX_BYTES||'0')
        if (Number.isFinite(max) && max>0 && Buffer.byteLength(s,'utf8')>max){
          const rid = (req as unknown)?.requestId || res.getHeader('X-Request-Id') || null
          res.status(500)
          return _origJson({ error:'response_too_large', requestId: rid })
        }
        return _origJson(body)
      }catch{ return _origJson(body) }
    }
  }catch{}

  try{
    if((process.env.STRICT_CONTENT_TYPE||'false').toLowerCase()==='true'){
      const m = req.method.toUpperCase();
      if(['POST','PUT','PATCH','DELETE'].includes(m)){
        const ct = String(req.headers['content-type']||'').toLowerCase().split(';')[0].trim()
        const allowed = String(process.env.ALLOWED_CONTENT_TYPES||'').split(',').map((s)=>s.trim().toLowerCase()).filter(Boolean)
        const ok = !ct || allowed.some(a=> a==='*/*' || a===ct || (a.endsWith('/*') && ct.startsWith(a.slice(0,-1))))
        if(!ok){
          const rid = (req as unknown)?.requestId || res.getHeader('X-Request-Id') || null
          res.type('application/problem+json')
          return res.status(415).json({ type:'about:blank', title:'Unsupported Media Type', status:415, requestId: rid })
        }
      }
    }
  }catch{}

  try{
    const dep = (process.env.DEPRECATION || '').trim()
    const sun = (process.env.SUNSET || '').trim()
    const link = (process.env.DEPRECATION_LINK || '').trim()
    if (dep) res.setHeader('Deprecation', dep)
    if (sun) res.setHeader('Sunset', sun)
    if (link) res.setHeader('Link', `<${link}>; rel="deprecation"`)
  }catch{}

  try{
    const strict = (process.env.STRICT_ACCEPT_JSON||'false').toLowerCase()==='true'
    if (strict){
      const acc = String(req.headers['accept'] || '*/*').toLowerCase()
      const wantsJson = acc.includes('application/json') || acc === '*/*' || acc.startsWith('*/*')
      if (!wantsJson){
        const rid = (req as unknown)?.requestId || res.getHeader('X-Request-Id') || null
        res.type('application/problem+json')
        return res.status(406).json({ type:'about:blank', title:'Not Acceptable', status:406, requestId: rid })
      }
    }
  }catch{}

  const on = (process.env.MAINTENANCE_MODE||'false').toLowerCase()==='true'
  const allowed = ['/healthz','/readiness','/metrics','/version','/csp-report']
  if(on && !allowed.some(p=>req.path.startsWith(p))){ res.setHeader('Retry-After','120'); return res.status(503).json({ error:'Maintenance in progress', retryAfter:120 }) }
  return next()
})
app.use(corsMw)
// Optional Idempotency-Key guard
if ((process.env.ENABLE_IDEMPOTENCY_GUARD||'false').toLowerCase()==='true') app.use('/api', idempotencyGuard(Number(process.env.IDEMPOTENCY_TTL_MS||'300000')))
// Optional global API rate limit
if ((process.env.API_RATE_LIMIT_ENABLE||'false').toLowerCase()==='true'){ app.use('/api', globalApiLimiter) }
// Optional auth limiter (enable by setting limits env)
app.use('/api/auth', authLimiter)
app.use('/api', (req: unknown,res: unknown,next: unknown)=>{
  try{ res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive') }catch{}
  // Optional: accept inbound X-Request-Id (sanitized) for correlation
  try{
    if ((process.env.ACCEPT_CLIENT_REQUEST_ID||'false').toLowerCase()==='true'){
      const inc = (req.headers['x-request-id']||'').toString()
      if (inc){
        const clean = inc.replace(/[^a-zA-Z0-9_\-:.]/g,'').slice(0,128) || ''
        if (clean){ try{ res.setHeader('X-Request-Id', clean) }catch{}; try{ (req as unknown).requestId = clean }catch{} }
      }
    }
  }catch{}

  try{ if((process.env.EXPOSE_CLIENT_IP||'false').toLowerCase()==='true'){ const ip = (req.headers['x-real-ip']||req.ip||'').toString(); if(ip) res.setHeader('X-Client-IP', ip) } }catch{}
  // options fast path
  if (req.method==='OPTIONS'){ try{ res.setHeader('Vary','Origin, Access-Control-Request-Method, Access-Control-Request-Headers') }catch{}; return res.status(204).end(); }
  try{
    const _origJson = res.json.bind(res)
    res.json = (body: unknown)=>{
      try{
        const replacer = ((process.env.JSON_BIGINT_STRINGS||'false').toLowerCase()==='true') ? (k: unknown,v: unknown)=> (typeof v==='bigint'? String(v): v) : undefined
        const s = JSON.stringify(body, replacer)
        try{ res.setHeader('X-Response-Size', String(Buffer.byteLength(s,'utf8'))) }catch{}
        const max = Number(process.env.RESPONSE_JSON_MAX_BYTES||'0')
        if (Number.isFinite(max) && max>0 && Buffer.byteLength(s,'utf8')>max){
          const rid = (req as unknown)?.requestId || res.getHeader('X-Request-Id') || null
          res.status(500)
          return _origJson({ error:'response_too_large', requestId: rid })
        }
        return _origJson(body)
      }catch{ return _origJson(body) }
    }
  }catch{}

  try{
    if((process.env.STRICT_CONTENT_TYPE||'false').toLowerCase()==='true'){
      const m = req.method.toUpperCase();
      if(['POST','PUT','PATCH','DELETE'].includes(m)){
        const ct = String(req.headers['content-type']||'').toLowerCase().split(';')[0].trim()
        const allowed = String(process.env.ALLOWED_CONTENT_TYPES||'').split(',').map((s)=>s.trim().toLowerCase()).filter(Boolean)
        const ok = !ct || allowed.some(a=> a==='*/*' || a===ct || (a.endsWith('/*') && ct.startsWith(a.slice(0,-1))))
        if(!ok){
          const rid = (req as unknown)?.requestId || res.getHeader('X-Request-Id') || null
          res.type('application/problem+json')
          return res.status(415).json({ type:'about:blank', title:'Unsupported Media Type', status:415, requestId: rid })
        }
      }
    }
  }catch{}

  try{
    const dep = (process.env.DEPRECATION || '').trim()
    const sun = (process.env.SUNSET || '').trim()
    const link = (process.env.DEPRECATION_LINK || '').trim()
    if (dep) res.setHeader('Deprecation', dep)
    if (sun) res.setHeader('Sunset', sun)
    if (link) res.setHeader('Link', `<${link}>; rel="deprecation"`)
  }catch{}

  try{
    const strict = (process.env.STRICT_ACCEPT_JSON||'false').toLowerCase()==='true'
    if (strict){
      const acc = String(req.headers['accept'] || '*/*').toLowerCase()
      const wantsJson = acc.includes('application/json') || acc === '*/*' || acc.startsWith('*/*')
      if (!wantsJson){
        const rid = (req as unknown)?.requestId || res.getHeader('X-Request-Id') || null
        res.type('application/problem+json')
        return res.status(406).json({ type:'about:blank', title:'Not Acceptable', status:406, requestId: rid })
      }
    }
  }catch{}
 try{ res.setHeader('Vary','Origin, Accept, Accept-Encoding'); res.setHeader('Access-Control-Expose-Headers', process.env.EXPOSE_HEADERS || 'X-Request-Id,X-Correlation-Id,Server-Timing,RateLimit-Limit,RateLimit-Remaining,RateLimit-Reset') }catch{}; res.setHeader('Timing-Allow-Origin', process.env.TIMING_ALLOW_ORIGIN || '*'); const apiVer = process.env.API_VERSION || process.env.GIT_SHA || ''; if(apiVer) res.setHeader('X-API-Version', apiVer); if(!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', process.env.API_CACHE_CONTROL || 'no-store'); next() })
app.use(requestId)
app.use(metricsMiddleware)
app.use(adminQueues)
app.use(adminQueuesUI)
if (process.env.ENABLE_LOG_SAMPLING === 'true') app.use(logSampling)
if (process.env.ENABLE_SLOW_LOG === 'true') app.use(slowRequests())
app.use(responseTime())
app.use(readinessGate)
app.use(redactMiddleware)
app.use(tracingMiddleware)
app.use(loggingMiddleware)
app.use(accessLog)
app.use(accessTeelog)
app.use(respTiming)
app.use(metricsHttp)
app.use(auditLogger)
app.use(sanitizeBody)
// JSON keys guard
app.use((req: unknown,res: unknown,next: unknown)=>{ try{ const max = Number(process.env.MAX_JSON_KEYS||'2000'); let cnt=0; function walk(o: unknown){ if(!o || typeof o!=='object') return; for(const k of Object.keys(o)){ cnt++; if(cnt>max) return; walk((o as unknown)[k]) } }; if (req.body && typeof req.body==='object'){ walk(req.body); if (cnt>max){ const rid=(req as unknown)?.requestId || res.getHeader('X-Request-Id') || null; return res.status(400).json({ error:'json_keys_exceeded', requestId: rid }) } } }catch{}; next() })
app.use('/api/', (req: unknown,res: unknown,next: unknown)=> req.path.startsWith('/metrics') || req.path.startsWith('/healthz') || req.path.startsWith('/readiness') ? next() : apiLimiter(req,res,next))

import './watchdog'
import { loadConfig } from './config'
import express from 'express'
import supplementsScheduleRouter from './routes/supplements.schedule.routes'
import opsAccessTailRouter from './routes/ops.accesstail.routes'
import opsSnapshotRouter from './routes/ops.snapshot.routes'
import opsProcessStatsRouter from './routes/ops.processstats.routes'\nimport opsIncidentReportRouter from './routes/ops.incidentreport.routes'\nimport opsRouteDetailRouter from './routes/ops.routedetail.routes'
import opsErrorBudgetRouter from './routes/ops.errorbudget.routes'
import opsFlagsAuditRouter from './routes/ops.flagsaudit.routes'
import opsSlowSqlRouter from './routes/ops.slowqueries.sql.routes'\nimport opsSimulateRouter from './routes/ops.simulate.routes'\nimport opsLoopLagRouter from './routes/ops.looplag.routes'\nimport { requestLogger } from './middleware/requestLogger'\nimport opsSloStatusRouter from './routes/ops.slostatus.routes'\nimport opsRlDryrunRouter from './routes/ops.rldryrun.routes'\nimport opsTopErrorsRouter from './routes/ops.toperrors.routes'\nimport opsEnvExportRouter from './routes/ops.envexport.routes'\nimport opsConfigLintRouter from './routes/ops.configlint.routes'\nimport opsRcaHintsRouter from './routes/ops.rcahints.routes'\nimport opsAlertsRouter from './routes/ops.alerts.routes'\nimport opsTopRoutesRouter from './routes/ops.toproutes.routes'\nimport opsMetricsExportRouter from './routes/ops.metricsexport.routes'
import opsDashboardRouter from './routes/ops.dashboard.routes'
import opsAnomalyHintsRouter from './routes/ops.anomalyhints.routes'
import opsRlProposalRouter from './routes/ops.ratelimit.proposal.routes'
import opsReleaseNotesRouter from './routes/ops.releasenotes.routes'\nimport opsSafetyLintRouter from './routes/ops.safetylint.routes'\nimport { maybeCompression } from './middleware/maybeCompression'\nimport { jsonEtag } from './middleware/jsonEtag'\nimport opsVersionRouter from './routes/ops.version.routes'
import opsNotifyRouter from './routes/ops.notify.routes'
import opsBackupStatusRouter from './routes/ops.backupstatus.routes'
import opsPingS3Router from './routes/ops.pings3.routes'
import opsPingSmtpRouter from './routes/ops.pingsmtp.routes'
import opsPingRedisRouter from './routes/ops.pingredis.routes'
import opsPingDbRouter from './routes/ops.pingdb.routes'
import { openapiCache } from './middleware/openapiCache'
import opsPingRouter from './routes/ops.ping.routes'
import openapiHashRouter from './routes/openapi.hash.routes'
import opsConfigRouter from './routes/ops.config.routes'
import opsHeatmapRouter from './routes/ops.heatmap.routes'
import opsMaintenanceRouter from './routes/ops.maintenance.routes'
import type { Request, Response, NextFunction } from 'express'
import { exposeUsefulHeaders } from './middleware/cors'
import { sentryContext } from './middleware/sentryContext'
import debugHeadersRouter from './routes/debug.headers.routes'\nimport opsStatusRouter from './routes/ops.status.routes'\nimport { staticCache } from './middleware/staticCache'\nimport webhooksRouter from './routes/webhooks.routes'\nimport opsFlagsRouter from './routes/ops.flags.routes'
import supplementsRouter from './routes/supplements.routes'
import pregnenoloneRouter from './routes/pregnenolone.routes'
import adminAuditListRouter from './routes/admin.audit.list.routes'
import { appVersion } from './middleware/appVersion'
import { echoRequestId, generateRequestId } from './middleware/requestId'
import adminAuditExportRouter from './routes/admin.audit.routes'
import selfTestRouter from './routes/selftest.routes'
import { forceHttps } from './middleware/forceHttps'
import { loadEnv } from './config/env'
import { maintenanceMode } from './middleware/maintenance'
import { adminAudit } from './middleware/adminAudit'
import { deprecation } from './middleware/deprecation'
import versionRouter from './routes/version.routes'
import { noCache } from './middleware/nocache'
import openapiRouter from './routes/openapi.routes'
import liveReadyRouter from './routes/liveness_readiness.routes'\nimport cspReportRouter from './routes/csp.report.routes'\nimport { adminAuth } from './middleware/adminAuth'
import adminProgestERouter from './routes/admin.progeste.routes'
import progesteRouter from './routes/progeste.routes'
import { csp } from './middleware/csp'
import { latencyMiddleware, metricsHandler } from './metrics/latencyHistogram'
import { adminAuth } from './middleware/adminAuth'
import * as Sentry from '@sentry/node'
import hpp from 'hpp'
import compression from 'compression'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import pinoHttp from 'pino-http'
import { v4 as uuidv4 } from 'uuid'
import { logger } from './logger'
import billingRoutes from './routes/billing'
import notifyRoutes from './routes/notify'
import notificationsRoutes from './routes/notifications'
import notificationsSseRoutes from './routes/notifications.sse'
import notificationsArchivesRoutes from './routes/notifications.archives'
import webhooksRoutes from './routes/webhooks'
import reportsRoutes from './routes/reports'
import adminDashboardRoutes from './routes/adminDashboard'
import adminDashboardExportRoutes from './routes/adminDashboardExport'
import healthRoutes from './routes/health'
import apiDocsMain from './routes/apiDocsMain'
import adminLogs from './routes/adminLogs'
import openapiRoute from './routes/openapi'
import twofaRoute from './routes/twofa'
import readyRoute from './routes/ready'
import adminDocsRoutes from './routes/adminDocs'
import adminSystemLogRoutes from './routes/adminSystemLog'
import adminSLOConfigRoutes from './routes/adminSLOConfig'
import adminLogFilesRoutes from './routes/adminLogFiles'
import systemLogsRoutes from './routes/systemLogs'
import { register as metricsRegister } from './metrics'
import { adminGuard } from './middleware/adminGuard'
import { startQueueWorkers } from './queue/workers'
import adminWatchdogRoutes from './routes/adminWatchdog'
import adminDocsAlertingRoutes from './routes/adminDocsAlerting'
import pushRoutes from './routes/push'
import devicesRoutes from './routes/devices'
import adminDevices from './routes/adminDevices'
import { configureWebPush } from './push'
import { initDb } from './db'

import { errorHandler } from './middleware/errorHandler'

const config = loadConfig()
const prisma = new PrismaClient()
attachPrismaSlowLogger(prisma)

const app = express()
// Validate & load env
loadEnv()
initSentry(app)
initQueueMetrics()

// Sentry instrumentation (feature-flagged via SENTRY_DSN)
import * as Sentry from '@sentry/node'
import '@sentry/tracing'
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV || 'development',
  })
  app.use(requestId())
app.use(accessLog())
app.use(Sentry.Handlers.requestHandler()
  app.use(Sentry.Handlers.tracingHandler())\napp.use(requestTimeout())\napp.use(jsonEtag())\napp.use(requestLogger())\napp.use(maybeCompression())
app.use((req,res,next)=> req.path==='/openapi.json'? openapiCache()(req,res,next): next())
app.use(exposeUsefulHeaders())
app.use(sentryContext())\napp.use(staticCache())
app.use(appVersion())
app.use(generateRequestId())
app.use(echoRequestId())
app.use(forceHttps())
app.use(maintenanceMode())
app.use(deprecation())
app.use(noCache())
app.use(latencyMiddleware())
}


// Serve OpenAPI JSON (generated) and Swagger UI
try {
  const openapiPath = path.resolve(process.cwd(), 'backend', 'openapi', 'openapi.json')
  if (fs.existsSync(openapiPath)) {
    const openapiDoc = JSON.parse(fs.readFileSync(openapiPath, 'utf-8'))
    app.get('/api/openapi.json', (_req, res) => res.json(openapiDoc))
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc))
  }
} catch {}

app.use(conditionalCache)
app.use(withETag)
app.use(httpCache)
app.use(cacheControl)
bootQueues(process.env.REDIS_URL)
app.use(auditLog)
app.use(burstLimit())
app.use(jobQueue)
app.use(concurrencyLimit())

if (process.env.COOP_COEP_ENABLED === 'true') {
  app.use((_, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
    next()
  })
}

if (process.env.CSRF_ENABLED === 'true') { mountCsrf(app) }
app.use('/health', healthRouter)\napp.use('/', opsIncidentReportRouter)\napp.use('/', opsRouteDetailRouter)\napp.use('/', opsLoopLagRouter)
app.use('/', adminProgestERouter)

// Release version wiring
const RELEASE_VERSION = process.env.RELEASE_VERSION || require('../package.json').version
try {
  buildInfo.set({ version: RELEASE_VERSION, git: process.env.GIT_SHA || '' }, 1)
} catch(e) { /* metric not available */ }

app.use((req: unknown,res: unknown,next: unknown)=>{ try{ if((process.env.ENABLE_X_REQUEST_START||'true').toLowerCase()==='true'){ const t=Date.now(); res.setHeader('X-Request-Start', String(t)) } }catch{} next() })
app.set('json spaces', Number(process.env.JSON_SPACES||'0'))
app.set('query parser', process.env.QUERY_PARSER || 'simple')
app.use(requestId())
app.use(accessLog())
app.use(Sentry.Handlers.requestHandler()
app.use(Sentry.Handlers.tracingHandler())\napp.use(requestTimeout())\napp.use(jsonEtag())\napp.use(requestLogger())\napp.use(maybeCompression())
app.use((req,res,next)=> req.path==='/openapi.json'? openapiCache()(req,res,next): next())
app.use(exposeUsefulHeaders())
app.use(sentryContext())\napp.use(staticCache())
app.use(appVersion())
app.use(generateRequestId())
app.use(echoRequestId())
app.use(forceHttps())
app.use(maintenanceMode())
app.use(deprecation())
app.use(noCache())
app.use(latencyMiddleware())
// Attach request metadata to Sentry scope
app.use((req: unknown,_res: unknown,next: unknown)=>{
  try {
    const rid = (req as unknown).requestId
    Sentry.configureScope(scope=>{
      if(rid) scope.setTag('request_id', rid)
      if(req.ip) scope.setTag('ip', req.ip)
      const ua = req.headers['user-agent'] || ''
      if(ua) scope.setTag('ua', String(ua).slice(0,120))
      if(req.route?.path) scope.setTag('route', req.route.path)
      const tp = req.headers['traceparent']; if (tp) scope.setTag('traceparent', String(tp).slice(0,256)); const cfr = req.headers['cf-ray']; if (cfr) scope.setTag('cf_ray', String(cfr).slice(0,64))
    })
  } catch {}
  next()
})

app.set('etag', false)
// Set build_info metric once on startup
try {
  const fs = require('fs')
  const path = require('path')
  const pkgPath = path.join(process.cwd(), 'backend', 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath,'utf8'))
  const git = process.env.GIT_SHA || ''
  buildInfo.set({ version: pkg.version || '0.0.0', git }, 1)
} catch {}

app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use(compress)

app.use(pinoHttp({
  genReqId: (req, res) => (req.headers['x-request-id'] as string) || res.getHeader('x-request-id'),
  customSuccessMessage: function (req, res) {
    return 'request completed'
  },
  customErrorMessage: function (req, res, err) {
    return 'request errored'
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      ip: req.ip
    }),
    res: (res) => ({
      statusCode: res.statusCode
    })
  },
  customProps: function (req, res) {
    return {
      userId: (req.user && req.user.id) || undefined,
      responseTime: res.getHeader('X-Response-Time')
    }
  },
  redact: [$1, 'req.headers.cookie', 'res.headers["set-cookie", 'req.headers.cookie', 'res.headers["set-cookie"]', 'req.body.otp', 'req.body.totp', 'req.body.token', 'req.body.secret', 'req.body.session_token']', 'req.body.otp', 'req.body.totp', 'req.body.token', 'req.body.secret', 'req.body.session_token']
}))
import { httpLogger } from './logger'
app.use(httpLogger)

// Rate limiters
const pdfLimiter = rateLimit({ windowMs: 60_000, max: Number(process.env.RATE_LIMIT_PDF||10) })
const testLimiter = rateLimit({ windowMs: 60_000, max: Number(process.env.RATE_LIMIT_TEST||10) })
const reportLimiter = rateLimit({ windowMs: 60_000, max: Number(process.env.RATE_LIMIT_REPORT||5) })
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') || '*' }))
if(process.env.NODE_ENV!=='test') app.use(morgan('combined'))
configureWebPush()
;(async()=>{ try{ await initDb() } catch(e){ logger.warn('[db] init error', e) } })()

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }))
app.use(express.urlencoded({ limit: process.env.FORM_BODY_LIMIT || '1mb', extended: true }))

app.get('/healthz',(req,res)=>res.json({
  try { await prisma.$queryRaw`SELECT 1`; } catch(e){ return res.status(500).json({status:'error', db:'down'}) }ok:true,uptime:process.uptime()}))
const limiter = rateLimit({ windowMs: 60_000, max: 60 })
app.use('/api/verifier', limiter)
app.use('/api/notify', limiter)

app.use('/api/billing', billingRoutes)
app.use('/api/notify', notifyRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/notifications', notificationsSseRoutes)
app.use('/api/notifications', notificationsArchivesRoutes)
app.use('/api', webhooksRoutes)
app.use('/api', reportsRoutes)
app.post('/api/reports/daily/send-now', validateRequest(ReportsDailySendNowRequestSchema), validateRequest(ReportsDailySendNowSchema), reportLimiter, (_req,_res,next)=>next())
app.use('/api/admin', adminGuard, adminDashboardRoutes)
app.use('/api/admin', adminGuard, adminDashboardExportRoutes)
app.use('/api', healthRoutes)

function isPrivateIp(ip){ try{ const p=ip.split('.').map(Number); if(p.length!==4) return false; const [a,b]=p; if(a===10) return true; if(a===127) return true; if(a===192&&b===168) return true; if(a===172&&b>=16&&b<=31) return true; return false }catch{ return false } }

function basicOk(req: unknown){
  const u = process.env.METRICS_BASIC_USER, p = process.env.METRICS_BASIC_PASS
  if(!u || !p) return false
  const auth = (req.headers['authorization']||'').toString()
  if(!auth.startsWith('Basic ')) return false
  const raw = Buffer.from(auth.slice(6),'base64').toString('utf8')
  const [user, pass] = raw.split(':')
  return user===u && pass===p
}

app.get('/api/metrics', async (req,res,next)=>{
  const tokenOk = process.env.METRICS_TOKEN && req.header('x-metrics-token')===process.env.METRICS_TOKEN
  const remote = (req.ip||'').replace('::ffff:','')
  const localOk = remote==='127.0.0.1' || remote==='::1' || isPrivateIp(remote)
  if(!(tokenOk || localOk || basicOk(req))) return res.status(403).send('forbidden')
  res.set('Content-Type', metricsRegister.contentType); res.end(await metricsRegister.metrics())
})

try{ startQueueWorkers() }catch(e){ logger.info('[queue] workers start failed') }

  const expect = process.env.METRICS_TOKEN
  const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress || '').trim()
  const isLocal = ip.startsWith('127.') || ip.startsWith('::1') || ip.startswith('::ffff:127.')
  if(expect){
    if(token !== expect) return res.status(403).json({ error:'forbidden' })
  } else if(!isLocal){
    return res.status(403).json({ error:'forbidden' })
  }
  res.set('Content-Type', metricsRegister.contentType); res.end(await metricsRegister.metrics())
})

app.use('/api/admin', adminGuard, adminDocsRoutes)
app.use('/api/admin', adminGuard, adminSystemLogRoutes)
app.use('/api/admin', adminGuard, adminSLOConfigRoutes)
app.use('/api/admin', adminGuard, adminLogFilesRoutes)
app.use('/api/admin', adminGuard, systemLogsRoutes)
app.use('/api/admin', adminGuard, adminWatchdogRoutes)
app.use('/api/admin', adminDocsAlertingRoutes)
app.use('/api/push', pushRoutes)
app.use('/api/devices', devicesRoutes)
app.use('/api/admin/devices', adminDevices)
app.use('/api/webhooks', webhooksRoutes)

export default app

app.get('/api/admin/dashboard/export-pdf', pdfLimiter, requireRole('admin'), validateQuery(ExportPdfQuerySchema), pdfLimiter, (_req,_res,next)=>next())

app.post('/api/webhooks/:id/test', verifyWebhookSignature(), validateRequest(WebhookTestRequestSchema), validateParams(WebhookIdParamsSchema), validateRequest(WebhookTestRequestSchema), testLimiter, (_req,_res,next)=>next())


// === Integrity public key & ledger endpoints ===
import fs from 'fs'
import path from 'path'
app.get('/api/integrity/public-key', (_req, res)=>{
  try{
    const p = path.join(process.cwd(), 'ops', 'grafana-cloud', 'signing', 'public.pem')
    if(!fs.existsSync(p)) return res.status(404).json({ error: 'public key not found' })
    res.setHeader('Content-Type','text/plain')
    res.send(fs.readFileSync(p, 'utf8'))
  }catch(e){ res.status(500).json({ error: 'failed' }) }
})

app.get('/api/integrity', (_req, res)=>{
  try{
    const ledgerPath = path.join(process.cwd(), 'ops', 'grafana-cloud', 'ledger.json')
    if(!fs.existsSync(ledgerPath)) return res.json([])
    const raw = JSON.parse(fs.readFileSync(ledgerPath,'utf8'))
    const minimal = (raw||[]).map((b: unknown)=> ({
      version: b.version, timestamp: b.timestamp,
      
    }))
    // Rebuild to short hash
    const out: unknown[] = []
    for(const b of raw||[]){
      const h = (b.hash||'')
      out.push({
        version: b.version, timestamp: b.timestamp,
        ledger_hash: h.substring(0,8) if false else (h[0:8] if typeof h==='string' else ''),
        notarized_txid: b.notarized_txid || null,
        status: 'Verified'
      })
    }
    res.json(out)
  }catch(e){ res.status(500).json({ error: 'failed' }) }
})


// Minimal public integrity API (safe fields only)
app.get('/api/integrity', (_req, res) => {
  try{
    const fs = require('fs'); const path = require('path')
    const ledgerPath = path.join(process.cwd(), 'ops', 'grafana-cloud', 'ledger.json')
    if(!fs.existsSync(ledgerPath)) return res.json([])
    const blocks = JSON.parse(fs.readFileSync(ledgerPath,'utf8')||'[]')
    const out = (blocks||[]).map((b: unknown)=> ({
      version: b.version,
      timestamp: b.timestamp,
      ledger_hash: typeof b.hash==='string' ? b.hash.substring(0,8) : '',
      notarized_txid: b.notarized_txid || null,
      status: 'Verified'
    }))
    res.json(out)
  }catch(e: unknown){
    res.status(500).json({ error: e?.message || 'failed' })
  }
})


// Logs API — reads from ./logs/*.log (mounted), supports level/q/since/until filters
import fs from 'fs'
import path from 'path'

function parseLine(line){
  // naive parse: [2025-01-01T00:00:00Z] [LEVEL] message
  const m = line.match(/^\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.*)$/)
  if(!m) return null
  return { ts: m[1], level: m[2], msg: m[3] }
}

function filterRows(rows, q, level, since, until){
  return rows.filter(r=>{
    if(level && r.level !== level) return false
    if(q && !r.msg.toLowerCase().includes(q.toLowerCase())) return false
    if(since && new Date(r.ts) < new Date(since)) return false
    if(until && new Date(r.ts) > new Date(until)) return false
    return true
  })
}

app.get('/api/logs', validateRequest({ query: logsQuerySchema }, (_req: unknown, res: unknown)=>{
  try{
    const q = _req.query.q || ''
    const level = _req.query.level || ''
    const since = _req.query.since || ''
    const until = _req.query.until || ''
    const dir = path.join(process.cwd(), 'logs')
    let rows: unknown[] = []
    if(fs.existsSync(dir)){
      const files = fs.readdirSync(dir).filter(f=>f.endsWith('.log'))
      for(const f of files){
        const data = fs.readFileSync(path.join(dir,f),'utf8').split('\n').slice(-2000)
        for(const line of data){
          const r = parseLine(line)
          if(r) rows.push(r)
        }
      }
    }
    rows = filterRows(rows, q, level, since, until)
    res.json(rows.slice(-500))
  }catch(e: unknown){
    res.status(500).json({ error: e?.message || 'failed' })
  }
})
)

app.get('/api/logs/export.csv', validateRequest({ query: logsQuerySchema }, (_req: unknown, res: unknown)=>{
  try{
    const q = _req.query.q || ''
    const level = _req.query.level || ''
    const since = _req.query.since || ''
    const until = _req.query.until || ''
    const dir = path.join(process.cwd(), 'logs')
    let rows: unknown[] = []
    if(fs.existsSync(dir)){
      const files = fs.readdirSync(dir).filter(f=>f.endsWith('.log'))
      for(const f of files){
        const data = fs.readFileSync(path.join(dir,f),'utf8').split('\n')
        for(const line of data){
          const r = parseLine(line)
          if(r) rows.push(r)
        }
      }
    }
    rows = filterRows(rows, q, level, since, until)
    const header = 'timestamp,level,message\n'
    const body = rows.map(r=>`"${r.ts}","${r.level}","${(r.msg||'').replace(/"/g,'""')}"`).join('\n')
    res.setHeader('Content-Type','text/csv')
    res.setHeader('Content-Disposition','attachment; filename="logs-export.csv"')
    res.send(header+body)
  }catch(e: unknown){
    res.status(500).json({ error: e?.message || 'failed' })
  }
})

app.use(sentryErrorHandler());
app.use(errorHandler)


app.use('/api', (req: unknown, res: unknown) => {
  const rid = (req as unknown).requestId || null
  res.status(404).json({ error: 'Not found', path: req.path, traceId: rid })
})

// Graceful shutdown hooks
process.on('SIGTERM', ()=>{ logger.info('SIGTERM received'); setTimeout(()=>process.exit(0), 500).unref() })
process.on('SIGINT', ()=>{ logger.info('SIGINT received'); setTimeout(()=>process.exit(0), 500).unref() })

process.on('unhandledRejection', (reason: unknown)=>{ try{ logger.error('[UNHANDLED_REJECTION]', reason) }catch{} })
process.on('uncaughtException', (err: unknown)=>{ try{ logger.error('[UNCAUGHT_EXCEPTION]', err) }catch{} })

app.get('/.well-known/security.txt', (_req: unknown,res: unknown)=>{
  res.type('text/plain').send(
`Contact: ${process.env.SECURITY_CONTACT || 'mailto:security@example.com'}
Policy: ${process.env.SECURITY_POLICY_URL || 'https://example.com/security'}
Preferred-Languages: en,hr
`)
})

app.get('/api/openapi.yaml', (_req: unknown, res: unknown)=>{
  const fs = require('fs')
  const path = require('path')
  const p = path.join(process.cwd(), 'ops', 'openapi.yaml')
  res.type('application/yaml')
  res.send(fs.readFileSync(p,'utf8'))
})

app.get('/robots.txt', (_req: unknown,res: unknown)=>{ const allow = (process.env.ROBOTS_INDEX||'false').toLowerCase()==='true'; res.type('text/plain').send(allow?"User-agent: *\nAllow: /":"User-agent: *\nDisallow: /") })

app.get('/api/docs', basicAuthGuard(process.env.DOCS_BASIC_AUTH), (req: unknown,res: unknown,next: unknown)=>{ if((process.env.ENABLE_API_DOCS||'true').toLowerCase()!=='true') return res.status(404).end(); next() },, (_req: unknown,res: unknown)=>{
  const fs = require('fs'); const path = require('path')
  const p = path.join(process.cwd(), 'ops', 'swagger.html')
  res.type('text/html').send(fs.readFileSync(p,'utf8'))
})

// Attempt graceful close when possible
let _server: unknown = null
try {
  const http = require('http')
  // If your actual listen is elsewhere, export `server` to use this stopper.
  if (!globalThis.__SOULSYNC_SERVER__) {
    // noop here, real server instantiation may be in another file
  } else {
    _server = globalThis.__SOULSYNC_SERVER__
  }
} catch {}
process.on('SIGTERM', ()=>{ try{ _server?.close?.(()=>process.exit(0)) }catch{ process.exit(0) } })

// Test-only endpoint to verify Sentry & error handling (enable via ENABLE_TEST_ENDPOINTS=true)
app.get('/api/_test-error', testErrorLimiter, (req: unknown,res: unknown)=>{
  const on = (process.env.ENABLE_TEST_ENDPOINTS||'false').toLowerCase()==='true'
  if(!on) return res.status(404).json({ error: 'Not found' })
  throw new Error('Intentional test error for Sentry')
})

app.get('/api/status', async (_req: unknown,res: unknown)=>{
  try{
    const fs = require('fs'); const path = require('path')
    const pkgPath = path.join(process.cwd(), 'backend', 'package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath,'utf8'))
    res.json({
      ok: true,
      version: pkg.version || '0.0.0',
      git: process.env.GIT_SHA || null,
      uptime: Math.round(process.uptime()),
      now: new Date().toISOString()
    })
  }catch(e){ res.status(500).json({ ok:false, error:'status failed' })}
})

// Tune Node server timeouts
try {
  const s = (globalThis as unknown).__SOULSYNC_SERVER__
  if (s) {
    const toNum = (x: unknown, def:number)=>{ const n=Number(x); return Number.isFinite(n)&&n>0?n:def }
    s.keepAliveTimeout = toNum(process.env.SERVER_KEEPALIVE_TIMEOUT_MS, 60000)
    s.headersTimeout   = toNum(process.env.SERVER_HEADERS_TIMEOUT_MS,   65000)
    s.requestTimeout   = toNum(process.env.SERVER_REQUEST_TIMEOUT_MS,  120000)
  }
} catch {}

function __startDrain(signal:string){
  try{
    ;(globalThis as unknown).__SOULSYNC_DRAINING__ = true
    const ms = Number(process.env.DRAIN_TIMEOUT_MS || '15000')
    setTimeout(()=>{
      try{ (globalThis as unknown).__SOULSYNC_SERVER__?.close?.(()=>process.exit(0)) }catch{ process.exit(0) }
    }, Math.max(1000, ms))
  }catch{}
}
try{
  process.removeAllListeners?.('SIGTERM')
  process.on('SIGTERM', ()=>__startDrain('SIGTERM'))
  process.removeAllListeners?.('SIGINT')
  process.on('SIGINT',  ()=>__startDrain('SIGINT'))
}catch{}

try {
  const s = (globalThis as unknown).__SOULSYNC_SERVER__
  const mhc = Number(process.env.SERVER_MAX_HEADERS_COUNT || '0')
  if (s && mhc > 0 && Number.isFinite(mhc)) { try { s.maxHeadersCount = mhc } catch {} }
} catch {}

// Fallback 404 for /api (JSON)
try {
  app.use('/api', (req: unknown,res: unknown,next: unknown)=>{
  try{ res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive') }catch{}
  // Optional: accept inbound X-Request-Id (sanitized) for correlation
  try{
    if ((process.env.ACCEPT_CLIENT_REQUEST_ID||'false').toLowerCase()==='true'){
      const inc = (req.headers['x-request-id']||'').toString()
      if (inc){
        const clean = inc.replace(/[^a-zA-Z0-9_\-:.]/g,'').slice(0,128) || ''
        if (clean){ try{ res.setHeader('X-Request-Id', clean) }catch{}; try{ (req as unknown).requestId = clean }catch{} }
      }
    }
  }catch{}

  try{ if((process.env.EXPOSE_CLIENT_IP||'false').toLowerCase()==='true'){ const ip = (req.headers['x-real-ip']||req.ip||'').toString(); if(ip) res.setHeader('X-Client-IP', ip) } }catch{}
  // options fast path
  if (req.method==='OPTIONS'){ try{ res.setHeader('Vary','Origin, Access-Control-Request-Method, Access-Control-Request-Headers') }catch{}; return res.status(204).end(); }
  try{
    const _origJson = res.json.bind(res)
    res.json = (body: unknown)=>{
      try{
        const replacer = ((process.env.JSON_BIGINT_STRINGS||'false').toLowerCase()==='true') ? (k: unknown,v: unknown)=> (typeof v==='bigint'? String(v): v) : undefined
        const s = JSON.stringify(body, replacer)
        try{ res.setHeader('X-Response-Size', String(Buffer.byteLength(s,'utf8'))) }catch{}
        const max = Number(process.env.RESPONSE_JSON_MAX_BYTES||'0')
        if (Number.isFinite(max) && max>0 && Buffer.byteLength(s,'utf8')>max){
          const rid = (req as unknown)?.requestId || res.getHeader('X-Request-Id') || null
          res.status(500)
          return _origJson({ error:'response_too_large', requestId: rid })
        }
        return _origJson(body)
      }catch{ return _origJson(body) }
    }
  }catch{}

  try{
    if((process.env.STRICT_CONTENT_TYPE||'false').toLowerCase()==='true'){
      const m = req.method.toUpperCase();
      if(['POST','PUT','PATCH','DELETE'].includes(m)){
        const ct = String(req.headers['content-type']||'').toLowerCase().split(';')[0].trim()
        const allowed = String(process.env.ALLOWED_CONTENT_TYPES||'').split(',').map((s)=>s.trim().toLowerCase()).filter(Boolean)
        const ok = !ct || allowed.some(a=> a==='*/*' || a===ct || (a.endsWith('/*') && ct.startsWith(a.slice(0,-1))))
        if(!ok){
          const rid = (req as unknown)?.requestId || res.getHeader('X-Request-Id') || null
          res.type('application/problem+json')
          return res.status(415).json({ type:'about:blank', title:'Unsupported Media Type', status:415, requestId: rid })
        }
      }
    }
  }catch{}

  try{
    const dep = (process.env.DEPRECATION || '').trim()
    const sun = (process.env.SUNSET || '').trim()
    const link = (process.env.DEPRECATION_LINK || '').trim()
    if (dep) res.setHeader('Deprecation', dep)
    if (sun) res.setHeader('Sunset', sun)
    if (link) res.setHeader('Link', `<${link}>; rel="deprecation"`)
  }catch{}

    if (res.headersSent) return next()
    const rid = (req as unknown)?.requestId || res.getHeader('X-Request-Id') || null
    return res.status(404).json({ error:'not_found', requestId: rid })
  })
} catch {}
import { problemDetails } from './middleware/problemDetails'
app.use(problemDetails as unknown)

// Redoc viewer for OpenAPI
app.get('/api/redoc', (_req, res) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>SoulSync API – Redoc</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</head>
<body>
  <redoc spec-url="/api/openapi.json"></redoc>
</body>
</html>`
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
})

app.get('/metrics', metricsHandler)

// Sentry error handler should be last
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler())
}


/** Global error handler */
app.use((err:any, _req:any, res:any, _next:any)=>{
  const code = err.status || 500
  const msg = process.env.NODE_ENV==='production' ? 'Internal Server Error' : (err.message||String(err))
  res.status(code).json({ error: msg })
})

// Global error handler (keep last)
app.use(errorHandler())


/** 405 for known paths with wrong method (best-effort) */
const knownPaths = new Set(Object.keys((require('./../openapi/openapi.json')||{}).paths||{}))
app.use((req:Request,res:Response,next:NextFunction)=>{
  try{
    // if path matches any known path ignoring path params brackets
    const p = req.path
    const match = Array.from(knownPaths).some(k=>{
      // convert openapi path /a/{id}/b -> regex
      const rx = new RegExp('^'+k.replace(/\{[^}]+\}/g,'[^/]+')+'$')
      return rx.test(p)
    })
    if (match){
      // if match but router didn't handle, method likely not allowed
      return res.status(405).json({ error:'method_not_allowed' })
    }
  }catch{}
  next()
})
