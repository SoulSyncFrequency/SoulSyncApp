import { useEffect, useState } from 'react'
export default function Home() {
  const [lang, setLang] = useState('en')
  useEffect(() => { const l = localStorage.getItem('lang'); if (l) setLang(l) }, [])
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">{lang === 'en' ? '🏠 Welcome to SoulSync' : '🏠 Dobrodošli u SoulSync'}</h1>
      <p>{lang === 'en' ? 'This is the home page of the app. Use the navigation menu to explore features.' : 'Ovo je početna stranica aplikacije. Koristi navigacijski meni za istraživanje značajki.'}</p>
    </div>
  )
}