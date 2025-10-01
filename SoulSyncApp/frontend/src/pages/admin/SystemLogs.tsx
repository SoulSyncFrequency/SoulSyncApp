import React, { useEffect, useState } from 'react'

type Row = { id:number; level:string; message:string; reqId?:string; createdAt:string; ctx?:any }

export default function SystemLogs(){
  const [rows,setRows]=useState<Row[]>([])
  const [level,setLevel]=useState('')
  const [q,setQ]=useState('')
  const [days,setDays]=useState(7)
  async function load(){
    const params = new URLSearchParams()
    if(level) params.set('level', level)
    if(q) params.set('q', q)
    if(days) params.set('days', String(days))
    const r = await fetch('/api/admin/system-logs?'+params.toString())
    const j = await r.json()
    setRows((j.items||[]).map((x:any)=>({...x, createdAt: new Date(x.createdAt).toISOString()})))
  }
  useEffect(()=>{ load() }, [level, q, days])

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">System Logs</h1>
        <button className="underline" onClick={load}>Refresh</button>
      </div>
      <div className="flex gap-2 flex-wrap">
        <label>Level:
          <select value={level} onChange={e=>setLevel(e.target.value)} className="ml-1 border rounded px-2 py-1">
            <option value="">(any)</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>
        </label>
        <label>Days:
          <select value={String(days)} onChange={e=>setDays(Number(e.target.value))} className="ml-1 border rounded px-2 py-1">
            <option value="1">1</option>
            <option value="7">7</option>
            <option value="30">30</option>
          </select>
        </label>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="search message..." className="border rounded px-2 py-1 min-w-[240px]" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border min-w-[700px]">
          <thead className="bg-gray-50"><tr>
            <th className="p-2 text-left">Time</th>
            <th className="p-2 text-left">Level</th>
            <th className="p-2 text-left">Message</th>
            <th className="p-2 text-left">ReqId</th>
            <th className="p-2 text-left">Context</th>
          </tr></thead>
          <tbody>
            {rows.map(r=> (
              <tr key={r.id}>
                <td className="p-2 border">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="p-2 border">{r.level}</td>
                <td className="p-2 border">{r.message}</td>
                <td className="p-2 border">{r.reqId||''}</td>
                <td className="p-2 border"><pre className="text-xs whitespace-pre-wrap">{JSON.stringify(r.ctx||{}, null, 2)}</pre></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
