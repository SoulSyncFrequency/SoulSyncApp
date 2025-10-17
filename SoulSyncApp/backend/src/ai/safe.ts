import { ai } from '.'
import { quickBulletSummary } from './heuristics'

export function redactPII(text:string){
  let t = String(text||'')
  t = t.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
  t = t.replace(/\b\+?\d[\d\s\-()]{6,}\b/g, '[phone]')
  t = t.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[card]')
  t = t.replace(/\b\d{9,}\b/g, '[id]')
  return t
}

export function safetyGuard(text:string){
  const bad = /(diagnos|prescript|suicide|self[-\s]?harm|harm\s+others|violence|overdose|contraindicat|emergency)/i
  return !bad.test(text||'')
}

export async function safeSummarize(prompt:string, opts:any={}): Promise<string>{
  const hybrid = process.env.FEATURE_aiGuard==='on' || process.env.FLAG_HYBRID_AI==='true'
  const red = redactPII(prompt)
  if(hybrid && red.length < 600){
    const bullets = quickBulletSummary(red, 6)
    if(bullets.length>=3) return bullets.map(b=>`• ${b}`).join('\n')
  }
  const preamble = "Uloga: siguran, empatičan pomoćnik bez medicinske dijagnoze; ako je sadržaj rizičan, sugeriraj kontaktiranje stručne pomoći.\n"
  const out = await ai.summarize(preamble + red, opts as any)
  if(!safetyGuard(out)){
    return "Sadržaj je osjetljiv. Obrati se stručnjaku ili kontaktiraj hitne službe ako postoji rizik."
  }
  return out
}
