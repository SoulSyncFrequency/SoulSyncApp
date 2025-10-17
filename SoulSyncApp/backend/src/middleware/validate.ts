import { AnyZodObject, ZodError } from 'zod'
import { Request, Response, NextFunction } from 'express'

export function validateQuery(schema: AnyZodObject){
  return (req: Request, res: Response, next: NextFunction)=>{
    try{
      req.query = schema.parse(req.query)
      next()
    }catch(e){
      const ze = e as ZodError
      return res.status(400).json({ error: 'Invalid query', details: ze.flatten() })
    }
  }
}

export function validateBody(schema: AnyZodObject){
  return (req: Request, res: Response, next: NextFunction)=>{
    try{
      req.body = schema.parse(req.body)
      next()
    }catch(e){
      const ze = e as ZodError
      return res.status(400).json({ error: 'Invalid body', details: ze.flatten() })
    }
  }
}
