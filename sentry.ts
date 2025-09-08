import * as Sentry from '@sentry/node'
import { ProfilingIntegration } from '@sentry/profiling-node'
import type { Request, Response, NextFunction } from 'express'

export function initSentry(app: any){
  const dsn = process.env.SENTRY_DSN
  if(!dsn) return
  Sentry.init({
    dsn,
    tracesSampleRate: 0.2,
    profilesSampleRate: 0.2,
    integrations: [new ProfilingIntegration()],
    environment: process.env.NODE_ENV || 'development',
  })
  app.use(Sentry.Handlers.requestHandler())
  app.use(Sentry.Handlers.tracingHandler())
}

export function sentryErrorHandler(){
  const dsn = process.env.SENTRY_DSN
  if(!dsn) return (_err: any, _req: Request, _res: Response, next: NextFunction)=>next()
  return Sentry.Handlers.errorHandler()
}

export function captureError(err: any){
  if(process.env.SENTRY_DSN){
    Sentry.captureException(err)
  }
}
