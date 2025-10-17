import React, { useEffect, useMemo, useRef, useState } from 'react'
import { toCSV, fromCSV } from '../utils/csvUtils'
import { autoBackup, loadHistory, saveHistory, type BackupEntry } from '../services/backupService'
const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
import { FixedSizeList as List } from 'react-window'

type Kind = 'food'|'inci'|'textile'
type Item = {
  name: string
  f0: number
  grade: string
  flags: string[]
  purpose_tags: string[]
  emotional_tags: string[]
}

type BackupEntry = { name: string, time: string, items: Item[], pinned?: boolean }

function Toasts({toasts,setToasts}:{toasts:{id:number,msg:string,type:string,action?:{label:string,run:()=>void}}[],setToasts:any}){
  return <div className="fixed top-4 right-4 space-y-2 z-50">
    {toasts.map(t=>(
      <div key={t.id} className={"px-3 py-2 rounded shadow text-white text-sm "+(t.type==='error'?'bg-red-500':'bg-green-500')}>
        {t.msg}
      </div>
    ))}
  </div>
}

export default function AdminEditor(){
  const [toasts,setToasts] = useState<{id:number,msg:string,type:string,action?:{label:string,run:()=>void}}[]>([])
  function pushToast(msg:string,type:'success'|'error'='success',action?:{label:string,run:()=>void}){
    const id=Date.now(); setToasts(t=>[...t,{id,msg,type,action}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),4000)
  }

  const [kind, setKind] = useState<Kind>('food')
  const [token, setToken] = useState<string>('dev-token')
  const [items, setItems] = useState<Item[]>([])
  const [filter, setFilter] = useState('')
  const [flagFilter,setFlagFilter] = useState('')
  const [purposeFilter,setPurposeFilter] = useState('')
  const [emotionFilter,setEmotionFilter] = useState('')
  const [progress, setProgress] = useState<{done:number,total:number}|null>(null)
  const [undoStack, setUndoStack] = useState<any[][]>([])
  const [changedRows, setChangedRows] = useState<Record<string, boolean>>({})
  const suggestions = useMemo(()=>{
    const flags = new Set<string>(), purpose=new Set<string>(), emotions=new Set<string>()
    items.forEach(x=>{
      (x.flags||[]).forEach(f=>flags.add(f))
      ;(x.purpose_tags||[]).forEach(p=>purpose.add(p))
      ;(x.emotional_tags||[]).forEach(e=>emotions.add(e))
    })
    return { flags:[...flags], purpose:[...purpose], emotions:[...emotions] }
  }, [items])
  const [backupInfo, setBackupInfo] = useState<{name:string,time:string}|null>(null)
  const [backupHistory, setBackupHistory] = useState<BackupEntry[]>(()=> loadHistory())
  const [renameIndex, setRenameIndex] = useState<number|null>(null)
  const [csvPreview, setCsvPreview] = useState<any[]|null>(null)
  const [csvPreviewName, setCsvPreviewName] = useState<string>('')
  const [addNames, setAddNames] = useState<Set<string>>(new Set())
  const [updateNames, setUpdateNames] = useState<Set<string>>(new Set())
  const [removeNames, setRemoveNames] = useState<Set<string>>(new Set())
  const [csvDiff, setCsvDiff] = useState<{add:string[],update:string[],remove:string[]}|null>(null)
  const [renameValue, setRenameValue] = useState('')

  useEffect(()=>{
    try{ saveHistory(backupHistory) }catch(e:any){ pushToast('⚠️ '+(e?.message||'Greška spremanja backupa'),'error') }
  }, [backupHistory])
  async function load(){
    const res = await fetch(`${API_BASE}/api/verifier/admin/entries?kind=${kind}`, { headers:{ Authorization:`Bearer ${token}` } })
    const js = await res.json()
    if(js.ok){
      setItems(js.items)
      setChangedRows({})
    }else{
      pushToast(js.error || 'Neuspješno učitavanje')
    }
  }
  useEffect(()=>{ load() }, [kind, token])
  function markChanged(name:string){ setChangedRows(p=>({ ...p, [name]: true })) }
  function parseTags(s:string){ return s.split('|').map(x=>x.trim()).filter(Boolean) }
  function exportItemsCSV(){
    const csv = toCSV(items)
    const blob = new Blob([csv], {type:'text/csv'})
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`items_${kind}_${new Date().toISOString()}.csv`; a.click()
  }
  async function bulkSave(){
    const { entry, list } = autoBackup(items, kind)
    setBackupHistory(list)
    setBackupInfo({ name: entry.name, time: entry.time })
    const changed = items.filter(x=> changedRows[x.name])
    setProgress({done:0,total:changed.length})
    let done = 0
    for(const x of changed){
      await fetch(`${API_BASE}/api/verifier/admin/entry`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ kind, item: x }) })
      done++; setProgress({done, total: changed.length})
      setChangedRows(p=>({ ...p, [x.name]: false }))
    }
    setProgress(null)
    pushToast('Sve izmjene spremljene!')
  }
  async function importCsvToItems(file: File){
    const txt = await file.text()
    const rows = txt.split(/\r?\n/).map(l=>l.split(',').map(x=>x.trim())).filter(r=>r.length>1)
    const heads = rows.shift()||[]
    const req = ['name','f0','grade','flags','purpose_tags','emotional_tags']
    const missing = req.filter(r=>!heads.includes(r))
    if(missing.length){ pushToast('CSV nedostaju stupci: '+missing.join(', ')); return }
    const seen = new Set<string>(); const list: Item[] = []
    for(const r of rows){
      const o:any = {}; heads.forEach((h,i)=> o[h]=r[i]||'')
      if(!o.name || seen.has(o.name)) { pushToast('Duplikat/prazno ime: '+o.name); return }
      seen.add(o.name)
      const f0 = parseFloat(o.f0); if(isNaN(f0)||f0<0||f0>1){ pushToast('Neispravan f0: '+o.name); return }
      if(!/^[A-E]$/.test(o.grade)) { pushToast('Neispravan grade: '+o.name); return }
      list.push({ name:o.name, f0, grade:o.grade, flags: parseTags(o.flags||''), purpose_tags: parseTags(o.purpose_tags||''), emotional_tags: parseTags(o.emotional_tags||'') })
    }
    setItems(list)
    const changed:any={}; list.forEach(x=>changed[x.name]=true); setChangedRows(changed)
    pushToast('CSV učitan u editor — '+list.length+' unosa')
  }
  async function importCsvToHistory(file: File){
    const txt = await file.text()
    const rows = txt.split(/\r?\n/).map(l=>l.split(',').map(x=>x.trim())).filter(r=>r.length>1)
    const heads = rows.shift()||[]
    const req = ['name','f0','grade','flags','purpose_tags','emotional_tags']
    const missing = req.filter(r=>!heads.includes(r))
    if(missing.length){ pushToast('CSV nedostaju stupci: '+missing.join(', ')); return }
    const seen = new Set<string>(); const list: Item[] = []
    for(const r of rows){
      const o:any = {}; heads.forEach((h,i)=> o[h]=r[i]||'')
      if(!o.name || seen.has(o.name)) { pushToast('Duplikat/prazno ime: '+o.name); return }
      seen.add(o.name)
      const f0 = parseFloat(o.f0); if(isNaN(f0)||f0<0||f0>1){ pushToast('Neispravan f0: '+o.name); return }
      if(!/^[A-E]$/.test(o.grade)) { pushToast('Neispravan grade: '+o.name); return }
      list.push({ name:o.name, f0, grade:o.grade, flags: parseTags(o.flags||''), purpose_tags: parseTags(o.purpose_tags||''), emotional_tags: parseTags(o.emotional_tags||'') })
    }
    const entry: BackupEntry = { name:file.name, time:new Date().toLocaleString(), items:list }
    setBackupHistory(h=>[entry, ...h].slice(0,10))
    pushToast('CSV dodan u backupHistory ('+list.length+' unosa)')
  }
  const dropRef = useRef<HTMLDivElement>(null)
  async function onDropCSV(e: React.DragEvent<HTMLDivElement>){
    e.preventDefault()
    dropRef.current?.classList.remove('bg-blue-50')
    const file = e.dataTransfer.files?.[0]; if(!file) return;
    await importCsvToHistory(file)
  }

  async function saveRow(x: any){
    try{
      await fetch(`${API_BASE}/api/verifier/admin/entry`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ kind, item: x }) })
      setChangedRows(p=>({ ...p, [x.name]: false }))
      setUndoStack((st:any)=>{ const snap = JSON.parse(JSON.stringify(items)); const next=[...st,snap].slice(-3); return next })
      const prev = JSON.parse(JSON.stringify(items))
      pushToast('Spremljeno', 'success', { label:'Undo', run: ()=>{ setItems(prev); setChangedRows({}); } })
    }catch(e:any){ pushToast('Greška spremanja: '+(e?.message||''),'error') }
  }

  function computeDiff(current:any[], incoming:any[]){
    const curMap = new Map(current.map((x:any)=>[x.name, x]))
    const incMap = new Map(incoming.map((x:any)=>[x.name, x]))
    const add:string[] = [], update:string[] = [], remove:string[] = []
    for(const [name, rec] of incMap){ if(!curMap.has(name)) add.push(name); else{ const a1=JSON.stringify(curMap.get(name)); const a2=JSON.stringify(rec); if(a1!==a2) update.push(name) } }
    for(const [name] of curMap){ if(!incMap.has(name)) remove.push(name) }
    return {add, update, remove}
  }

  useEffect(()=>{
    if(csvDiff){
      setAddNames(new Set(csvDiff.add))
      setUpdateNames(new Set(csvDiff.update))
      setRemoveNames(new Set(csvDiff.remove))
    } else {
      setAddNames(new Set()); setUpdateNames(new Set()); setRemoveNames(new Set());
    }
  },[csvDiff])
  const filtered = useMemo(()=> items.filter(x=> x.name.toLowerCase().includes(filter.toLowerCase())), [items, filter])

  return (<>
      <Toasts toasts={toasts} setToasts={setToasts} />
    <div className="max-w-5xl mx-auto p-4">
      {/* datalists for autocomplete */}
      <datalist id="flags-suggestions">{suggestions.flags.map(([f])=><option key={f} value={f} />)}</datalist>
      <datalist id="purpose-suggestions">{suggestions.purpose.map(([f])=><option key={f} value={f} />)}</datalist>
      <datalist id="emotions-suggestions">{suggestions.emotions.map(([f])=><option key={f} value={f} />)}</datalist>

      {/* Drag & drop zone */}
      <div
        ref={dropRef}
        onDragOver={e=>{ e.preventDefault(); dropRef.current?.classList.add('bg-blue-50') }}
        onDragLeave={e=> dropRef.current?.classList.remove('bg-blue-50')}
        onDrop={onDropCSV}
        className="border-2 border-dashed border-blue-300 rounded p-4 text-center text-xs mb-3 cursor-pointer"
      >
        📂 Povuci i ispusti .csv ovdje za dodavanje u backupHistory
      </div>

      {/* Top controls */}
      <div className="mb-2 flex gap-2 items-center">
        <select value={kind} onChange={e=>setKind(e.target.value as Kind)} className="border rounded px-2 py-1">
          <option value="food">food</option>
          <option value="inci">inci</option>
          <option value="textile">textile</option>
        </select>
        <input className="border rounded px-2 py-1" placeholder="Admin token" value={token} onChange={e=>setToken(e.target.value)} />
        <input className="border rounded px-2 py-1 flex-1" placeholder="Filter by name" value={filter} onChange={e=>setFilter(e.target.value)} />
        <button className="px-3 py-1 border rounded" disabled={!undoStack.length} onClick={()=>{
          if(!undoStack.length) return; const prev = undoStack[undoStack.length-1]; setUndoStack(undoStack.slice(0,-1)); setItems(prev as any); const ch:any={}; (prev as any).forEach((x:any)=>ch[x.name]=true); setChangedRows(ch);
        }}>↩ Undo</button>
        <button className="px-3 py-1 border rounded" onClick={load}>Refresh</button>
        <button className="px-3 py-1 border rounded" onClick={exportItemsCSV}>📤 Export CSV (items)</button>
        {/* Import CSV to items */}
        <input id="csvToItems" type="file" accept=".csv" className="hidden" onChange={e=>{ const f=e.target.files?.[0]; if(f) importCsvToItems(f) }} />
        <button className="px-3 py-1 border rounded" onClick={()=>document.getElementById('csvToItems')?.click()}>📥 Uvezi CSV u editor</button>
        {/* Import CSV to history */}
        <input id="csvToHistory" type="file" accept=".csv" className="hidden" onChange={e=>{ const f=e.target.files?.[0]; if(f) importCsvToHistory(f) }} />
        <button className="px-3 py-1 border rounded" onClick={()=>document.getElementById('csvToHistory')?.click()}>📥 Dodaj CSV u backupHistory</button>
      </div>

      {/* Backup info + history controls */}
      <div className="mb-2 flex gap-2">
        {/* Export ALL backupHistory */}
        <button className="px-2 py-1 border rounded text-xs" onClick={()=>{
          const blob = new Blob([JSON.stringify(backupHistory,null,2)],{type:'application/json'})
          const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='backupHistory_'+new Date().toISOString()+'.json'; a.click()
        }}>📤 Export svi backupovi</button>

        {/* Import backupHistory JSON */}
        <input type="file" accept=".json" id="importBH" className="hidden" onChange={async e=>{
          const f=e.target.files?.[0]; if(!f) return;
          const txt = await f.text()
          try{
            const data = JSON.parse(txt)
            if(!Array.isArray(data) || !data.every((d:any)=> d && d.name && d.time && Array.isArray(d.items))){
              pushToast('Neispravan backupHistory JSON'); return
            }
            setBackupHistory(data as BackupEntry[])
            localStorage.setItem('backupHistory', JSON.stringify(data))
            pushToast('BackupHistory uvezen')
          }catch(err:any){ pushToast('Greška: '+(err?.message||'JSON')) }
        }}/>
        <button className="px-2 py-1 border rounded text-xs" onClick={()=>document.getElementById('importBH')?.click()}>📥 Uvezi backupHistory</button>
      </div>

      <div className="flex gap-3 mb-2 text-sm items-end">
          <button className='px-2 py-1 border rounded' onClick={()=>{setFlagFilter('');setPurposeFilter('');setEmotionFilter('')}}>🧹 Clear filters</button>
        </div>
        <div className="flex gap-2 mb-4 text-xs">
          {flagFilter && <span className='px-2 py-1 rounded-full bg-blue-100 border'>flag: {flagFilter} <button className='ml-1' onClick={()=>setFlagFilter('')}>×</button></span>}
          {purposeFilter && <span className='px-2 py-1 rounded-full bg-green-100 border'>purpose: {purposeFilter} <button className='ml-1' onClick={()=>setPurposeFilter('')}>×</button></span>}
          {emotionFilter && <span className='px-2 py-1 rounded-full bg-yellow-100 border'>emotion: {emotionFilter} <button className='ml-1' onClick={()=>setEmotionFilter('')}>×</button></span>}
        </div>
        <div className="flex gap-3 mb-4 text-sm">
          <div>
            📌 Flags<br/>
            <select className="border rounded px-2 py-1" value={flagFilter} onChange={e=>setFlagFilter(e.target.value)}>
              <option value="">(sve)</option>
              {suggestions.flags.map(([f,c])=><option key={f} value={f}>{f+' ('+c+')'}</option>)}
            </select>
          </div>
          <div>
            🎯 Purpose<br/>
            <select className="border rounded px-2 py-1" value={purposeFilter} onChange={e=>setPurposeFilter(e.target.value)}>
              <option value="">(sve)</option>
              {suggestions.purpose.map(([f,c])=><option key={f} value={f}>{f+' ('+c+')'}</option>)}
            </select>
          </div>
          <div>
            💛 Emotions<br/>
            <select className="border rounded px-2 py-1" value={emotionFilter} onChange={e=>setEmotionFilter(e.target.value)}>
              <option value="">(sve)</option>
              {suggestions.emotions.map(([f,c])=><option key={f} value={f}>{f+' ('+c+')'}</option>)}
            </select>
          </div>
        </div>

        {progress && <div className="mb-2 text-sm">Spremanje... {progress.done} / {progress.total}</div>}

      {csvPreview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 w-[720px] max-w-[95vw] shadow">
            <div className="text-lg font-semibold mb-2">CSV uvezi pregled — {csvPreviewName}</div>
            {csvDiff && (
              <div className="text-sm mb-3 grid grid-cols-3 gap-2">
                <div className="border rounded p-2"><b>➕ Dodaje:</b> {csvDiff.add.length}
                  <div className="text-xs mt-1 max-h-24 overflow-auto">{csvDiff.add.slice(0,10).map(n=> <div key={n}>{n}</div>)}</div>
                </div>
                <div className="border rounded p-2"><b>✏️ Ažurira:</b> {csvDiff.update.length}
                  <div className="text-xs mt-1 max-h-24 overflow-auto">{csvDiff.update.slice(0,10).map(n=> <div key={n}>{n}</div>)}</div>
                </div>
                <div className="border rounded p-2"><b>🗑️ Uklanja:</b> {csvDiff.remove.length}
                  <div className="text-xs mt-1 max-h-24 overflow-auto">{csvDiff.remove.slice(0,10).map(n=> <div key={n}>{n}</div>)}</div>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 border rounded" onClick={()=>{ setCsvPreview(null); setCsvDiff(null); }}>Odustani</button>
              <button className="px-3 py-1 border rounded bg-black text-white" onClick={()=>{
                const prev = JSON.parse(JSON.stringify(items));
                setUndoStack((st:any)=>[...st, prev].slice(-3))
                const list = csvPreview as any[];
                setItems(list)
                const changed:any={}; list.forEach(x=>changed[x.name]=true); setChangedRows(changed)
                setCsvPreview(null); setCsvDiff(null);
                pushToast('CSV učitan u editor — '+list.length+' unosa','success', {label:'Undo', run:()=>{ setItems(prev); const ch:any={}; prev.forEach((x:any)=>ch[x.name]=true); setChangedRows(ch) }})
              }}>Primijeni</button>
            </div>
          </div>
        </div>
      )}
      {backupInfo && <div className="mb-2 text-xs text-gray-500">📂 Trenutno uređuješ: {backupInfo.name} (učitano {backupInfo.time})</div>}

      {/* Backup history list */}
      {backupHistory.length>0 && (
        <div className="mb-2 text-xs">
          📂 Zadnji backupovi:
          {[...backupHistory].sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)).map((b,i)=>(
            <div key={i} className="inline-flex items-center mr-3 gap-1">
              <button className="px-1 border rounded" onClick={()=>{
                const copy=[...backupHistory]; copy[i].pinned=!copy[i].pinned; setBackupHistory(copy)
              }}>{b.pinned?'📍':'📌'}</button>

              {/* rename */}
              {renameIndex===i ? (
                <>
                  <input className="border rounded px-1 text-xs" value={renameValue} onChange={e=>setRenameValue(e.target.value)} onKeyDown={e=>{
                    if((e as any).key==='Enter'){
                      const copy=[...backupHistory]; copy[i].name=renameValue; setBackupHistory(copy)
                      if(backupInfo?.name===b.name) setBackupInfo({name:renameValue,time:b.time})
                      setRenameIndex(null)
                    }
                  }} />
                  <button className="px-1 border rounded" onClick={()=>{
                    const copy=[...backupHistory]; copy[i].name=renameValue; setBackupHistory(copy)
                    if(backupInfo?.name===b.name) setBackupInfo({name:renameValue,time:b.time})
                    setRenameIndex(null)
                  }}>💾</button>
                </>
              ) : (
                <>
                  <button className="underline" onClick={()=>{
                    if(confirm('Učitati ovaj backup? Trenutne izmjene će biti izgubljene.')){
                      setItems(JSON.parse(JSON.stringify(b.items)))
                      const changed:any={}; b.items.forEach(x=>changed[x.name]=true); setChangedRows(changed)
                      setBackupInfo({name:b.name, time:b.time})
                    }
                  }}>{b.name} ({b.time})</button>
                  <button className="px-1 border rounded" onClick={()=>{ setRenameIndex(i); setRenameValue(b.name) }}>✏️</button>
                  <button className="px-1 border rounded" onClick={()=>{
                    const rows = [['name','f0','grade','flags','purpose_tags','emotional_tags'], ...b.items.map(x=>[x.name,x.f0,x.grade,(x.flags||[]).join('|'),(x.purpose_tags||[]).join('|'),(x.emotional_tags||[]).join('|')])]
                    const csv = rows.map(r=>r.join(',')).join('\n')
                    const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=b.name; a.click()
                  }}>📤</button>
                  <button className="px-1 border rounded" onClick={()=>{
                    if(confirm('Obrisati ovaj backup iz povijesti?')){
                      const copy=[...backupHistory]; const [rm] = copy.splice(i,1); setBackupHistory(copy)
                      if(backupInfo?.name===rm.name) setBackupInfo(null)
                    }
                  }}>🗑️</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Items grid with inline editing and Save per row */}
      <div className="flex justify-end mb-2">
        <button className="px-3 py-1 border rounded" onClick={bulkSave}>💾 Spremi sve izmjene</button>
      </div>

      <div className="grid gap-2">
        {<List height={600} itemCount={filtered.length} itemSize={140} width={'100%'}>{({index,style})=>{const x=filtered[index];return (<>
      <Toasts toasts={toasts} setToasts={setToasts} />
          <div key={x.name} style={style} className="border rounded p-2 text-sm grid gap-1">
            <div className="font-semibold flex items-center gap-2">{x.name} {changedRows[x.name] && <span className="text-yellow-600 text-xs">🟡 nije spremljeno</span>}</div>
            <div className="grid grid-cols-5 gap-1 text-xs">
              <input className='border rounded px-1' defaultValue={x.f0} onChange={e=>{ x.f0=Number(e.target.value); markChanged(x.name) }} />
              <input className='border rounded px-1' defaultValue={x.grade} onChange={e=>{ x.grade=e.target.value; markChanged(x.name) }} />
              <input list='flags-suggestions' className='border rounded px-1' defaultValue={x.flags?.join('|')} onChange={e=>{ x.flags=parseTags(e.target.value); markChanged(x.name) }} />
              <input list='purpose-suggestions' className='border rounded px-1' defaultValue={x.purpose_tags?.join('|')} onChange={e=>{ x.purpose_tags=parseTags(e.target.value); markChanged(x.name) }} />
              <input list='emotions-suggestions' className='border rounded px-1' defaultValue={x.emotional_tags?.join('|')} onChange={e=>{ x.emotional_tags=parseTags(e.target.value); markChanged(x.name) }} />
            </div>
            <div className="flex justify-end">
              <button className="px-2 py-1 border rounded" onClick={async ()=>{
                await saveRow(x)
              }}>💾 Spremi</button>
            </div>
          </div>)}}</List>}
      </div>
    </div>
  </>)
}
