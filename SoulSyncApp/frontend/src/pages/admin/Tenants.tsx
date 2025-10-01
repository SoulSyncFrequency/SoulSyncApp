import React, { useEffect, useState } from 'react'
import { apiFetch } from '../../utils/net'

type Row = { tenantId:string, value:any, id:string }
export default function Tenants(){
  const [rows, setRows] = useState<Row[]>([])
  useEffect(()=>{ (async()=>{ const r=await apiFetch('/admin/tenants'); const j=await r.json(); setRows(j.tenants||[]) })() },[])
  return <div className="p-6 space-y-4">
    <h1 className="text-2xl font-bold">Tenants</h1>
    <table className="w-full text-sm border">
      <thead><tr className="bg-gray-50"><th className="p-2 text-left">Tenant</th><th className="p-2 text-left">Flags</th></tr></thead>
      <tbody>
        {rows.map((r,i)=>(
          <tr key={i} className="border-t">
            <td className="p-2">{r.tenantId}</td>
            <td className="p-2"><pre className="whitespace-pre-wrap">{JSON.stringify(r.value?.flags||{}, null, 2)}</pre></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
}
