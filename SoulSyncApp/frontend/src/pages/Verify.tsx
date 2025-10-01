import React, { useEffect, useRef, useState } from 'react'
async function importPemPublicKey(pem: string): Promise<CryptoKey> {
  const b64 = pem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g, '')
  const der = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  return await crypto.subtle.importKey('spki', der.buffer, { name:'RSASSA-PKCS1-v1_5', hash:'SHA-256' }, false, ['verify'])
}
function canonicalPayload(obj:any){ const { version, timestamp, ledger_hash, notarized_txid } = obj||{}; return JSON.stringify({ version, timestamp, ledger_hash, notarized_txid }) }
function base64ToBytes(b64:string){ const bin = atob(b64); return Uint8Array.from(bin, c=>c.charCodeAt(0)) }
export default function Verify(){
  const [pubKey,setPubKey]=useState<CryptoKey|null>(null); const [status,setStatus]=useState(''); const [payload,setPayload]=useState(''); const [res,setRes]=useState('');
  const fileRef = useRef<HTMLInputElement|null>(null)
  useEffect(()=>{ (async()=>{ try{ const r=await fetch('/api/integrity/public-key'); if(!r.ok){ setStatus('Public key not found'); return } const pem=await r.text(); const k=await importPemPublicKey(pem); setPubKey(k); setStatus('Public key loaded'); }catch(e:any){ setStatus('Failed to load key') } })() },[])
  async function verify(){ try{ const o=JSON.parse(payload); const sig=o.signature; if(!sig){ setRes('Missing signature'); return } const canon=new TextEncoder().encode(canonicalPayload(o)); const ok=await crypto.subtle.verify({name:'RSASSA-PKCS1-v1_5'}, pubKey as CryptoKey, base64ToBytes(sig), canon); setRes(ok?'✅ Verified':'⚠️ Tampered'); }catch(e:any){ setRes('Invalid JSON / error') } }
  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>){ const f = e.target.files?.[0]; if(!f) return; const url=URL.createObjectURL(f); const img=new Image(); img.src=url; await new Promise(r=>img.onload=()=>r(null)); const canvas=document.createElement('canvas'); canvas.width=img.width; canvas.height=img.height; const ctx=canvas.getContext('2d')!; ctx.drawImage(img,0,0); // try BarcodeDetector
    // @ts-ignore
    if(window.BarcodeDetector){ const d = new window.BarcodeDetector({ formats:['qr_code']}); const codes = await d.detect(canvas); if(codes[0]){ setPayload(codes[0].rawValue); setStatus('QR parsed'); return } } setStatus('Could not detect QR; paste JSON manually.'); if(fileRef.current) fileRef.current.value='' }
  return (<div className="p-4 max-w-3xl mx-auto space-y-3"><h1 className="text-xl font-bold">Verify Snapshot QR / JSON</h1><p className="text-sm text-gray-600">{status}</p>
    <div className="border rounded p-3"><label className="text-sm">Upload QR image</label><input ref={fileRef} type="file" accept="image/*" onChange={onFileChange}/></div>
    <div className="border rounded p-3"><label className="text-sm">Or paste JSON payload</label><textarea value={payload} onChange={e=>setPayload(e.target.value)} className="w-full h-40 p-2 border rounded font-mono text-sm" placeholder='{"version":"...","timestamp":"...","ledger_hash":"...","notarized_txid":"...","signature":"..."}' />
    <button onClick={verify} className="mt-2 px-3 py-2 bg-black text-white rounded">Verify</button><div className="mt-2">{res}</div></div>
    <div className="text-xs text-gray-500">Verification uses RSA SHA-256 with the public key at /api/integrity/public-key. All checks happen in your browser.</div></div>)}
