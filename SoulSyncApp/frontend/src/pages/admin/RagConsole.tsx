import React, { useState } from 'react'
import { apiFetch } from '../../utils/net'

export default function RagConsole(){
  const [q, setQ] = useState('privacy')
  const [out, setOut] = useState<any>(null)
  const [etag, setEtag] = useState<string>('')
  async function run(){
    const r = await apiFetch('/rag/query', { method:'POST', headers: etag? {'If-None-Match': etag} : {}, body: { q } })
    if(r.status===304){ setOut({ note:'304 Not Modified (cache hit)' }); return }
    const e = r.headers.get('ETag')||''; setEtag(e)
    const j = await r.json(); setOut(j)
  }
  return <div className="p-6 space-y-4">
    <h1 className="text-2xl font-bold">RAG Console</h1>
    <div className="flex gap-2">
      <input className="border rounded px-2 py-1 w-96" value={q} onChange={e=>setQ(e.target.value)} />
      <button className="px-3 py-2 border rounded" onClick={run}>Run</button>
    </div>
    <pre className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">{JSON.stringify(out, null, 2)}</pre>
  </div>
}
