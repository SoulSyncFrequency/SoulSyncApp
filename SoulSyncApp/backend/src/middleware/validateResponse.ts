import { Response } from 'express'
import { z } from 'zod'

export function validateResponse(schema: any){
  return function(_req:any, res:Response, next:any){
    const oldJson = res.json
    res.json = function(data:any){
      try {
        schema.parse(data)
      } catch(e:any){
        console.error('Response validation failed', e)
        res.status(500)
        return oldJson.call(this, { error: { code:'invalid_response', message: e.message } })
      }
      return oldJson.call(this, data)
    }
    next()
  }
}
