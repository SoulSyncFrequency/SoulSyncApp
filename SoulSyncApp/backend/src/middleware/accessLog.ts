
import type { Request, Response, NextFunction } from 'express'
import fs from 'fs'
import path from 'path'

export function accessLog(){
  return (req: Request & { id?: string }, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint()
    res.on('finish', ()=>{
      try{
        const end = process.hrtime.bigint()
        const durMs = Number(end - start) / 1e6
        const rec = {
          t: Date.now(),
          id: req.id,
          m: req.method,
          p: req.path,
          s: res.statusCode,
          ms: Math.round(durMs),
          ua: req.headers['user-agent'] || ''
        }
        const dir = path.join(process.cwd(), 'logs')
        fs.mkdirSync(dir, { recursive: true })
        fs.appendFileSync(path.join(dir,'access.ndjson'), JSON.stringify(rec) + '\n', 'utf-8')
      }catch{}
    })
    next()
  }
}
