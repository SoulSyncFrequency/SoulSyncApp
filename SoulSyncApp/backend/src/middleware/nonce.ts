import crypto from 'crypto'
import { Request, Response, NextFunction } from 'express'

export function genNonce(len: number = 16){
  return crypto.randomBytes(len).toString('base64')
}

// Attach a fresh nonce to res.locals so templates or renderers can use it
export function nonceAttach(_req: Request, res: Response, next: NextFunction){
  try{
    (res.locals as any).cspNonce = genNonce(16)
  }catch{}
  next()
}

// Build a CSP header using the nonce. Keep fairly strict defaults.
export function nonceCspHeader(_req: Request, res: Response, next: NextFunction){
  const n = (res.locals as any).cspNonce
  const reportUri = process.env.CSP_REPORT_URI || '/api/v1/csp-report'
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${n}'`,
    `style-src 'self' 'nonce-${n}'`,
    `img-src 'self' data: blob:`,
    `connect-src 'self'`,
    `object-src 'none'`,
    `base-uri 'none'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ]
  if(reportUri) directives.push(`report-uri ${reportUri}`)
  try{
    const reportOnly = String(process.env.CSP_REPORT_ONLY || 'true') === 'true'
    res.setHeader(reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy', directives.join('; '))
  }catch{}
  next()
}

// Small helper to render tags with nonce from res.locals in string templates
export function withNonceTag(res: Response){
  const n = (res.locals as any).cspNonce || ''
  return {
    script: (attrs: string = '') => `<script nonce="${n}" ${attrs}></script>`,
    style: (css: string) => `<style nonce="${n}">${css}</style>`,
    nonce: n
  }
}
