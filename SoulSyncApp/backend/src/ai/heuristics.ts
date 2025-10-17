export function quickBulletSummary(text:string, max=6){
  const clean = String(text||'').replace(/\s+/g,' ').trim()
  if(!clean) return []
  const sentences = clean.split(/(?<=[.!?])\s+/).slice(0, 20)
  const bullets:string[] = []
  for(const s of sentences){
    const t = s.replace(/^[-•\s]+/,'').trim()
    if(t.length<4) continue
    if(!bullets.find(b=>b.toLowerCase()===t.toLowerCase())) bullets.push(t)
    if(bullets.length>=max) break
  }
  return bullets
}
