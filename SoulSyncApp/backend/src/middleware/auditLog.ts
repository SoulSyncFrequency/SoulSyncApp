import { redactPII } from '../ai/safe'
import { NextFunction, Request, Response } from 'express'
import { logger } from '../logger'

import fs from 'fs'
import path from 'path'

export function auditLog(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  const { method, originalUrl } = req
  // @ts-expect-error requestId set by requestId middleware
  const requestId: string | undefined = (req as unknown).requestId
  // @ts-expect-error populated by auth, if available
  const userId: string | undefined = req.user?.id

  res.on('finish', () => {
    const duration = Date.now() - start
    const status = res.statusCode
    logger.info({ method, url: originalUrl, status, duration, userId, requestId }, 'audit')
    try {
      const dir = path.resolve(process.cwd(), 'logs')
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      const date = new Date().toISOString().slice(0,10)
      const file = path.join(dir, `audit-${date}.log`)
      const line = JSON.stringify({ ts: new Date().toISOString(), method, url: originalUrl, status, duration, userId, requestId }) + '\n'
      fs.appendFile(file, line, () => {})
    } catch {}

  })
  next()
}
