import type { Request, Response, NextFunction } from 'express'
export function coopCoep(_req:Request,res:Response,next:NextFunction){
  res.setHeader('Cross-Origin-Opener-Policy','same-origin')
  res.setHeader('Cross-Origin-Embedder-Policy','require-corp')
  next()
}
