import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import type { Application } from 'express'

export function initSentry(app: Application){
  const dsn = process.env.SENTRY_DSN
  if(!dsn) return
  Sentry.init({
    dsn,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
    profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE || 0.05),
    environment: process.env.NODE_ENV || 'development',
  })
  app.use(Sentry.Handlers.requestHandler() as any)
  app.use(Sentry.Handlers.tracingHandler() as any)
}

export function sentryErrorHandler(){
  return (Sentry.Handlers.errorHandler() as any)
}
