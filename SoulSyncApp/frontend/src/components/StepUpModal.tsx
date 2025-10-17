import React, { useState } from 'react'
type Props = { onVerified?: ()=>void }
export default function StepUpModal({ onVerified }: Props){
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  async function initiate(){ await fetch('/auth/mfa/step-up/initiate',{ method:'POST', credentials:'include' }); setOpen(true) }
  async function verify(){ const r=await fetch('/auth/mfa/step-up/verify',{ method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code })}); const j=await r.json(); if(j.ok){ setOpen(false); setCode(''); onVerified&&onVerified(); } else alert('Greška pri verifikaciji') }
  return (<>
    <button className="px-3 py-2 rounded border" onClick={initiate}>Step‑up MFA</button>
    {open && (<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded p-4 w-full max-w-sm grid gap-3">
        <div className="text-lg font-semibold">Potvrdi identitet</div>
        <input className="border rounded px-2 py-1" placeholder="6-znamenkasti kod" value={code} onChange={e=>setCode(e.target.value)} />
        <div className="flex gap-2 justify-end">
          <button className="px-3 py-2 rounded border" onClick={()=>{setOpen(false); setCode('')}}>Zatvori</button>
          <button className="px-3 py-2 rounded bg-black text-white" onClick={verify}>Potvrdi</button>
        </div>
      </div>
    </div>)}
  </>)
}
