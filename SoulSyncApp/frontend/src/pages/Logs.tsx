import React, { useEffect, useState } from 'react'

type Row = { ts:string; level:string; msg:string }
import { logsFilterSchema } from '../lib/validation'

function qs(params: Record<string,string|undefined>){
  const u = new URLSearchParams(); Object.entries(params).forEach(([k,v])=>{ if(v) u.set(k,v) })
  return u.toString()
}

export default function Logs(){
  const [level,setLevel]=useState('')
  const [q,setQ]=useState('')
  const [since,setSince]=useState('')
  const [until,setUntil]=useState('')
  const [rows,setRows]=useState<Row[]>([])

  async function load(){
    const _v = logsFilterSchema.parse({ level, q, since, until });
    const res = await fetch('/api/logs?'+qs(_v as any))
    const j = await res.json()
    setRows(j||[])
  }
  useEffect(()=>{ load() }, [])

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-3">
      <h1 className="text-2xl font-bold">Logs (filters & export)</h1>
      <div className="flex items-end gap-2 flex-wrap">
        <div><label className="block text-xs">Level</label>
          <select value={level} onChange={e=>setLevel(e.target.value)} className="border rounded p-1">
            <option value="">Any</option>
            <option>INFO</option><option>WARN</option><option>ERROR</option>
          </select>
        </div>
        <div><label className="block text-xs">Query</label>
          <input value={q} onChange={e=>setQ(e.target.value)} className="border rounded p-1" placeholder="text…" />
        </div>
        <div><label className="block text-xs">Since</label>
          <input type="datetime-local" value={since} onChange={e=>setSince(e.target.value)} className="border rounded p-1" />
        </div>
        <div><label className="block text-xs">Until</label>
          <input type="datetime-local" value={until} onChange={e=>setUntil(e.target.value)} className="border rounded p-1" />
        </div>
        <button onClick={load} className="px-3 py-2 rounded bg-black text-white">Apply</button>
        <a className="px-3 py-2 rounded border" href={`/api/logs/export.csv?${qs({ level, q, since, until })}`}>Export CSV</a>
      </div>
      <div className="border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="p-2 text-left">Timestamp</th><th className="p-2 text-left">Level</th><th className="p-2 text-left">Message</th></tr></thead>
          <tbody>
            {rows.map((r,i)=>(<tr key={i} className="border-t"><td className="p-2">{new Date(r.ts).toLocaleString()}</td><td className="p-2">{r.level}</td><td className="p-2">{r.msg}</td></tr>))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
