import helmet from 'helmet'
import compression from 'compression'
import { Express } from 'express'

export function applySecurity(app: Express){
  const isDev = (process.env.NODE_ENV||'development') !== 'production'
  app.use(helmet({
    contentSecurityPolicy: isDev ? false : {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'","'unsafe-inline'"],
        styleSrc: ["'self'","'unsafe-inline'"],
        imgSrc: ["'self'","data:","blob:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: null
      }
    },
    crossOriginEmbedderPolicy: !isDev,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'no-referrer' },
    frameguard: { action: 'deny' }
  } as any))
  app.use((_req,_res,next)=>{ _res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()'); _res.setHeader('Cross-Origin-Resource-Policy','same-origin'); _res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains'); next() })
  app.use(compression())
}


/**
 * Optional CSP report-only toggle via env CSP_REPORT_ONLY=true and report URI /csp-report
 */
export function cspReportOnlyIfEnabled(app:any){
  if(String(process.env.CSP_REPORT_ONLY||'false')==='true'){
    // Helmet CSP is set elsewhere; we add a Report-To / report-uri header via simple middleware
    app.use((_req:any, res:any, next:any)=>{ 
      res.setHeader('Content-Security-Policy-Report-Only', (res.getHeader('Content-Security-Policy') as string) || "")
      res.setHeader('Report-To', JSON.stringify({ group:'csp-endpoint', max_age:10886400, endpoints:[{url:'/csp-report'}] }))
      next()
    })
  }
}


/**
 * Stricter CSP: remove unsafe-inline unless explicitly allowed
 */
export function applyStrictCsp(app:any){
  const allowInline = String(process.env.ALLOW_UNSAFE_INLINE||'false')==='true'
  const directives:any = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    frameAncestors: ["'none'"]
  }
  if(allowInline){
    directives.scriptSrc.push("'unsafe-inline'")
    directives.styleSrc.push("'unsafe-inline'")
  }
  const helmet = require('helmet')
  app.use(helmet.contentSecurityPolicy({ directives }))
}


// Extra security headers
import { Request, Response, NextFunction } from 'express'
export function extraSecurityHeaders(_req:Request,res:Response,next:NextFunction){
  res.setHeader('Referrer-Policy','no-referrer')
  res.setHeader('Permissions-Policy','geolocation=(), microphone=(), camera=()')
  res.setHeader('Expect-CT','max-age=86400, enforce')
  res.setHeader('X-Frame-Options','DENY')
  res.setHeader('X-Content-Type-Options','nosniff')
  next()
}
