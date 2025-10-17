
import type { Request, Response, NextFunction } from 'express'
/**
 * For /public assets with fingerprint (e.g., .[hash].js/.css), set long immutable cache.
 * API routes stay 'no-store' via existing middleware.
 */
export function staticCache(){
  const re = /\.[a-f0-9]{8,}\./i
  return (req:Request, res:Response, next:NextFunction)=>{
    if (req.path.startsWith('/assets/') || req.path.startsWith('/static/')){
      if (re.test(req.path)){
        res.setHeader('Cache-Control','public, max-age=31536000, immutable')
      } else {
        res.setHeader('Cache-Control','public, max-age=300')
      }
    }
    next()
  }
}
