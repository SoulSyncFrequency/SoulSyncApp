import React from 'react'

export default function AdminDiagnostics() {
  const [data, setData] = React.useState<any>(null)
  const [health, setHealth] = React.useState<string>('')
  const [ready, setReady] = React.useState<string>('')
  const [metrics, setMetrics] = React.useState<string>('')

  React.useEffect(() => {
    fetch('/admin/diagnostics').then(r => r.json()).then(setData).catch(()=>{})
    fetch('/healthz').then(r => r.json()).then(d => setHealth(JSON.stringify(d))).catch(()=>setHealth('error'))
    fetch('/readyz').then(r => r.json()).then(d => setReady(JSON.stringify(d))).catch(()=>setReady('error'))
    fetch('/metrics').then(r => r.text()).then(setMetrics).catch(()=>setMetrics('metrics disabled'))
  }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Admin Diagnostics</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl shadow">
          <h2 className="font-semibold mb-2">/healthz</h2>
          <pre className="text-sm whitespace-pre-wrap">{health || '...'}</pre>
        </div>
        <div className="p-4 rounded-2xl shadow">
          <h2 className="font-semibold mb-2">/readyz</h2>
          <pre className="text-sm whitespace-pre-wrap">{ready || '...'}</pre>
        </div>
      </div>
      <div className="p-4 rounded-2xl shadow">
        <h2 className="font-semibold mb-2">/admin/diagnostics</h2>
        <pre className="text-sm whitespace-pre-wrap">{data ? JSON.stringify(data, null, 2) : '...'}</pre>
      </div>
      <div className="p-4 rounded-2xl shadow">
        <h2 className="font-semibold mb-2">/metrics</h2>
        <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-80">{metrics || '...'}</pre>
      </div>
    </div>
  )
}
