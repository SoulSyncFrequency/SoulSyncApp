export const logger = {
  info: (...args: any[]) => {
    if (import.meta.env.MODE !== 'production') console.info(...args)
  },
  warn: (...args: any[]) => {
    if (import.meta.env.MODE !== 'production') console.warn(...args)
    if ((window as any).Sentry) (window as any).Sentry.captureMessage(String(args[0]), 'warning')
  },
  error: (...args: any[]) => {
    console.error(...args)
    if ((window as any).Sentry) (window as any).Sentry.captureException(args[0])
  }
}
