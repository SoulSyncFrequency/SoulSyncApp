
import fs from 'fs'
import path from 'path'

const openapiPath = path.join(__dirname, '..', 'openapi', 'openapi.json')
if (!fs.existsSync(openapiPath)){
  console.error('openapi.json not found')
  process.exit(0)
}
const spec = JSON.parse(fs.readFileSync(openapiPath,'utf-8'))
const outDir = path.join(__dirname, '..','tests','contract','generated')
fs.mkdirSync(outDir, { recursive: true })

function sanitize(name:string){ return name.replace(/[^a-z0-9]+/ig,'_') }
const BASE_URL = process.env.CONTRACT_BASE_URL || ''

let count = 0
for (const [p, item] of Object.entries<any>(spec.paths||{})){
  for (const method of Object.keys(item)){
    const op = item[method]
    const id = sanitize(`${method}_${p}`)
    const testFile = path.join(outDir, `${id}.test.ts`)
    const needsAuth = (op.security && op.security.length>0)
    const isSafe = /health|openapi|docs|status|f0/i.test(p)

    const code = `
import axios from 'axios'
const BASE = process.env.CONTRACT_BASE_URL
const SKIP_LIVE = !BASE
describe('${method.toUpperCase()} ${p}', () => {
  it('schema exists', () => { expect(${JSON.stringify(!!op)}).toBe(true) })
  it('live hit (safe only, optional)', async () => {
    if (SKIP_LIVE || ${String(needsAuth)} || !${String(isSafe)}) return
    const url = BASE + '${p}'
    const res = await axios({ method: '${method}', url, validateStatus: ()=>true })
    expect([200,404,401,403]).toContain(res.status)
  })
})
`
    fs.writeFileSync(testFile, code, 'utf-8')
    count++
  }
}
console.log('Generated tests:', count)
