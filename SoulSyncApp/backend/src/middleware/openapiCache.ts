
import type { Request, Response, NextFunction } from 'express'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export function openapiCache(){
  return (_req:Request, res:Response, next:NextFunction)=>{
    res.setHeader('Cache-Control','public, max-age=300, must-revalidate')
    try{
      const p = path.join(process.cwd(),'backend','openapi','openapi.json')
      const buf = fs.readFileSync(p)
      const hash = crypto.createHash('sha256').update(buf).digest('hex')
      res.setHeader('ETag', hash)
      const stat = fs.statSync(p)
      res.setHeader('Last-Modified', stat.mtime.toUTCString())
    }catch{}
    next()
  }
}
