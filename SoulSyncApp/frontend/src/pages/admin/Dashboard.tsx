
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useToast } from '../../components/ToastProvider'
import { useNotificationsSSE } from '../../utils/notificationsSSE'

type Stat = {
  users:number
  modules:{ active:number, disabled:number }
  notifications:{ today:number, critical7d:number, total7d:number }
  topTypes:{ type:string, count:number }[]
  topUsers:{ id:number, email:string, count:number }[]
}

type FeedItem = { ts:string; type:string; message:string; url?:string }


function Activity30(){
  const [points,setPoints]=useState<{date:string,total:number,critical:number}[]>([])
  useEffect(()=>{
    let timer:any
    const load = async ()=>{
      try{
        const j = await fetch('/api/notifications/daily?days=30').then(r=>r.json())
        setPoints(j.points||[])
      }catch{}
      timer = setTimeout(load, 60000)
    }
    load()
    return ()=> timer && clearTimeout(timer)
  },[])

  if(points.length===0) return <div className="border rounded p-3">No data</div>

  // Simple SVG line chart
  const w = 600, h = 180, pad = 24
  const xs = (i:number)=> pad + i*( (w-2*pad) / Math.max(1,points.length-1) )
  const maxY = Math.max(...points.map(p=>Math.max(p.total, p.critical)), 1)
  const ys = (v:number)=> h - pad - (v/maxY)*(h-2*pad)
  const path = (key:'total'|'critical')=> points.map((p,i)=> (i? 'L':'M') + xs(i) + ' ' + ys((p as any)[key]) ).join(' ')
  return (
    <div className="border rounded p-3">
      <div className="font-medium mb-2">📊 Activity (last 30 days)</div>
      <svg width={w} height={h}>
        <rect x={0} y={0} width={w} height={h} fill="white" />
        <path d={path('total')} fill="none" stroke="black" strokeWidth={2} />
        <path d={path('critical')} fill="none" stroke="red" strokeWidth={2} />
      </svg>
      <div className="text-xs text-gray-500">Total (black), Critical (red)</div>
    </div>
  )
}

function WatchdogCard(){
  const [items,setItems]=useState<any[]>([])
  const { show } = useToast()

  async function load(){
    const j = await fetch('/api/admin/watchdog-status').then(r=>r.json())
    const arr = (j.items||[]).map((x:any)=> ({...x, lastPingAt: x.lastPingAt ? new Date(x.lastPingAt).toISOString() : null }))
    setItems(arr)
    // auto alerts
    try{
      const now = Date.now()
      for(const m of arr){
        const last = m.lastPingAt ? new Date(m.lastPingAt).getTime() : 0
        const stale = !last || (now-last) > 5*60*1000
        if(m.consecutiveFails>0){
          show(`🔴 ${m.name||('Module '+m.id)} has ${m.consecutiveFails} consecutive fails`, '/admin/therapy-modules')
        } else if(stale){
          show(`⚠️ ${m.name||('Module '+m.id)} has no ping > 5 min`, '/admin/therapy-modules')
        }
      }
    }catch{}
  }
  useEffect(()=>{ load() },[])

  async function reset(id:number){
    await fetch(`/api/admin/modules/${id}/reset-fails`, { method:'PUT' })
    await load()
  }

  return (
    <div className="border rounded p-3">
      <div className="font-medium mb-2">🩺 Watchdog</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border min-w-[520px]">
          <thead>
            <tr className="bg-gray-50"><th className="p-2 text-left">Module</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Last ping</th><th className="p-2 text-left">Fails</th><th className="p-2 text-left">Action</th></tr>
          </thead>
          <tbody>
            {items.map(m=>{
              const last = m.lastPingAt ? new Date(m.lastPingAt).toLocaleString() : '—'
              const stale = !m.lastPingAt || (Date.now()-new Date(m.lastPingAt).getTime())>5*60*1000
              const status = m.consecutiveFails>0 ? '🔴 Fail' : (stale? '⚠️ Stale':'🟢 Active')
              return (
                <tr key={m.id}>
                  <td className="p-2 border">{m.name || ('Module '+m.id)}</td>
                  <td className="p-2 border">{status}</td>
                  <td className="p-2 border">{last}</td>
                  <td className="p-2 border">{m.consecutiveFails}</td>
                  <td className="p-2 border"><button className="underline" onClick={()=>reset(m.id)}>Reset fail counter</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}


export default function AdminDashboard(){
  const [stat,setStat]=useState<Stat|null>(null)
  const [loading,setLoading]=useState(false)
  const [feed,setFeed]=useState<FeedItem[]>([])
  const [paused,setPaused]=useState(false)
  const [filter,setFilter]=useState('') // type filter
  const listRef = useRef<HTMLDivElement>(null)

  async function load(){
    setLoading(true)
    try{ 
      const j = await fetch('/api/admin/dashboard').then(r=>r.json())
      setStat(j) 
    } finally{ setLoading(false) }
  }
  useEffect(()=>{ load() },[])

  // Live feed via SSE (reuse global stream)
  useNotificationsSSE()
  useEffect(()=>{
    const es = new EventSource('/api/notifications/stream')
    es.onmessage = (e)=>{
      try{
        const data = JSON.parse(e.data)
        const item = { ts: data.ts || new Date().toISOString(), type: data.type, message: data.message, url: data?.meta?.url }
        if(!paused && (!filter || item.type.includes(filter))){
          setFeed(f=> [item, ...f].slice(0,200))
        }
      }catch{}
    }
    return ()=> es.close()
  }, [paused, filter])

  useEffect(()=>{
    if(listRef.current) listRef.current.scrollTop = 0
  }, [feed.length])

  const ratioModules = useMemo(()=>{
    const a = stat?.modules.active||0, d = stat?.modules.disabled||0, t = a+d||1
    return Math.round(a*100/t)
  }, [stat])

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <button className="underline" onClick={()=> window.location.href='/api/admin/dashboard/export-pdf'}>📄 Export PDF</button>
        <button className="underline" onClick={load}>Refresh</button>
      </div>

      {/* counters */}
      <div className="grid md:grid-cols-4 gap-3">
        <Card title="Users" value={stat?.users ?? '—'} delta={stat?.deltas?.users} />
        <Card title="Modules (active)" value={`${stat?.modules.active ?? '—'} / ${stat?.modules.disabled ?? '—'}`} subtitle={`${ratioModules}% active`} delta={stat?.deltas?.modulesActive} />
        <Card title="Notifs today" value={stat?.notifications.today ?? '—'} delta={stat?.deltas?.notifsToday} />
        <Card title="Critical (7d)" value={`${stat?.notifications.critical7d ?? '—'} / ${stat?.notifications.total7d ?? '—'}`} subtitle="critical / total" delta={stat?.deltas?.critical7d} />
      </div>

      {/* charts */}
      <Activity30/>

      {/* top lists */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="border rounded p-3">
          <div className="font-medium mb-2">Top types (7d)</div>
          <ul className="text-sm space-y-1">{stat?.topTypes.map(t=>(<li key={t.type} className="flex justify-between"><span>{t.type}</span><b>{t.count}</b></li>)) || <li>—</li>}</ul>
        </div>
        <div className="border rounded p-3">
          <div className="font-medium mb-2">Top users (7d)</div>
          <ul className="text-sm space-y-1">{stat?.topUsers.map(u=>(<li key={u.id} className="flex justify-between"><span>{u.email}</span><b>{u.count}</b></li>)) || <li>—</li>}</ul>
        </div>
      </div>

      <WatchdogCard/>

      {/* live feed */}
      <div className="border rounded p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">Live feed</div>
          <div className="flex items-center gap-2 text-sm">
            <label>Filter type:
              <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="e.g. MODULE_" className="ml-1 border rounded px-2 py-1" />
            </label>
            <button className="underline" onClick={()=>setPaused(p=>!p)}>{paused?'Resume':'Pause'}</button>
            <button className="underline" onClick={()=>setFeed([])}>Clear</button>
          </div>
        </div>
        <div ref={listRef} className="max-h-72 overflow-auto border rounded p-2 bg-gray-50">
          {feed.length===0? <div className="text-sm text-gray-500">No events yet…</div> :
            <ul className="text-sm space-y-1">
              {feed.map((f,i)=>(
                <li key={i} className="bg-white rounded p-2 border hover:bg-blue-50 cursor-pointer" onClick={()=> f.url && (window.location.href=f.url)}>
                  <div className="text-xs text-gray-500">{new Date(f.ts).toLocaleString()}</div>
                  <div className="font-medium">{f.type}</div>
                  <div>{f.message}</div>
                </li>
              ))}
            </ul>}
        </div>
      </div>
    </div>
  )
}

function Trend({delta}:{delta:number}){
  const color = delta>5? 'text-green-600' : (delta<-5? 'text-red-600':'text-gray-500')
  const symbol = delta>5? '↑' : (delta<-5? '↓':'→')
  return <span className={color}> {symbol} {delta}%</span>
}
function Card({ title, value, subtitle, delta }:{ title:string, value:any, subtitle?:string, delta?:number }){
  return (
    <div className="border rounded p-4 bg-white shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold">{value}{typeof delta==='number' && <Trend delta={delta}/>}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
  )
}

  return (
    <div className="border rounded p-4 bg-white shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
  )
}
