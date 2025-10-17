import type { Request, Response, NextFunction } from 'express'
export function cspNonce(req:Request, res:Response, next:NextFunction){
  const nonce = Buffer.from(String(Date.now()) + Math.random().toString(36).slice(2)).toString('base64')
  ;(res as any).locals = (res as any).locals || {}
  ;(res as any).locals.nonce = nonce
  const policy = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data:`,
    `connect-src 'self'`,
    `frame-ancestors 'none'`
  ].join('; ')
  res.setHeader('Content-Security-Policy', policy)
  next()
}
