import React, { useEffect, useState } from 'react'
import { apiFetch } from '../../utils/net'

function validate(url:string){ return /^https?:\/\/[a-zA-Z0-9.-]+(:[0-9]+)?$/.test(url) }
export default function CorsEditor(){
  const [origins, setOrigins] = useState<string[]>([])
  const [msg, setMsg] = useState('')

  useEffect(()=>{ (async()=>{
    const r = await apiFetch('/admin/policy')
    const j = await r.json()
    setOrigins(j.policy?.cors?.origins || [])
  })() },[])

  function add(){
    setOrigins([...origins, 'https://example.com'])
  }
  function del(i:number){
    setOrigins(origins.filter((_,idx)=>idx!==i))
  }
  async function save(){
    const r0 = await apiFetch('/admin/policy')
    const j0 = await r0.json()
    const value = { ...(j0.policy||{}), cors:{ origins } }
    const r = await apiFetch('/admin/policy',{ method:'PUT', body:value })
    if(origins.some(o=>!validate(o))){ setMsg('Greška: invalid origin'); return }
    setMsg(r.ok?'Spremljeno':'Greška')
  }

  return <div className="p-6 space-y-4">
    <h1 className="text-2xl font-bold">CORS Editor</h1>
    <table className="text-sm border w-full">
      <thead><tr className="bg-gray-50"><th className="p-2 text-left">Origin</th><th></th></tr></thead>
      <tbody>{origins.map((o,i)=>(
        <tr key={i} className="border-t">
          <td className="p-2"><input className="w-full border px-2" value={o} onChange={e=>{
            const copy=[...origins]; copy[i]=e.target.value; setOrigins(copy)
          }} /></td>
          <td className="p-2"><button className="px-2 py-1 border rounded" onClick={()=>del(i)}>X</button></td>
        </tr>
      ))}</tbody>
    </table>
    <button className="px-3 py-2 border rounded" onClick={add}>+ Add</button>
    <button className="px-3 py-2 border rounded" onClick={save}>Save</button>
    <div className="text-green-700">{msg}</div>
  </div>
}
