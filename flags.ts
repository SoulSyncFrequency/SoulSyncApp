export async function fetchFlags(): Promise<Set<string>>{
  try {
    const res = await fetch('/api/flags')
    const data = await res.json()
    return new Set<string>(data?.flags || [])
  } catch { return new Set() }
}

export function hasFlag(flags: Set<string>, name: string){ return flags.has(name) }
