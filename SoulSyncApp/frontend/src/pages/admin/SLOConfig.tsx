import React, { useEffect, useState } from 'react'

export default function SLOConfig(){
  const [webhookPct,setWebhookPct]=useState(50)
  const [emailPct,setEmailPct]=useState(50)
  const [url,setUrl]=useState('')
  const [saved,setSaved]=useState(false)

  useEffect(()=>{(async()=>{
    const j = await fetch('/api/admin/slo-config').then(r=>r.json())
    if(j?.config){ setWebhookPct(j.config.webhookFailAlertPct); setEmailPct(j.config.emailFailAlertPct); setUrl(j.config.alertWebhookUrl||'') }
  })()},[])

  async function save(){
    await fetch('/api/admin/slo-config', { method:'PUT', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ webhookFailAlertPct: webhookPct, emailFailAlertPct: emailPct, alertWebhookUrl: url }) })
    setSaved(true); setTimeout(()=>setSaved(false), 1500)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">SLO Configuration</h1>
        <button className="underline" onClick={save}>{saved?'Saved ✓':'Save'}</button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <label className="border rounded p-3">Webhook fail alert (%)
          <input type="number" min={1} max={100} value={webhookPct} onChange={e=>setWebhookPct(Number(e.target.value))} className="mt-1 border rounded px-2 py-1 w-full" />
        </label>
        <label className="border rounded p-3">Email fail alert (%)
          <input type="number" min={1} max={100} value={emailPct} onChange={e=>setEmailPct(Number(e.target.value))} className="mt-1 border rounded px-2 py-1 w-full" />
        </label>
      </div>
      <label className="block border rounded p-3">Alert webhook URL (optional)
        <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://hooks.slack.com/services/..." className="mt-1 border rounded px-2 py-1 w-full" />
      </label>
      <div className="text-xs text-gray-500">SLO checks se izvršavaju kroz postojeći cron i upisuju WARN u SystemLog, te šalju payload na webhook ako je postavljen.</div>
    </div>
  )
}
