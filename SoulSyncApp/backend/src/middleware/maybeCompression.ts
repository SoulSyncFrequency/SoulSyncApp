
import type { Request, Response, NextFunction } from 'express'

export function maybeCompression(){
  return (_req:Request, _res:Response, next:NextFunction)=>{
    try{
      if ((process.env.COMPRESSION_ENABLED||'false').toLowerCase()!=='true') return next()
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const compression = require('compression')
      return compression({ level: 6 })
    }catch{
      return next() // module not installed, noop
    }
  }
}
