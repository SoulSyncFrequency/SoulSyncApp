import { Request, Response, NextFunction } from 'express'
import { requireEntitlement } from './entitlement'

/**
 * Mounts entitlement guard on a set of path prefixes, configurable via ENV.
 * ENTITLEMENT_PROTECT_PREFIXES=/api/therapy,/api/premium
 */
export function entitlementGlobal(prefixesEnv = process.env.ENTITLEMENT_PROTECT_PREFIXES) {
  const prefixes = (prefixesEnv || '/api/therapy').split(',').map(s => s.trim()).filter(Boolean)
  return (req: Request, res: Response, next: NextFunction) => {
    const path = req.path || req.url || ''
    const match = prefixes.some(p => path.startsWith(p))
    if (!match) return next()
    return requireEntitlement(req, res, next)
  }
}
