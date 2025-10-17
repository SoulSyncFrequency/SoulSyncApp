import type { Request, Response, NextFunction } from 'express'
import { config } from '../config'
export function requireMfa(req:Request,res:Response,next:NextFunction){
  if(!config.REQUIRE_MFA) return next()
  const ok = (req as any).session?.mfaStepUp?.ok
  if(ok) return next()
  return res.status(401).json({ error:{ code:'mfa_required' } })
}
