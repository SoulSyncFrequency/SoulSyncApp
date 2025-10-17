#!/usr/bin/env node
/**
 * Hybrid dependency check:
 * - Warn on minor/patch behind
 * - Fail CI if any dependency is >=2 MAJOR versions behind
 *
 * Usage: node tools/hybrid-dep-check.mjs <dir1> <dir2> ...
 * If no dirs provided, defaults to 'backend'.
 */
import { execSync } from 'node:child_process'
import { join } from 'node:path'
import fs from 'node:fs'

const targets = process.argv.slice(2).length ? process.argv.slice(2) : ['backend']

function parseMajor(v){
  if (!v) return null
  // strip leading ^ ~ >= <= etc, split by dot
  const norm = String(v).replace(/^[^0-9]*/, '')
  const m = norm.split('.')[0]
  const n = Number(m)
  return Number.isFinite(n) ? n : null
}

let hardFailures = []
let hasWarnings = false

for (const dir of targets){
  console.log(`\n==> Checking dependencies in: ${dir}`)
  try {
    // npm outdated returns non-zero when outdated are found; we don't want CI to fail here
    const out = execSync('npm outdated --json || true', { cwd: dir, stdio: ['ignore','pipe','pipe'] }).toString()
    if (!out.trim()) { console.log('No outdated deps or not a package dir.'); continue }
    let data
    try { data = JSON.parse(out) } catch(e){ console.error('Failed to parse npm outdated JSON for', dir); continue }
    const rows = Object.entries(data) // [ [name, {current,wanted,latest,type,location}] ]
    if (!rows.length){ console.log('No outdated deps.'); continue }
    for (const [name, info] of rows){
      const curM = parseMajor(info.current)
      const latM = parseMajor(info.latest)
      if (curM==null || latM==null) continue
      const delta = latM - curM
      if (delta >= 2){
        hardFailures.push({ dir, name, current: info.current, latest: info.latest, delta })
      } else if (delta >= 1){
        hasWarnings = true
        console.log(`WARN: Major behind for ${name}@${info.current} -> latest ${info.latest} (Δ=${delta}) in ${dir}`)
      } else if (info.current !== info.latest){
        hasWarnings = true
        console.log(`INFO: Update available for ${name}@${info.current} -> ${info.latest} in ${dir}`)
      }
    }
  } catch (e){
    console.error('Error running npm outdated in', dir, e.message)
  }
}

if (hardFailures.length){
  console.error('\n❌ Dependency MAJOR lag (>=2) detected:')
  for (const r of hardFailures){
    console.error(` - ${r.dir}: ${r.name} ${r.current} -> ${r.latest} (Δ=${r.delta})`)
  }
  process.exit(1)
}

if (hasWarnings){
  console.log('\n✅ No critical major lags (>=2). Warnings above for minor/major Δ=1 or patch.')
} else {
  console.log('\n✅ All dependencies up-to-date.')
}
