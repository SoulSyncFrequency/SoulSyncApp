import React, { useEffect, useState } from 'react'

export default function Profile(){
  const [name,setName] = useState('')
  const [email,setEmail] = useState('')
  const [avatar,setAvatar] = useState('😀')
  const [usage,setUsage] = useState<{[k:string]:number}>({})

  useEffect(()=>{
    const saved = localStorage.getItem('profile')
    if(saved){
      const p = JSON.parse(saved)
      setName(p.name||'')
      setEmail(p.email||'')
      setAvatar(p.avatar||'😀')
    }
    const u = localStorage.getItem('usage')
    if(u) setUsage(JSON.parse(u))
  },[])

  function saveProfile(){
    localStorage.setItem('profile', JSON.stringify({name,email,avatar}))
    alert('Profil spremljen!')
  }

  function deleteProfile(){
    localStorage.removeItem('profile')
    localStorage.removeItem('usage')
    setName('')
    setEmail('')
    setAvatar('😀')
    setUsage({})
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">👤 Profil</h1>

      <div className="mb-6 border dark:border-gray-700 rounded-xl p-4">
        <h2 className="font-semibold mb-2">🪪 Osnovni podaci</h2>
        <div className="mb-3 text-4xl">{avatar}</div>
        <input value={avatar} onChange={e=>setAvatar(e.target.value)} className="border dark:border-gray-700 rounded p-2 w-full mb-3" placeholder="Avatar emoji" />
        <input value={name} onChange={e=>setName(e.target.value)} className="border dark:border-gray-700 rounded p-2 w-full mb-3" placeholder="Ime" />
        <input value={email} onChange={e=>setEmail(e.target.value)} className="border dark:border-gray-700 rounded p-2 w-full mb-3" placeholder="E-mail (neobavezno)" />
        <button onClick={saveProfile} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">Spremi</button>
      </div>

      <div className="mb-6 border dark:border-gray-700 rounded-xl p-4">
        <h2 className="font-semibold mb-2">📈 Statistika korištenja</h2>
        <div className="text-sm space-y-1">
          <div>📝 Direct input: {usage.direct||0}</div>
          <div>📋 Questionnaire: {usage.questionnaire||0}</div>
          <div>🧪 Verifier: {usage.verifier||0}</div>
        </div>
      </div>

      <div className="mb-6 border dark:border-gray-700 rounded-xl p-4">
        <h2 className="font-semibold mb-2">🗑️ Brisanje profila</h2>
        <button onClick={deleteProfile} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">Izbriši profil</button>
      </div>
    </div>
  )
}
