import { Request, Response, NextFunction } from 'express'

function parseList(){
  const raw = (process.env.IP_ALLOWLIST || '').trim()
  if(!raw) return []
  return raw.split(',').map(s=> s.trim()).filter(Boolean)
}
export function ipAllowlist(){ 
  const list = parseList()
  if(list.length === 0) return (_req:Request,_res:Response,next:NextFunction)=> next()
  return (req: Request, res: Response, next: NextFunction)=>{
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip
    if(list.includes(ip)) return next()
    return res.status(403).json({ ok:false, code:'ip_forbidden' })
  }
}
