const DSN = import.meta.env.VITE_SENTRY_DSN || 'https://examplePublicKey@o0.ingest.sentry.io/0'
const ENABLE_REPLAY = (import.meta.env.VITE_SENTRY_REPLAY || 'false') === 'true'
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/react'
import { Replay } from '@sentry/replay'

if (DSN && !DSN.includes('examplePublicKey')) Sentry.init({
  dsn: DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'staging',
  release: import.meta.env.VITE_SENTRY_RELEASE || 'v101.5.7',
  integrations: ENABLE_REPLAY ? [new BrowserTracing(), new Replay()] : [new BrowserTracing()],
  tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.5'),
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
