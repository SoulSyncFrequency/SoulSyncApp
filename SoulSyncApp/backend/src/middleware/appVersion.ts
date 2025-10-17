
import type { Request, Response, NextFunction } from 'express'
import fs from 'fs'
import path from 'path'

let version = 'unknown'
try {
  const p = path.join(process.cwd(), 'backend', 'package.json')
  const j = JSON.parse(fs.readFileSync(p,'utf-8'))
  version = j.version || 'unknown'
} catch {}

export function appVersion(){
  return (_req:Request, res:Response, next:NextFunction)=>{
    res.setHeader('X-App-Version', version)
    next()
  }
}
