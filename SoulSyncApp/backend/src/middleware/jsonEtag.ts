
import type { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

export function jsonEtag(){
  return (req:Request, res:Response, next:NextFunction)=>{
    if (req.method !== 'GET') return next()
    const orig = res.json.bind(res)
    ;(res as any).json = (body:any)=>{
      try{
        const raw = Buffer.from(JSON.stringify(body))
        const hash = crypto.createHash('sha1').update(raw).digest('hex') // weak-ish etag
        const etag = 'W/"' + hash + '"'
        res.setHeader('ETag', etag)
        const inm = req.headers['if-none-match']
        if (inm && typeof inm==='string' && inm === etag){
          res.statusCode = 304
          return res.end()
        }
      }catch{}
      return orig(body)
    }
    next()
  }
}
