import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiBase } from '../lib/auth'
export default function Settings() {
  const navigate = useNavigate()
  const [dark, setDark] = useState(false)
  const [lang, setLang] = useState('en')
  const [flags, setFlags] = useState<string[]>([])
  const loadFlags = ()=> fetch('/api/flags').then(r=>r.json()).then(d=>setFlags(d.flags||[])).catch(()=>{})
  useEffect(()=>{ loadFlags() },[])


  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) setDark(savedTheme === 'dark')
    else setDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
    const savedLang = localStorage.getItem('lang')
    if (savedLang) setLang(savedLang)
  }, [])

  useEffect(() => {
    if (dark) { document.documentElement.classList.add('dark'); localStorage.setItem('theme','dark') }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme','light') }
  }, [dark])

  useEffect(() => { localStorage.setItem('lang', lang) }, [lang])

  const openLegal = () => window.open('/legal/index.html','_blank')

  const [email, setEmail] = useState<string>('')
useEffect(()=>{ const t=localStorage.getItem('token'); if(!t) return; fetch(`${apiBase()}/api/auth/me`,{ headers:{ Authorization:`Bearer ${t}`}}).then(r=>r.json()).then(d=>{ if(d?.ok&&d?.user?.email) setEmail(d.user.email) }).catch(()=>{}); },[])
return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">{lang === 'en' ? 'Settings' : 'Postavke'}</h1>
      {email && <p className="text-sm opacity-80">Logged in as: {email}</p>}
      <button onClick={()=>{ localStorage.removeItem('token'); window.location.href='/login' }} className="mt-2 text-sm underline">Logout</button>
      <ul className="space-y-3">
        <li><button onClick={openLegal} className="text-blue-600 underline">📜 {lang === 'en' ? 'Legal Information' : 'Pravne informacije'}</button></li>
        <li><button onClick={() => navigate('/about')} className="text-blue-600 underline">ℹ️ {lang === 'en' ? 'About' : 'O aplikaciji'}</button></li>
        <li><button onClick={() => setDark(!dark)} className="text-blue-600 underline">
          {dark ? (lang==='en'?'☀️ Switch to Light Mode':'☀️ Prebaci na svijetli način') : (lang==='en'?'🌙 Switch to Dark Mode':'🌙 Prebaci na tamni način')}
        </button></li>
        <li><button onClick={() => setLang(lang==='en'?'hr':'en')} className="text-blue-600 underline">
          {lang==='en'?'🌐 Change to Croatian':'🌐 Promijeni na engleski'}
        </button></li>
      </ul>
    
      <div className="mt-4">
        <h2 className="text-lg font-semibold">Active feature flags</h2>
        <ul className="list-disc ml-6">
          {flags.map(f=>(<li key={f}>{f}</li>))}
        </ul>
        <button onClick={loadFlags} className="mt-2 text-sm underline">Refresh Flags</button>
      </div>
</div>
  )
}

export function runDiagnostics(){
  const base = (window as any).location.origin
  return Promise.allSettled([
    fetch('/api/health').then(r=>r.text()),
    fetch('/api/readyz').then(r=>r.text()),
    fetch('/api/livez').then(r=>r.text())
  ])
}
