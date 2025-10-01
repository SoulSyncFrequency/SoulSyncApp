/**
 * Simple feature flags.
 * - Individual env vars: FEATURE_<NAME>=on/off/true/false
 * - JSON map: FEATURE_FLAGS='{"newAuth":true,"betaUI":false}'
 */
function parseBool(v?: string){
  if (!v) return false
  return ['1','true','on','yes','enabled'].includes(String(v).toLowerCase())
}

const jsonMap = (() => {
  try { return JSON.parse(process.env.FEATURE_FLAGS || '{}') } catch { return {} }
})()

export function isEnabled(name: string, def=false){
  const k = 'FEATURE_' + name.replace(/[^A-Za-z0-9_]/g, '').toUpperCase()
  if (k in process.env) return parseBool(process.env[k])
  if (name in jsonMap) return !!jsonMap[name]
  return def
}

import type { Request, Response, NextFunction } from 'express'
export function gateFeature(name: string){
  return (_req: Request, res: Response, next: NextFunction) => {
    if (!isEnabled(name)) return res.status(404).json({ error: { code:'not_found', message:'Not available' } })
    next()
  }
}
