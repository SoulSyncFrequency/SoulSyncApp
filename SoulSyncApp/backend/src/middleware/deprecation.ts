
import type { Request, Response, NextFunction } from 'express'
export function deprecation(){
  const mapRaw = process.env.DEPRECATE_ROUTES || ''
  let map:any = {}
  try { map = mapRaw ? JSON.parse(mapRaw) : {} } catch { map = {} }
  return (req:Request, res:Response, next:NextFunction) => {
    const cfg = map[req.path]
    if (cfg){
      // Set RFC 8594 style headers
      res.setHeader('Deprecation', 'true')
      if (cfg.sunset) res.setHeader('Sunset', cfg.sunset)
      if (cfg.link) res.setHeader('Link', `<${cfg.link}>; rel="deprecation"`)
      if (cfg.alt) res.setHeader('Link', `<${cfg.alt}>; rel="successor-version"`)
      if (cfg.migration) res.setHeader('Link', `<${cfg.migration}>; rel="alternate"`)
    }
    next()
  }
}
