import { Request, Response, NextFunction } from 'express'

export function basicOk(req: Request){
  const hdr = req.headers['authorization']
  if(!hdr || !hdr.toString().startsWith('Basic ')) return false
  const b64 = hdr.toString().slice(6)
  const [u,p] = Buffer.from(b64,'base64').toString('utf8').split(':')
  if(!process.env.ADMIN_USER || !process.env.ADMIN_PASS) return false
  return (u===process.env.ADMIN_USER && p===process.env.ADMIN_PASS)
}

export function basicGuard(req: Request, res: Response, next: NextFunction){
  if(basicOk(req)) return next()
  res.setHeader('WWW-Authenticate','Basic realm="admin"')
  return res.status(401).send('Unauthorized')
}


export function parseBasicUser(req: Request): string | null {
  const hdr = req.headers['authorization']
  if(!hdr || !hdr.toString().startsWith('Basic ')) return null
  const b64 = hdr.toString().slice(6)
  const [u] = Buffer.from(b64,'base64').toString('utf8').split(':')
  return u || null
}
