// Simple env checker: scans process.env/import.meta.env keys in code and compares to .env.example
import fs from 'fs'
import path from 'path'

function scan(dir, keys = new Set()) {
  for (const e of fs.readdirSync(dir)) {
    const p = path.join(dir, e)
    const st = fs.statSync(p)
    if (st.isDirectory()) {
      if (e === 'node_modules' || e.startsWith('.git')) continue
      scan(p, keys)
    } else if (/\.(ts|tsx|js|jsx)$/.test(e)) {
      const t = fs.readFileSync(p, 'utf-8')
      for (const m of t.matchAll(/process\.env\.([A-Z0-9_]+)/g)) keys.add(m[1])
      for (const m of t.matchAll(/import\.meta\.env\.([A-Z0-9_]+)/g)) keys.add(m[1])
    }
  }
  return keys
}

const repoRoot = process.cwd()
const keys = scan(repoRoot)
const example = fs.readFileSync(path.join(repoRoot, '.env.example'), 'utf-8')
const exampleKeys = new Set(
  example.split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => l.split('=')[0].trim())
)

const missing = [...keys].filter(k => !exampleKeys.has(k))
if (missing.length) {
  console.error('Missing keys in .env.example:', missing.join(', '))
  process.exit(1)
} else {
  console.log('All env keys present in .env.example')
}
