// backend/scripts/rate-policy-check.ts
import fs from 'fs'
import path from 'path'

const repoRoot = path.resolve(__dirname, '..')
const policyTs = path.join(repoRoot, 'src', 'middleware', 'perRouteRateLimit.ts')
const proposal = path.resolve(process.env.RATE_POLICY_PROPOSAL || './proposals/rate-policy.json')

function extractConfigs(ts:string){
  const m = ts.match(/const\s+configs\s*:[^=]+=\s*\{([\s\S]*?)\}\s*/)
  if(!m) return {}
  const objLiteral = '{' + m[1] + '}'
  // Very naive conversion to JSON
  const jsonish = objLiteral
    .replace(/(\w+)\s*:/g, '"$1":')   // keys
    .replace(/'/g, '"')                  // quotes
  try { return JSON.parse(jsonish) } catch { return {} }
}

function diff(a:any,b:any){
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).sort()
  const lines:string[] = []
  for(const k of keys){
    const va = JSON.stringify(a[k]||null)
    const vb = JSON.stringify(b[k]||null)
    if(va!==vb) lines.push(`- ${k}: ${va}\n+ ${k}: ${vb}`)
  }
  return lines.join('\n')
}

const currentTs = fs.readFileSync(policyTs, 'utf-8')
const current = extractConfigs(currentTs)
let proposed:any = {}
try { proposed = JSON.parse(fs.readFileSync(proposal, 'utf-8')) } catch {}

const report = [
  '# Rate‑policy check',
  '',
  '**Current policies:**',
  '```json',
  JSON.stringify(current, null, 2),
  '```',
  '',
  '**Proposed policies:**',
  '```json',
  JSON.stringify(proposed, null, 2),
  '```',
  '',
  '**Diff:**',
  '```diff',
  diff(current, proposed) || 'No changes',
  '```'
].join('\n')

const out = path.resolve(process.env.GITHUB_STEP_SUMMARY || './rate-policy-report.md')
fs.writeFileSync(out, report, 'utf-8')
console.log(report)
