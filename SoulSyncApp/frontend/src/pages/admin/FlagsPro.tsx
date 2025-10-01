import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../utils/net'

const PRESETS: Record<string, any> = {
  minimal: { flags: { betaFeature:false } },
  beta: { flags: { betaFeature:true, ragV2:true } },
  hardened: { flags: { requireMfa:true, strictCsp:true, aiWrite:false } }
}

function validate(obj:any): string[] {
  const errs:string[] = []
  if(typeof obj!=='object' || obj===null) errs.push('Root mora biti objekt.')
  if(obj.flags && typeof obj.flags!=='object') errs.push('flags mora biti objekt.')
  return errs
}

export default function FlagsPro(){
  const [jsonText, setJsonText] = useState('')
  const [msg, setMsg] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  useEffect(()=>{ (async()=>{
    const r = await apiFetch('/admin/policy', { method:'GET' })
    const j = await r.json()
    setJsonText(JSON.stringify(j.policy || {}, null, 2))
  })() },[])

  function applyPreset(name:string){
    setJsonText(JSON.stringify(PRESETS[name], null, 2))
  }

  async function save(){
    try{
      const value = JSON.parse(jsonText)
      const errs = validate(value)
      setErrors(errs)
      if(errs.length) return
      const r = await apiFetch('/admin/policy', { method:'PUT', body: value })
      setMsg(r.ok ? 'Spremljeno' : 'OK')
    }catch(e:any){ setMsg('Greška: ' + (e?.message||e)) }
  }

  return <div className="p-6 space-y-4">
    <h1 className="text-2xl font-bold">Feature Flags – Pro</h1>
    <div className="flex gap-2">
      {Object.keys(PRESETS).map(p=>(
        <button key={p} className="px-3 py-2 border rounded" onClick={()=>applyPreset(p)}>{p}</button>
      ))}
    </div>
    {errors.length>0 && <div className="text-red-600 text-sm">
      {errors.map((e,i)=><div key={i}>• {e}</div>)}
    </div>}
    <textarea className="w-full h-72 border rounded p-2 font-mono text-sm" value={jsonText} onChange={e=>setJsonText(e.target.value)} />
    <div className="flex gap-2 items-center">
      <button className="px-3 py-2 border rounded" onClick={save}>Spremi</button>
      <div className="text-green-700">{msg}</div>
    </div>
    <p className="text-xs text-muted-foreground">Savjet: <code>flags.requireMfa</code> omogućuje zahtjev MFA za osjetljive radnje (uz ENV).</p>
  </div>
}
