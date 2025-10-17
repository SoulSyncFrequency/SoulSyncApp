import { useState, useEffect } from 'react'

export type Consent = {
  analytics: boolean
  timestamp: number
}

const EXPIRY_MS = 1000 * 60 * 60 * 24 * 30 * 6 // 6 months

export default function useCookieConsent() {
  const [consent, setConsentState] = useState<Consent | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('cookieConsent')
    if (raw) {
      try {
        const parsed: Consent = JSON.parse(raw)
        const expired = Date.now() - parsed.timestamp > EXPIRY_MS
        if (!expired) {
          setConsentState(parsed)
          return
        }
      } catch {}
    }
    setConsentState(null)
  }, [])

  const setConsent = (analytics: boolean) => {
    const c = { analytics, timestamp: Date.now() }
    localStorage.setItem('cookieConsent', JSON.stringify(c))
    setConsentState(c)
  }

  const resetConsent = () => {
    localStorage.removeItem('cookieConsent')
    setConsentState(null)
  }

  return { consent, setConsent, resetConsent }
}
