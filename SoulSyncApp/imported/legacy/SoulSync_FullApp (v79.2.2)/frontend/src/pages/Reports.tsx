import { useEffect, useState } from 'react'
export default function Reports() {
  const [lang, setLang] = useState('en')
  useEffect(() => { const l = localStorage.getItem('lang'); if (l) setLang(l) }, [])
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">{lang==='en'?'📊 Reports':'📊 Izvještaji'}</h1>
      <p>{lang==='en'?'This is a placeholder page for reports and analytics. Add charts and exports here.':'Ovo je placeholder stranica za izvještaje i analitiku. Ovdje dodaj grafikone i exporte.'}</p>
    </div>
  )
}