import { useEffect, useState } from 'react'

export type Lang = 'en' | 'hr'

export default function useI18n() {
  const [lang, setLang] = useState<Lang>('en')

  useEffect(() => {
    const saved = localStorage.getItem('cookieBannerLang') as Lang | null
    if (saved) return setLang(saved)
    const nav = (navigator.language || '').toLowerCase()
    setLang(nav.startsWith('hr') ? 'hr' : 'en')
  }, [])

  const change = (l: Lang) => {
    setLang(l)
    localStorage.setItem('cookieBannerLang', l)
  }

  return { lang, setLang: change }
}
