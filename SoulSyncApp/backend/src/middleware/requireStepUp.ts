import type { Request, Response, NextFunction } from 'express'

const DEFAULT_TTL_MS = 10 * 60 * 1000 // 10 minutes

export function requireStepUp(scope: string = 'default'){
  return (req: Request, res: Response, next: NextFunction) => {
    const sess: any = (req as any).session || {}
    const claim = sess.mfaStepUp || {}
    const now = Date.now()
    const ok = claim?.ok === true && (now - (claim?.ts||0)) < (Number(process.env.MFA_STEPUP_TTL_MS||DEFAULT_TTL_MS))
    if(!ok) return res.status(401).json({ error:{ code:'stepup_required', message:`Step-up MFA required for scope: ${scope}` } })
    next()
  }
}
