import { NextFunction, Request, Response } from 'express'
import crypto from 'crypto'
import { logger } from '../logger'

/**
 * X-Signature: sha256=hex(hmacSHA256(body, SECRET))
 */
export function verifyWebhookSignature(envVar: string = 'WEBHOOK_SECRET') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const secret = process.env[envVar]
      if (!secret) {
        logger.warn('Webhook secret not set; skipping signature verification')
        return next()
      }
      const sig = req.header('x-signature') || ''
      const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})
      const h = crypto.createHmac('sha256', secret).update(raw).digest('hex')
      const expected = `sha256=${h}`
      const ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
      if (!ok) {
        logger.warn({ expected, got: sig }, 'Webhook signature mismatch')
        return res.status(401).json({ type: 'about:blank', title: 'Unauthorized', status: 401, detail: 'Invalid signature' })
      }
      next()
    } catch (e) {
      logger.error({ e }, 'verifyWebhookSignature error')
      return res.status(400).json({ type: 'about:blank', title: 'Bad Request', status: 400 })
    }
  }
}
