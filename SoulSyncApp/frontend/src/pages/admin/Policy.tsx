import React,{useEffect,useState} from 'react'
export default function Policy(){
  const [data,setData]=useState<any>(null)
  const [flags,setFlags]=useState<any>({})
  const [ents,setEnts]=useState<any>({})
  async function load(){ const r=await fetch('/admin/policy',{credentials:'include'}); const j=await r.json(); setData(j.policy||{}); setFlags(j.policy?.flags||{}); setEnts(j.policy?.entitlements||{}); }
  useEffect(()=>{ load() },[])
  async function save(){ const r=await fetch('/admin/policy',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body: JSON.stringify({ flags, entitlements: ents })}); const j=await r.json(); setData(j.policy) }
  return (<div className='p-4 grid gap-3'>
    <h1 className='text-2xl font-bold'>Access Policy</h1>
    {!data && <div>Loading…</div>}
    {data && (<>
      <div className='grid gap-2'>
        <h2 className='text-lg font-semibold'>Feature flags</h2>
        {Object.keys(flags).map(k=>(<label key={k} className='flex items-center gap-2'><input type='checkbox' checked={!!flags[k]} onChange={e=>setFlags({...flags,[k]: e.target.checked})}/> {k}</label>))}
      </div>
      <div className='grid gap-2'>
        <h2 className='text-lg font-semibold'>Entitlements (JSON)</h2>
        <textarea className='border rounded p-2 h-40' value={JSON.stringify(ents,null,2)} onChange={e=>{ try{ setEnts(JSON.parse(e.target.value||'{}')) }catch{}}}/>
      </div>
      <div className='flex gap-2'>
        <button className='px-3 py-2 rounded border' onClick={load}>Osvježi</button>
        <button className='px-3 py-2 rounded bg-black text-white' onClick={save}>Spremi</button>
      </div>
    </>)}
  </div>)
}
