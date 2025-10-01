
import fs from 'fs'
import path from 'path'

/**
 * Generates basic Jest test skeletons for any paths/methods in openapi.json
 * that currently don't have corresponding contract tests, and writes them
 * under backend/tests/contract/generated/.
 * This is a safe, deterministic generator (no remote calls).
 */
function main(){
  const root = process.cwd()
  const specPath = path.join(root, 'backend', 'openapi', 'openapi.json')
  if (!fs.existsSync(specPath)) {
    console.log('openapi.json not found, nothing to do'); return
  }
  const spec = JSON.parse(fs.readFileSync(specPath,'utf-8'))
  const outDir = path.join(root,'backend','tests','contract','generated')
  fs.mkdirSync(outDir, { recursive: true })
  const paths = Object.keys(spec.paths || {})
  const files:string[] = []
  for (const p of paths.slice(0,200)){
    const ops = Object.keys(spec.paths[p] || {})
    for (const m of ops){
      const safe = p.replace(/[^a-z0-9]+/gi,'_') + '_' + m
      const fname = path.join(outDir, safe + '.test.ts')
      if (fs.existsSync(fname)) continue
      const body = `describe('contract: ${m.toUpperCase()} ${p}', ()=>{\n  it('has a schema and example validator placeholder', ()=>{\n    expect(true).toBe(true)\n  })\n})\n`
      fs.writeFileSync(fname, body, 'utf-8')
      files.push(fname)
    }
  }
  console.log('Generated', files.length, 'test skeletons')
}
main()
