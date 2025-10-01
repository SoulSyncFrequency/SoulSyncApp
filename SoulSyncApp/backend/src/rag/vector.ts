type Vec = Map<string, number>

function tokenize(t:string){ 
  return (t.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').match(/[a-z0-9čćđšž]+/g)||[])
    .filter(x=>x.length>1)
}
function vectorize(text:string): Vec{
  const v=new Map<string,number>()
  for(const tok of tokenize(text)){ v.set(tok, (v.get(tok)||0)+1) }
  return v
}
function cosine(a:Vec, b:Vec){
  let dot=0, na=0, nb=0
  for(const [k,va] of a){ dot += (va*(b.get(k)||0)); na += va*va }
  for(const [,vb] of b){ nb += vb*vb }
  if(!na||!nb) return 0
  return dot / (Math.sqrt(na)*Math.sqrt(nb))
}

export type Doc = { id:string, text:string, meta?: any }
const index: { doc:Doc, vec:Vec }[] = []

export function ingest(docs:Doc[]){
  index.length=0
  for(const d of docs){ index.push({ doc:d, vec: vectorize(d.text) }) }
}

export function search(q:string, k=5){
  const qv = vectorize(q)
  return index
    .map(it=> ({ doc: it.doc, score: cosine(qv, it.vec) }))
    .sort((a,b)=> b.score - a.score)
    .slice(0,k)
}
