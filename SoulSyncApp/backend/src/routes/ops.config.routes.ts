
import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

function sha(s:string){ return crypto.createHash('sha256').update(s).digest('hex') }
function load(p:string){ try{ return fs.readFileSync(p,'utf-8') }catch{ return '' } }

const router = Router()
router.get('/ops/config-diff', (_req, res) => {
  const root = process.cwd()
  const pkgPath = path.join(root,'backend','package.json')
  const openapiPath = path.join(root,'backend','openapi','openapi.json')

  const pkgRaw = load(pkgPath)
  const specRaw = load(openapiPath)

  const pkg = pkgRaw ? JSON.parse(pkgRaw) : {}
  const etag = sha((pkg.version||'0.0.0') + '|' + sha(specRaw))

  // Canonical minimal env snapshot (safe keys only)
  const keys = ((process.env.OPS_CONFIG_DIFF_KEYS||'NODE_ENV,CSP_REPORT_ONLY,MAINTENANCE_MODE,SUPPL_REQUIRE_CLINICIAN_OK,PREGNENOLONE_FEATURE_ENABLED,PROGESTE_FEATURE_ENABLED').split(',').map(s=>s.trim()).filter(Boolean)))
  const env:any = {}
  for (const k of keys){ env[k] = process.env[k] || undefined }

  res.setHeader('ETag', etag)
  res.json({
    ok: true,
    version: pkg.version || 'unknown',
    hashes: {
      package_json: sha(pkgRaw),
      openapi_json: sha(specRaw)
    },
    env: env
  })
})

export default router
