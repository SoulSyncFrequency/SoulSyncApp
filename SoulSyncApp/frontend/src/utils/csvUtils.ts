export type Item = {
  name: string
  f0: number
  grade: string
  flags: string[]
  purpose_tags: string[]
  emotional_tags: string[]
}

// Simple CSV serializer (escapes quotes, joins with commas)
export function toCSV(items: Item[]): string{
  const header = ['name','f0','grade','flags','purpose_tags','emotional_tags']
  const rows = items.map(x=>[
    x.name,
    String(x.f0),
    x.grade||'',
    (x.flags||[]).join('|'),
    (x.purpose_tags||[]).join('|'),
    (x.emotional_tags||[]).join('|'),
  ])
  const esc=(v:string)=>{
    if(v==null) return ''
    const s=String(v)
    return /[",\n,]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s
  }
  return [header, ...rows].map(r=>r.map(esc).join(',')).join('\n')
}

// Robust CSV parser supporting quoted fields and commas
export function fromCSV(text: string): Item[]{
  const lines = text.replace(/\r/g,'').split('\n').filter(l=>l.trim().length>0)
  if(!lines.length) return []
  const parseLine=(line:string)=>{
    const out:string[]=[]; let i=0; let cur=''; let inQ=false
    while(i<line.length){
      const ch=line[i]
      if(inQ){
        if(ch=='"'){
          if(line[i+1]=='"'){ cur+='"'; i+=2; continue }
          inQ=false; i++; continue
        } else { cur+=ch; i++; continue }
      }else{
        if(ch=='"'){ inQ=true; i++; continue }
        if(ch==','){ out.push(cur.trim()); cur=''; i++; continue }
        cur+=ch; i++; continue
      }
    }
    out.push(cur.trim()); return out
  }
  const header = parseLine(lines[0])
  const req = ['name','f0','grade','flags','purpose_tags','emotional_tags']
  const missing = req.filter(r=>!header.includes(r))
  if(missing.length) throw new Error('CSV missing columns: '+missing.join(', '))
  const idx = Object.fromEntries(header.map((h,i)=>[h,i]))
  const seen = new Set<string>()
  const items: Item[] = []
  for(let li=1; li<lines.length; li++){
    const cols = parseLine(lines[li])
    const name = (cols[idx.name]||'').trim()
    if(!name || seen.has(name)) throw new Error('Duplicate/empty name: '+name)
    seen.add(name)
    const f0 = parseFloat(cols[idx.f0]||'')
    if(isNaN(f0) || f0<0 || f0>1) throw new Error('Invalid f0 for '+name)
    const grade = (cols[idx.grade]||'').trim()
    if(!/^[A-E]$/.test(grade)) throw new Error('Invalid grade for '+name)
    const split = (s:string)=> (s? s.split('|').map(x=>x.trim()).filter(Boolean): [])
    items.push({
      name,
      f0,
      grade,
      flags: split(cols[idx.flags]||''),
      purpose_tags: split(cols[idx.purpose_tags]||''),
      emotional_tags: split(cols[idx.emotional_tags]||''),
    })
  }
  return items
}
