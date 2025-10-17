export function detectRisk(text:string){
  return /(suicide|self[-\s]?harm|violence|kill myself|overdose)/i.test(text||'')
}
