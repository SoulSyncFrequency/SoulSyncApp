export function parseFlags(){
  const raw = process.env.FEATURE_FLAGS || ''
  const flags = new Set<string>((raw||'').split(',').map(s=>s.trim()).filter(Boolean))
  return flags
}

export function isEnabled(name: string){
  return parseFlags().has(name)
}
