function GradeBar({grade}:{grade:string}){const colors:any={A:'bg-green-500',B:'bg-teal-500',C:'bg-yellow-400',D:'bg-orange-500',E:'bg-red-500'};return <div className={'h-1 mt-1 rounded '+(colors[grade]||'bg-gray-300')}></div>}
function CompareTable({ items }:{ items:any[] }){
  return (
    <div className="overflow-auto">
      <table className="min-w-full text-sm">
        <thead><tr>
          <th className="p-2 text-left">Polje</th>
          {items.map((it:any)=>(<th key={it.name} className="p-2 text-left">{it.name}</th>))}
        </tr></thead>
        <tbody>
          <tr><td className="p-2">F₀</td>{items.map((it:any)=>(<td key={it.name} className="p-2 font-semibold">{it.f0}</td>))}</tr>
          <tr><td className="p-2">Grade</td>{items.map((it:any)=>(<td key={it.name} className="p-2">{it.grade}</td>))}</tr>
          <tr><td className="p-2">Flags</td>{items.map((it:any)=>(<td key={it.name} className="p-2">{(it.flags||[]).join(", ")}</td>))}</tr>
          <tr><td className="p-2">Purpose</td>{items.map((it:any)=>(<td key={it.name} className="p-2">{(it.purpose_tags||[]).join(", ")}</td>))}</tr>
          <tr><td className="p-2">Emocije</td>{items.map((it:any)=>(<td key={it.name} className="p-2">{(it.emotional_tags||[]).join(", ")}</td>))}</tr>
        </tbody>
      </table>
{showCompare && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
    <div className="bg-white dark:bg-gray-900 border rounded max-w-5xl w-full p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Usporedba odabranih</h3>
        <button className="px-2 py-1 border rounded" onClick={()=>setShowCompare(false)}>Zatvori</button>
      </div>
      <CompareTable items={compareSel} />
    </div>
  </div>
)}
{compareSel.length>0 && (
  <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-900 border rounded shadow p-2">
    <div className="text-sm mb-1">Odabrano za usporedbu: {compareSel.length}/3</div>
    <div className="flex gap-2">
      <button className="px-2 py-1 border rounded text-xs" onClick={()=>setShowCompare(true)}>Otvori</button>
      <button className="px-2 py-1 border rounded text-xs" onClick={()=>setCompareSel([])}>Očisti</button>
    </div>
  </div>
)}

    </div>
  )
}

function EmotionBadge({tag, meta}:{tag:string, meta:any}){ const m = meta?.[tag]; if(!m) return <span className="px-2 py-0.5 text-xs border rounded">{tag}</span>; return <span title={m.description} className="px-2 py-0.5 text-xs border rounded" aria-label={m.description}>{m.icon} {m.label}</span> }
import Tesseract from 'tesseract.js'
import { BrowserMultiFormatReader } from '@zxing/browser'
import React, { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'

type Kind = 'food' | 'inci' | 'textile'

async function postJSON(url: string, body: any) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error('Request failed')
  return res.json()
}

export default function Verifier() {
  const [kind, setKind] = useState<Kind>('food')
  const [text, setText] = useState('')
  const parse = useMutation((body: any)=>postJSON('/api/verifier/parse', body))
  const evalM = useMutation((body: any)=>postJSON('/api/verifier/evaluate', body))

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Verifier</h1>
      <p className="opacity-80 mb-4">Provjeri hranu, INCI sastojke ili tekstil prema Nutrition & Lifestyle + F₀ pravilima.</p>

      <div className="flex gap-2 mb-3">
        {(['food','inci','textile'] as Kind[]).map(k=>(
          <button key={k} onClick={()=>setKind(k)} className={`px-3 py-1 rounded border ${kind===k?'font-semibold':''}`}>{k}</button>
        ))}
      </div>

      <textarea value={text} onChange={e=>setText(e.target.value)} rows={6}
        placeholder={kind==='food'?'Primjer: kikiriki, šećer, ulje suncokreta':'INCI ili materijali, npr. Aqua, Oxybenzone, Parfum'}
        className="w-full border rounded p-2 mb-3" />

      <div className="flex gap-2">
        <button onClick={()=>parse.mutate({ text, kind })} className="px-3 py-2 border rounded">Parse</button>
        <button onClick={()=>evalM.mutate({ tokens: (parse.data?.tokens||text.split(/[,
;]/).map(s=>s.trim()).filter(Boolean)), kind })} className="px-3 py-2 border rounded">Evaluate</button>
      </div>

      {parse.isLoading && <p className="mt-3">Parsiranje...</p>}
      {parse.data && (
        <div className="mt-4">
          <h2 className="font-semibold">Tokeni</h2>
          <pre className="text-sm bg-gray-50 p-2 rounded">{JSON.stringify(parse.data.tokens, null, 2)}</pre>
        </div>
      )}
      {evalM.data && (
        <div className="mt-4">
          <h2 className="font-semibold">Rezultat</h2>
          <div className="text-sm">F₀: <b>{evalM.data.f0}</b> — Ocjena: <b>{evalM.data.grade}</b></div>
          <pre className="text-sm bg-gray-50 p-2 rounded mt-2">{JSON.stringify(evalM.data.items, null, 2)}</pre>
        </div>
      )}
    
<div className="mt-4 p-3 border rounded">
  <h3 className="font-semibold mb-2">OCR / Barcode</h3>
  <div className="flex flex-col md:flex-row gap-3">
    <label className="border rounded p-2 cursor-pointer">
      <input type="file" accept="image/*" onChange={async (e)=>{
        const file = e.target.files?.[0]; if(!file) return;
        const img = await file.arrayBuffer();
        const { data } = await Tesseract.recognize(new Blob([img]), 'eng');
        const ocrText = data.text || '';
        setText((t)=> (t? t+'\n' : '') + ocrText.trim());
      }} hidden />
      Učitaj sliku (etiketa) – OCR
    </label>
    <button className="px-3 py-2 border rounded" onClick={async ()=>{
      const codeReader = new BrowserMultiFormatReader();
      try {
        const res = await codeReader.decodeFromVideoDevice(undefined, undefined, (result)=>{
          if(result){
            setText((t)=> (t? t+'\n' : '') + result.getText());
            codeReader.reset();
          }
        });
      } catch (e) {
        alert('Barcode skeniranje nije uspjelo: '+ String(e));
      }
    }}>Skeniraj barkod (kamera)</button>
  </div>
</div>

{showCompare && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
    <div className="bg-white dark:bg-gray-900 border rounded max-w-5xl w-full p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Usporedba odabranih</h3>
        <button className="px-2 py-1 border rounded" onClick={()=>setShowCompare(false)}>Zatvori</button>
      </div>
      <CompareTable items={compareSel} />
    </div>
  </div>
)}
{compareSel.length>0 && (
  <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-900 border rounded shadow p-2">
    <div className="text-sm mb-1">Odabrano za usporedbu: {compareSel.length}/3</div>
    <div className="flex gap-2">
      <button className="px-2 py-1 border rounded text-xs" onClick={()=>setShowCompare(true)}>Otvori</button>
      <button className="px-2 py-1 border rounded text-xs" onClick={()=>setCompareSel([])}>Očisti</button>
    </div>
  </div>
)}

    </div>
  )
}
