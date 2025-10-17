import React, { useEffect, useState } from 'react'
type Row = { version:string; timestamp:string; ledger_hash:string; notarized_txid?:string; status:string }
export default function Integrity(){
  const [rows,setRows]=useState<Row[]>([])
  useEffect(()=>{ (async()=>{ const r=await fetch('/api/integrity'); const j=await r.json(); setRows(j||[]) })() },[])
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-3">Integrity Timeline (Minimal)</h1>
      <table className="w-full text-sm border">
        <thead className="bg-gray-50"><tr><th className="p-2 text-left">Version</th><th className="p-2 text-left">Timestamp</th><th className="p-2 text-left">Ledger hash</th><th className="p-2 text-left">Proof</th><th className="p-2 text-left">Status</th></tr></thead>
        <tbody>{rows.map((r,i)=>(
          <tr key={i}><td className="p-2 border">{r.version}</td><td className="p-2 border">{new Date(r.timestamp).toLocaleString()}</td><td className="p-2 border">{r.ledger_hash||''}…</td><td className="p-2 border">{r.notarized_txid? <a className="underline" href={String(r.notarized_txid).startsWith('http')? r.notarized_txid:'#'} target="_blank" rel="noreferrer">View</a> : '-'}</td><td className="p-2 border">{r.status||'Verified'}</td></tr>
        ))}</tbody>
      </table>
      <p className="text-xs text-gray-500 mt-2">Note: This page shows cryptographic proof of existence only — it does not reveal any configuration content.</p>
    </div>
  )
}
