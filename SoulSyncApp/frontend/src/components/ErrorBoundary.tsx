import { Component, ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    // Optional: forward to Sentry if available
    if ((window as any).Sentry) {
      ;(window as any).Sentry.captureException(error)
    } else {
      import { logger } from '../utils/logger'
    logger.error(error)
    }
  }

  render() {
    if (this.state.hasError) {
      return <div style={{ padding: 24 }}>Nešto je pošlo po zlu. Pokušajte ponovno.</div>
    }
    return this.props.children
  }
}
