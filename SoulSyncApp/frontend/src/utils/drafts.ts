export function saveDraft(key:string, data:any){ localStorage.setItem('draft:'+key, JSON.stringify({ t: Date.now(), data })) }
export function loadDraft(key:string){ try{ const v=localStorage.getItem('draft:'+key); return v? JSON.parse(v):null }catch{return null} }
export async function promoteDraft(key:string){
  const v = loadDraft(key); if(!v) return { ok:false }
  const r = await fetch('/therapy/drafts/promote', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(v.data) })
  const j = await r.json(); if(j.ok) localStorage.removeItem('draft:'+key); return j
}
