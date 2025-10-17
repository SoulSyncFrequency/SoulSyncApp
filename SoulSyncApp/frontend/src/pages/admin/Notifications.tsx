
import React, { useEffect, useMemo, useState } from 'react'

type Notification = { id:number; type:string; message:string; createdAt:string; read:boolean; meta?: any }

const CRITICAL = ['MODULE_TOGGLED','MODULE_RESET','USER_DELETED','USER_DEACTIVATED','USERPLAN_ACTIVATED']

function toCSV(items:Notification[]): string {
  const headers = ['id','type','message','createdAt','read']
  const rows = items.map(i=>[i.id, i.type, JSON.stringify(i.message||''), i.createdAt, i.read])
  return [headers.join(','), ...rows.map(r=>r.join(','))].join('\n')
}


function StatsAndChart(){
  const [stats,setStats]=useState<any>({critical:0, normal:0, total:0})
  const [points,setPoints]=useState<{date:string,total:number,critical:number}[]>([])
  useEffect(()=>{
    (async()=>{
      try{
        const s = await fetch('/api/notifications/stats').then(r=>r.json())
        setStats(s)
        const d = await fetch('/api/notifications/daily?days=30').then(r=>r.json())
        setPoints(d.points||[])
      }catch{}
    })()
  },[])
  return (
    <div className="border rounded p-3">
      <div className="flex gap-6 text-sm mb-2">
        <div>Critical: <b>{stats.critical}</b></div>
        <div>Normal: <b>{stats.normal}</b></div>
        <div>Total: <b>{stats.total}</b></div>
      </div>
      <div className="text-sm font-medium mb-1">Daily activity (last 30 days)</div>
      <div className="overflow-x-auto text-xs">
        {/* Simple sparkline-style table chart for portability; can swap to recharts if desired */}
        <table className="min-w-[420px]">
          <thead><tr>{points.map(p=><th key={p.date} className="px-1">{p.date.slice(5)}</th>)}</tr></thead>
          <tbody>
            <tr>{points.map(p=><td key={p.date} className="px-1 text-center">{p.total}</td>)}</tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}


export default function Notifications(){
  const [items,setItems]=useState<Notification[]>([])
  const [loading,setLoading]=useState(false)
  const [type,setType]=useState('')
  const [unread,setUnread]=useState(false)
  const [days,setDays]=useState<number>(7)
  const [search,setSearch]=useState('')
  const [criticalOnly,setCriticalOnly]=useState(false)

  // local pin
  const [pinned,setPinned]=useState<number[]>(()=>{
    try{ return JSON.parse(localStorage.getItem('pinnedNotifs')||'[]') }catch{ return [] }
  })
  const togglePin = (id:number)=>{
    setPinned(prev=>{
      const next = prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]
      localStorage.setItem('pinnedNotifs', JSON.stringify(next))
      return next
    })
  }

  async function load(){
    setLoading(true)
    try{
      const q = new URLSearchParams()
      if(type) q.set('type', type)
      if(unread) q.set('unread', 'true')
      if(days) q.set('days', String(days))
      if(search) q.set('search', search)
      const r = await fetch('/api/notifications?'+q.toString())
      const j = await r.json()
      let list: Notification[] = j.items||[]
      if(criticalOnly) list = list.filter(n=>CRITICAL.includes(n.type))
      // sort: pinned first
      list = list.sort((a,b)=>{
        const pa = pinned.includes(a.id) ? 0 : 1
        const pb = pinned.includes(b.id) ? 0 : 1
        if(pa!==pb) return pa-pb
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      setItems(list)
    } finally{
      setLoading(false)
    }
  }

  useEffect(()=>{ load() // eslint-disable-next-line react-hooks/exhaustive-deps
  },[type, unread, days, search, criticalOnly, pinned.length])

  const types = useMemo(()=> Array.from(new Set(items.map(i=>i.type))).sort(), [items])

  function exportCSV(){
    const csv = toCSV(items)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'notifications.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportJSON(){
    const blob = new Blob([JSON.stringify(items,null,2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'notifications.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function markAllRead(){
    const ids = items.filter(i=>!i.read).map(i=>i.id)
    if(ids.length===0) return
    await fetch('/api/notifications/mark-read',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids})})
    await load()
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold">Notifications</h1>
        <button className="underline" onClick={markAllRead}>Mark all read</button>
        <div className="ml-auto flex gap-2">
          <button className="underline" onClick={exportCSV}>Export CSV</button>
          <button className="underline" onClick={exportJSON}>Export JSON</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">Type:
          <select value={type} onChange={e=>setType(e.target.value)} className="ml-1 border rounded px-2 py-1">
            <option value="">(any)</option>
            {types.map(t=> <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="text-sm"><input type="checkbox" checked={unread} onChange={e=>setUnread(e.target.checked)} className="mr-1" />Unread only</label>
        <label className="text-sm">Days:
          <select value={String(days)} onChange={e=>setDays(Number(e.target.value))} className="ml-1 border rounded px-2 py-1">
            <option value="7">7</option>
            <option value="30">30</option>
            <option value="90">90</option>
          </select>
        </label>
        <label className="text-sm">Search:
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="message..." className="ml-1 border rounded px-2 py-1" />
        </label>
        <label className="text-sm"><input type="checkbox" checked={criticalOnly} onChange={e=>setCriticalOnly(e.target.checked)} className="mr-1" />Critical only</label>
      
      <StatsAndChart/>

      {loading ? <p>Loading...</p> : (
        <ul className="space-y-2">
          {items.map(n=>(
            <li key={n.id}
                className={"p-3 rounded border " + (n.read? "opacity-60":"") + ( (pinned.includes(n.id)) ? " bg-yellow-50" : "")}
                onClick={()=> n.meta?.url && (window.location.href = n.meta.url)}
                style={{cursor:n.meta?.url?'pointer':'default'}}>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
                <button onClick={(e)=>{ e.stopPropagation(); togglePin(n.id) }} className="text-xs underline">{pinned.includes(n.id)?'Unpin':'📌 Pin'}</button>
              </div>
              <div className="font-medium">{n.type}</div>
              <div>{n.message}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
