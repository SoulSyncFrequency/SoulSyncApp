import type { Request, Response, NextFunction } from 'express'
export function mockAuth(req:Request,_res:Response,next:NextFunction){
  if(process.env.MOCK_AUTH==='1'){
    ;(req as any).user = { id: 'test-user-1', email: 'test@soulsync.local', roles: ['admin'] }
    ;(req as any).tenant = { id: 'tenant-1' }
    ;(req as any).session = { mfaStepUp: { ok:true, ts: Date.now(), factor:'test' } }
  }
  next()
}
