import f0Routes from './routes/f0'
import express from 'express'
import { requestId } from './middleware/requestId'
import { hsts } from './middleware/hsts'
import { coopCoep } from './middleware/coopCoep'
import { requestLogger } from './middleware/requestLogger'
import { auditLogger } from './middleware/auditLogger'
import { requestIdEnsure } from './middleware/requestIdEnsure'
import { perRouteRateLimit } from './middleware/perRouteRateLimit'
import { slowRequest } from './middleware/slowRequest'
import { metricsRouteHistogram } from './middleware/metricsRouteHistogram'
import { corsConfigured } from './middleware/cors'
import { globalLimiter, rateLimitPolicyHeader } from './middleware/rateLimit'
import { applySecurity } from './middleware/security'
import { nonceAttach, nonceCspHeader } from './middleware/nonce'
import { metricsMiddleware, metricsHandler } from './metrics'
import openapiRoute from './routes/openapi'
import cspReportRoute from './routes/cspReport'
import adminSecretsRoute from './routes/adminSecrets'
import twofaRoute from './routes/twofa'
import readyRoute from './routes/ready'
import liveRoute from './routes/livez'
import versionRoute from './routes/version'
import aiRoute from './routes/ai'
import aiExtrasRoute from './routes/aiExtras.routes'
import mfaRoute from './routes/mfa.routes'
import aiSchemaRoute from './routes/aiSchema.routes'
import adminPolicyRoute from './routes/admin.policy.routes'
import aiGuardedRoute from './routes/aiGuarded.routes'
import cspReportRoute2 from './routes/cspReport.routes'
import { redactPIIMiddleware } from './middleware/redactPII.middleware'
import stripeWebhookRoute from './routes/stripeWebhook.routes'
import consentVersionRoute from './routes/consentVersion.routes'
import policyRoute from './routes/policy.routes'
import tenantsRoute from './routes/tenants.routes'
import metricsRoute, { mwCount, mwCountRoute, mwLatency } from './routes/metrics.routes'
import ragRoute from './routes/rag.routes'
import therapyDraftsRoute from './routes/therapyDrafts.routes'
import mfaTotpRoute from './routes/mfa.totp.routes'
import webauthnRoute from './routes/webauthn.routes'
import billingSecureRoute from './routes/billing.secure.routes'
import historyExportRoute from './routes/historyExport.routes'
import gdprRoute from './routes/gdpr.routes'
import authRefreshRoute from './routes/authRefresh'
import authBasicRoute from './routes/authBasic'
import meRoute from './routes/me'
import csrfRoute from './routes/csrf'
import apiKeyPingRoute from './routes/apiKeyPing'
import adminQueuesRoute from './routes/adminQueues'
import { initSentry, sentryErrorHandler } from './middleware/sentry'
import { errorHandler } from './middleware/errorHandler'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { noCache } from './middleware/noCache'
import * as Sentry from '@sentry/node'
import compression from 'compression'

const app = express()
app.use(rateLimitHeaders())
app.use(secHeaders())
app.use(csp())
app.use(adminAuditTrail())
app.use(collectTail())
app.use(safeModeGuard())
app.use(permissionsPolicy())
app.use(crossOriginIsolation())
app.use(preflightCache())
app.use(maintenanceGuard())
app.use(addVaryOrigin())
app.use(slowLog())
app.use(compressionSafe())
app.use(requestId())
app.use('/api', diagnosticsRoutes)
app.use('/api/admin/diagnostics/upload', redisRateLimit(3,60))
app.use('/api', opsRoutes)
app.use('/api', heapRoutes)
app.use('/api', logsRoutes)
app.use('/api/admin/audit/exportSelectedUpload', redisRateLimit(4,60))
app.use('/api/admin/audit/exportUpload', redisRateLimit(4,60))
app.use('/api/admin/reports/upload', redisRateLimit(4,60))
app.use('/api/admin/heapdump', redisRateLimit(2,60))
app.use('/api', policyRoutes)
app.use('/api', whoRoutes)
app.use('/api', s3Routes)
app.use('/api/admin/s3/signPost', redisRateLimit(8,60))
app.use('/api/admin/s3/signPut', redisRateLimit(12,60))
app.use('/api/admin/s3/sign', redisRateLimit(12,60))
app.use('/api', sloRoutes)
app.use('/api', docsRoutes)
app.use('/api', securityRoutes)
try{ const pino = require('pino-http')({ prettyPrint: process.env.LOG_PRETTY==='1' }); app.use(pino()) }catch{}
app.use(hsts())
app.use('/', wellknownRoutes)
app.use('/admin/app', require('express').static(require('path').join(process.cwd(),'public','admin-app')))
app.use(metricsHttp())
app.use(httpsEnforce())
app.use(hpp())
app.use('/api', redocRoutes)
app.use('/api', versionRoutes)
app.use('/api', reportsRoutes)
app.use('/api', ratePolicyRoutes)
app.use('/api', flagsRoutes)
app.use('/api', downloadRoutes)
app.use('/api/admin', ipAllowlist())
app.use('/api', statsRoutes)
app.use('/api/admin/stats/export', redisRateLimit(12,60))
app.use('/api/admin/audit/exportSelected.tgz', redisRateLimit(8,60))
app.use('/api/admin/audit/export.tgz', redisRateLimit(8,60))
app.disable('x-powered-by')
app.use(responseTime)
app.use('/api', infoRoutes)
app.use('/api/f0score', redisRateLimit(30,60))
app.use('/api/admin/datasheet/pdf', redisRateLimit(6,60))
app.use('/api/admin/suggestions/apply', redisRateLimit(10,60))
app.set('trust proxy', true)
app.use('/api', suggestionsRoutes)
app.use('/api', datasheetRoutes)
app.use('/api', openapiRoutes)
app.use('/api', swaggerRoutes)
app.use('/api', healthRoutes)
app.use('/api', metricsRoutes)
app.use('/api/metrics', redisRateLimit(5,60))


app.use(sanitizeBody())
app.use(express.json({ limit: process.env.JSON_LIMIT || '1mb' }));// Sentry init
app.use('/api', f0Routes);
if (process.env.SENTRY_DSN){
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0), release: process.env.SENTRY_RELEASE })
  app.use(Sentry.Handlers.requestHandler())
  if (process.env.SENTRY_DSN){ app.use(Sentry.Handlers.tracingHandler()) }
  // attach user context if available
  app.use((req, _res, next) => { try { const u = (req as any).user; if (u) { Sentry.setUser({ id: String(u.id||u.sub||''), email: (u.email||'') }); } } catch {} next(); })
}


// Body parsers with sane defaults
app.use(cspReportRoute)
app.use(cspReportRoute2)
app.use(stripeWebhookRoute)
app.use(sanitizeBody())
app.use(express.json({ limit: process.env.MAX_JSON_SIZE || '1mb' }))
app.use(express.urlencoded({ extended: true }))
// Compression for responses
app.use(compression())

// Observability / security
initSentry(app)
applySecurity(app)
app.use(requestId)
app.use(requestIdEnsure)
app.use(requestLogger)
app.use(perRouteRateLimit)
app.use(slowRequest)
app.use(metricsRouteHistogram)
app.use(redactPIIMiddleware)
app.use(auditLogger)
app.use(corsConfigured())
app.use(rateLimitPolicyHeader)
app.use(globalLimiter)
app.use(cookieParser())
app.use(helmet())
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'","'unsafe-inline'"],
    styleSrc: ["'self'","'unsafe-inline'"],
    imgSrc: ["'self'","data:"]
  }
}))
app.use(noCache)
if (process.env.NODE_ENV === 'production'){
  app.use(helmet.hsts())
}
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }))
app.use(metricsMiddleware)

// Health & readiness
app.get('/healthz', (_req, res) => res.json({ status: 'ok' }))
app.use(readyRoute)
app.use(liveRoute)
app.use(versionRoute)
app.use(aiRoute)
app.use(gdprRoute)
app.use(historyExportRoute)
app.use(aiExtrasRoute)
app.use(mfaRoute)
app.use(aiSchemaRoute)
app.use(adminPolicyRoute)
app.use(aiGuardedRoute)
app.use(billingSecureRoute)
app.use(require('./routes/recommendations').default)
app.use(require('./routes/summary').default)
app.use(require('./routes/intent').default)
app.use(authRefreshRoute)
app.use(authBasicRoute)
app.use(meRoute)
app.use(csrfRoute)
app.use(apiKeyPingRoute)
app.use(adminQueuesRoute)

// API docs
app.use(openapiRoute)
// CSP report receiver & admin viewers
app.use(consentVersionRoute)
app.use(policyRoute)
app.use(tenantsRoute)
app.use(ragRoute)
app.use(requireMfa, therapyDraftsRoute)
app.use(mfaTotpRoute)
app.use(webauthnRoute)
app.use(adminSecretsRoute)
// 2FA (feature-flagged in route)
app.use(twofaRoute)

// Metrics
app.get('/metrics', metricsHandler)

// Error handlers (Sentry first, then app)
app.use(sentryErrorHandler())
if (process.env.SENTRY_DSN){ app.use(Sentry.Handlers.errorHandler() as any) }
app.use(errorHandler)

export default app

app.get('/readyz', (_req,res)=> res.json({ ok:true, ready:true }));
app.get('/livez', (_req,res)=> res.json({ ok:true, live:true }));
// Static admin tools
app.use('/admin/tools', require('express').static(require('path').join(process.cwd(), 'public', 'admin-tools')))
