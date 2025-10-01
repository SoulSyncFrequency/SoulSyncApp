
import React, { useEffect, useState } from 'react'

type Hook = { id:number; url:string; secret:string; active:boolean; createdAt:string }
type Log = { id:number; url:string; sentAt:string; status:string; attempts:number; error?:string }

export default function Webhooks(){
  const [items,setItems]=useState<Hook[]>([])
  const [url,setUrl]=useState('')
  const [secret,setSecret]=useState('')
  const [loading,setLoading]=useState(false)
  const [logs,setLogs]=useState<Log[]>([])
  const [status,setStatus]=useState('')
  const [search,setSearch]=useState('')
  const [days,setDays]=useState(30)

  async function load(){
    setLoading(true)
    try{
      const r = await fetch('/api/webhooks')
      const j = await r.json()
      setItems((j.items||[]).map((x:any)=>({...x, createdAt:new Date(x.createdAt).toISOString()})))
      await loadLogs()
    } finally{ setLoading(false) }
  }

  async function loadLogs(){
    const q = new URLSearchParams()
    if(status) q.set('status', status)
    if(search) q.set('search', search)
    if(days) q.set('days', String(days))
    const r = await fetch('/api/webhooks/logs?'+q.toString())
    const j = await r.json()
    setLogs((j.items||[]).map((x:any)=>({...x, sentAt:new Date(x.sentAt).toISOString()})))
  }

  async function add(){
    if(!url || !secret) return alert('URL i secret su obavezni')
    await fetch('/api/webhooks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,secret,active:true})})
    setUrl(''); setSecret(''); await load()
  }
  async function del(id:number){ await fetch('/api/webhooks/'+id,{method:'DELETE'}); await load() }
  async function toggle(id:number){ await fetch('/api/webhooks/'+id+'/toggle',{method:'POST'}); await load() }
  async function test(id:number){ await fetch('/api/webhooks/'+id+'/test',{method:'POST'}); await loadLogs() }
  async function retryLog(id:number){ await fetch('/api/webhooks/logs/'+id+'/retry',{method:'POST'}); await loadLogs() }

  useEffect(()=>{ load() },[])
  useEffect(()=>{ loadLogs() },[status,search,days])

  // live status badge: based on last log per hook
  const lastByHook: Record<number,{status:string; when:string}> = {}
  logs.forEach(l=>{
    const hook = (items.find(i=>i.url===l.url) || {id:0}).id
    if(!hook) return
    if(!lastByHook[hook] || new Date(l.sentAt)>new Date(lastByHook[hook].when)) lastByHook[hook] = { status:l.status, when:l.sentAt }
  })

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Webhooks</h1>

      <div className="border rounded p-3 space-y-2">
        <div className="font-medium">Add webhook</div>
        <div className="flex flex-wrap gap-2">
          <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..." className="border rounded px-2 py-1 min-w-[280px]" />
          <input value={secret} onChange={e=>setSecret(e.target.value)} placeholder="secret" className="border rounded px-2 py-1" />
          <button onClick={add} className="underline">Save</button>
        </div>
      </div>

      <div className="border rounded p-3">
        <div className="font-medium mb-2">Endpoints</div>
        <table className="w-full text-sm border">
          <thead><tr className="bg-gray-50">
            <th className="p-2 text-left">URL</th><th className="p-2 text-left">Active</th><th className="p-2 text-left">Live status</th><th className="p-2 text-left">Created</th><th className="p-2 text-left">Actions</th>
          </tr></thead>
          <tbody>
            {items.map(h=>{
              const st = lastByHook[h.id]?.status || '—'
              const when = lastByHook[h.id]?.when ? new Date(lastByHook[h.id].when).toLocaleString() : ''
              const badge = st==='SUCCESS' ? '🟢' : (st==='FAILED' || st==='FAILED_PERMANENT' ? '🔴' : '⚪')
              return (
                <tr key={h.id}>
                  <td className="p-2 border">{h.url}</td>
                  <td className="p-2 border">{h.active? 'Yes' : 'No'}</td>
                  <td className="p-2 border">{badge} {st} {when && <span className="text-gray-500 text-xs">({when})</span>}</td>
                  <td className="p-2 border">{new Date(h.createdAt).toLocaleString()}</td>
                  <td className="p-2 border space-x-2">
                    <button onClick={()=>toggle(h.id)} className="underline">{h.active?'Disable':'Enable'}</button>
                    <button onClick={()=>test(h.id)} className="underline">Send test</button>
                    <button onClick={()=>del(h.id)} className="underline text-red-600">Delete</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="border rounded p-3 space-y-2">
        <div className="font-medium">Webhook Logs</div>
        <div className="flex flex-wrap gap-2">
          <label>Status:
            <select value={status} onChange={e=>setStatus(e.target.value)} className="ml-1 border rounded px-2 py-1">
              <option value="">(any)</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
              <option value="FAILED_PERMANENT">FAILED_PERMANENT</option>
              <option value="RETRIED">RETRIED</option>
            </select>
          </label>
          <label>Days:
            <select value={String(days)} onChange={e=>setDays(Number(e.target.value))} className="ml-1 border rounded px-2 py-1">
              <option value="7">7</option>
              <option value="30">30</option>
              <option value="90">90</option>
            </select>
          </label>
          <label>Search:
            <input value={search} onChange={e=>setSearch(e.target.value)} className="ml-1 border rounded px-2 py-1" placeholder="url..." />
          </label>
        </div>
        <table className="w-full text-sm border">
          <thead><tr className="bg-gray-50">
            <th className="p-2 text-left">SentAt</th><th className="p-2 text-left">URL</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Attempts</th><th className="p-2 text-left">Error</th><th className="p-2 text-left">Actions</th>
          </tr></thead>
          <tbody>
            {logs.map(l=>(
              <tr key={l.id}>
                <td className="p-2 border">{new Date(l.sentAt).toLocaleString()}</td>
                <td className="p-2 border">{l.url}</td>
                <td className="p-2 border">{l.status}</td>
                <td className="p-2 border">{l.attempts}</td>
                <td className="p-2 border">{l.error || ''}</td>
                <td className="p-2 border"><button onClick={()=>retryLog(l.id)} className="underline">Retry now</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
