import React, { useEffect, useState } from 'react'

type Row = { directive:string, blocked:string, count:number }

export default function CspReports(){
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)

  async function load(){
    const r = await fetch('/admin/csp/reports')
    const d = await r.json()
    setRows(d.grouped||[]); setTotal(d.total||0)
  }
  async function clearAll(){
    await fetch('/admin/csp/reports/clear', { method:'POST' })
    load()
  }

  useEffect(()=>{ load() }, [])

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">CSP Reports <span className="text-sm opacity-70">({total} total)</span></h1>
        <button onClick={clearAll} className="px-3 py-1 rounded bg-red-600 text-white">Clear</button>
      </div>
      <table className="w-full text-sm border">
        <thead><tr className="bg-gray-50">
          <th className="text-left p-2 border">Violated Directive</th>
          <th className="text-left p-2 border">Blocked URI</th>
          <th className="text-right p-2 border">Count</th>
        </tr></thead>
        <tbody>
          {rows.map((r,i)=> (
            <tr key={i} className="odd:bg-white even:bg-gray-50">
              <td className="p-2 border">{r.directive}</td>
              <td className="p-2 border break-all">{r.blocked}</td>
              <td className="p-2 border text-right">{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
