import { useEffect, useState } from 'react'
export default function Profile() {
  const [lang, setLang] = useState('en')
  useEffect(() => { const l = localStorage.getItem('lang'); if (l) setLang(l) }, [])
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">{lang==='en'?'👤 User Profile':'👤 Korisnički profil'}</h1>
      <p>{lang==='en'?'This is a placeholder page for the user profile. Add user info and settings here.':'Ovo je placeholder stranica za korisnički profil. Ovdje dodaj korisničke podatke i postavke.'}</p>
    </div>
  )
}