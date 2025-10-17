const PATTERN = /(suicide|self\s*harm|kill myself|violence|overdose)/i
export function shouldBlock(text:string){ return PATTERN.test(String(text||'')) }
