
import fs from 'fs'
import path from 'path'

describe('Critical endpoints response snapshot (OpenAPI)', () => {
  const snapPath = path.join(__dirname, './responses.snapshot.json')
  const specPath = path.join(__dirname, '../openapi/openapi.json')
  if (!fs.existsSync(snapPath) || !fs.existsSync(specPath)){
    it('skipped (missing files)', ()=>{}); return
  }
  const baseline = JSON.parse(fs.readFileSync(snapPath,'utf-8'))
  const spec = JSON.parse(fs.readFileSync(specPath,'utf-8'))
  const current:any = {}
  const list:[string,string][] = [
    ['get','/ops/status'],
    ['get','/api/supplements/summary'],
    ['get','/api/supplements/plans'],
    ['get','/admin/audit/admin-actions'],
    ['get','/ops/flags'],
    ['get','/ops/config-diff'],
    ['get','/ops/ping-db'],
    ['get','/ops/ping-redis'],
    ['get','/ops/ping-smtp'],
    ['get','/ops/ping-s3'],
    ['get','/ops/backup-status']
  ]
  for (const [m,p] of list){
    current[`${m}:${p}`] = (spec.paths?.[p]?.[m]?.responses)||{}
  }
  it('matches stored responses snapshot', () => {
    expect(current).toEqual(baseline)
  })
})
