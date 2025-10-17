import React, { useEffect, useState } from 'react'
import { apiFetch } from '../../utils/net'

export default function Flags(){
  const [jsonText, setJsonText] = useState('')
  const [msg, setMsg] = useState('')
  useEffect(()=>{ (async()=>{
    const r = await apiFetch('/admin/policy', { method:'GET' })
    const j = await r.json()
    setJsonText(JSON.stringify(j.policy || {}, null, 2))
  })() },[])
  async function save(){
    try{
      const value = JSON.parse(jsonText)
      const r = await apiFetch('/admin/policy', { method:'PUT', body: value })
      setMsg(r.ok ? 'Spremljeno' : 'OK')
    }catch(e:any){ setMsg('Greška: ' + (e?.message||e)) }
  }
  return <div className="p-6 space-y-4">
    <h1 className="text-2xl font-bold">Feature Flags (per-tenant)</h1>
    <p className="text-sm text-muted-foreground">Uredi JSON za <code>policy.value</code> (npr. {{ "flags": {{ "betaFeature": true }} }} ).</p>
    <textarea className="w-full h-64 border rounded p-2 font-mono text-sm" value={jsonText} onChange={e=>setJsonText(e.target.value)} />
    <div className="flex gap-2">
      <button className="px-3 py-2 border rounded" onClick={save}>Spremi</button>
      <div className="text-green-700">{msg}</div>
    </div>
  </div>
}
