
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: 0.2,
    environment: import.meta.env.MODE || 'development',
  })
}

import * as Sentry from '@sentry/react'
import ErrorBoundary from './components/ErrorBoundary'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    const qc = new QueryClient()

<BrowserRouter>
      <QueryClientProvider client={qc}><ErrorBoundary><App /></ErrorBoundary></QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)
