
import type { Request, Response, NextFunction } from 'express'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export function adminAudit(){
  return (req:Request, _res:Response, next:NextFunction) => {
    try{
      const dir = path.join(process.cwd(), 'logs')
      fs.mkdirSync(dir, { recursive: true })
      const token = (req.headers['x-admin-token'] as string)||''
      const tokHash = token ? crypto.createHash('sha256').update(token).digest('hex').slice(0,16) : null
      const rec = { t: Date.now(), path: req.path, method: req.method, adminTokenHash: tokHash }
      fs.appendFileSync(path.join(dir, 'admin_audit.ndjson'), JSON.stringify(rec)+'\n', 'utf-8')
    }catch{}
    next()
  }
}
