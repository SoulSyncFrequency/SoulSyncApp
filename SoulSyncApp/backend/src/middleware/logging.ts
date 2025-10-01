import pinoHttp from 'pino-http'
import { nanoid } from 'nanoid'
import { logger } from '../logger'

export const loggingMiddleware = pinoHttp({
  logger,
  genReqId: (req:any)=> req.headers['x-request-id'] || nanoid(10),
  customProps: (req:any)=>({ ip: req.ip }),
  redact: { paths: ['req.headers.authorization'], censor: '***' }
})
