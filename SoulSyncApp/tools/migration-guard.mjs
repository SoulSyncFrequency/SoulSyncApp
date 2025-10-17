// Simple migration guard: fail on destructive SQL unless explicitly allowed
import fs from 'fs'
import path from 'path'

const repo = process.cwd()
const migDirs = [
  path.join(repo, 'backend', 'prisma', 'migrations'),
  path.join(repo, 'migrations'),
  path.join(repo, 'db', 'migrations'),
]

const DANGEROUS = [/\bdrop\s+table\b/i, /\bdrop\s+column\b/i, /\balter\s+table\b.*\bdrop\b/i]
let issues = []

for (const dir of migDirs) {
  if (!fs.existsSync(dir)) continue
  for (const folder of fs.readdirSync(dir)) {
    const p = path.join(dir, folder)
    if (!fs.statSync(p).isDirectory()) continue
    for (const f of fs.readdirSync(p)) {
      if (!/\.(sql|prisma)$/i.test(f)) continue
      const fp = path.join(p, f)
      const t = fs.readFileSync(fp, 'utf-8')
      if (t.includes('MIGRATION_GUARD_ALLOW')) continue // explicit allow
      for (const rx of DANGEROUS) {
        if (rx.test(t)) issues.push({ file: fp, match: rx.toString() })
      }
    }
  }
}

if (issues.length) {
  console.error('Destructive migration patterns found:')
  for (const i of issues) console.error('-', i.file, '=>', i.match)
  process.exit(1)
} else {
  console.log('Migration guard passed.')
}
