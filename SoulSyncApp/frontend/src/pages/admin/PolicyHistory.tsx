import React, { useEffect, useState } from 'react'
import { apiFetch } from '../../utils/net'

type Row = { tenantId:string, actorId:string, before:any, after:any, at:string }
export default function PolicyHistory(){
  const [rows, setRows] = useState<Row[]>([])
  const [msg, setMsg] = useState('')
  useEffect(()=>{ (async()=>{
    const r = await apiFetch('/admin/policy/history', { method:'GET' })
    const j = await r.json(); setRows(j.history||[])
  })() },[])

  async function rollback(at:string){
    const r = await apiFetch('/admin/policy/rollback', { method:'POST', body:{ at } })
    const j = await r.json()
    if(j.restore){
      await apiFetch('/admin/policy', { method:'PUT', body: j.restore })
      setMsg('Rollback applied (file fallback).')
    }else if(j.ok){
      setMsg('Rollback applied.')
    }else{
      setMsg('Rollback failed.')
    }
  }

  function diffClass(before:any,after:any){ return JSON.stringify(before)==JSON.stringify(after)? '' : 'bg-red-50' }
return <div className="p-6 space-y-4">
    <h1 className="text-2xl font-bold">Policy History</h1>
    {msg && <div className="text-green-700">{msg}</div>}
    <table className="w-full text-sm border">
      <thead><tr className="bg-gray-50">
        <th className="p-2 text-left">Time</th><th className="p-2 text-left">Actor</th><th className="p-2 text-left">Before → After</th><th className="p-2"></th>
      </tr></thead>
      <tbody>
        {rows.map((r,i)=>(
          <tr key={i} className="border-t align-top">
            <td className="p-2">{new Date(r.at).toLocaleString()}</td>
            <td className="p-2">{r.actorId}</td>
            <td className="p-2"><div className="grid grid-cols-2 gap-2">
              <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded">{JSON.stringify(r.before, null, 2)}</pre>") .replace('className="whitespace-pre-wrap','className={`whitespace-pre-wrap bg-gray-50 p-2 rounded ${diffClass(r.before,r.after)}`}')
              <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded">{JSON.stringify(r.after, null, 2)}</pre>
            </div></td>
            <td className="p-2">
              <button className="px-3 py-2 border rounded" onClick={()=>rollback(r.at)}>Rollback</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
}
