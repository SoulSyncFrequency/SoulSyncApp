import React, { useEffect, useState } from 'react'

export default function SecurityHeaders(){
  const [headers, setHeaders] = useState<Record<string,string>>({})
  useEffect(()=>{ (async()=>{
    const r = await fetch('/healthz')
    const obj:Record<string,string> = {}
    r.headers.forEach((v,k)=>{ obj[k]=v })
    setHeaders(obj)
  })() },[])

  const EXPECT = ['strict-transport-security','content-security-policy','cross-origin-opener-policy','cross-origin-embedder-policy']
  return <div className="p-6 space-y-4">
    <h1 className="text-2xl font-bold">Security Headers</h1>
    <table className="text-sm border w-full">
      <thead><tr><th className="p-2 text-left">Header</th><th className="p-2 text-left">Value</th><th>Status</th></tr></thead>
      <tbody>
        {EXPECT.map(h=>(
          <tr key={h} className="border-t">
            <td className="p-2">{h}</td>
            <td className="p-2">{headers[h]||''}</td>
            <td className="p-2">{headers[h]? '✅':'❌'}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <h2 className="text-xl mt-4">All headers</h2>
    <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(headers,null,2)}</pre>
  </div>
}
