import * as Sentry from '@sentry/react'

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (dsn) {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      release: import.meta.env.VITE_RELEASE || undefined,
    })
  }
}

export function setSentryUser(user?: { id?: string; email?: string } | null) {
  if (user) Sentry.setUser(user as any)
  else Sentry.setUser(null)
}
