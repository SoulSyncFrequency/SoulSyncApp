import * as Sentry from '@sentry/node'
import * as Tracing from '@sentry/profiling-node'
import { config } from './config'

const DSN = process.env.SENTRY_DSN || 'https://examplePublicKey@o0.ingest.sentry.io/0'
const skipInit = !DSN || DSN.includes('examplePublicKey')
if (!skipInit) Sentry.init({
  dsn: process.env.SENTRY_DSN || 'https://examplePublicKey@o0.ingest.sentry.io/0',
  environment: process.env.SENTRY_ENVIRONMENT || 'staging',
  release: process.env.SENTRY_RELEASE || 'v101.5.7',
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.ProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 0.5,
  beforeSend(event) {
    if (event.request) {
      if (event.request.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['cookie']
      }
      if (event.request.url) {
        try {
          const u = new URL(event.request.url)
          u.searchParams.forEach((_, key) => {
            if (/token|key|password/i.test(key)) u.searchParams.set(key, '***')
          })
          event.request.url = u.toString()
        } catch {}
      }
    }
    return event
  },
  sendDefaultPii: false,
  tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE) : 0.5,
  profilesSampleRate: process.env.SENTRY_PROFILES_SAMPLE_RATE ? Number(process.env.SENTRY_PROFILES_SAMPLE_RATE) : 0.2,
})

export { Sentry }


try {
  process.on('unhandledRejection', (err: unknown)=>{ try{ Sentry.captureException(err) }catch{} })
  process.on('uncaughtException', (err: unknown)=>{ try{ Sentry.captureException(err) }catch{} })
} catch {}


try {
  process.on('warning', (w: unknown)=>{
    try { Sentry.addBreadcrumb({ level: 'warning', category: 'process', message: String(w?.name||'Warning') + ': ' + String(w?.message||'') }) } catch {}
  })
} catch {}
