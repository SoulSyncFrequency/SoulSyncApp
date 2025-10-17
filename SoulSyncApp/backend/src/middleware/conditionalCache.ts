import { NextFunction, Request, Response } from 'express'
import crypto from 'crypto'

/**
 * Adds ETag + Last-Modified for GET responses (json/text) and supports 304 Not Modified.
 * Also sets 'Cache-Control: no-store' for /api/* by default (override per-route if needed).
 */
export function conditionalCache(req: Request, res: Response, next: NextFunction) {
  // API default no-store
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store')
  }
  if (req.method.toUpperCase() !== 'GET') return next()

  const origJson = res.json.bind(res)
  const origSend = res.send.bind(res)

  function finalize(body: unknown, sender: (b: unknown) => any) {
    try {
      const raw = typeof body === 'string' ? body : JSON.stringify(body)
      const etag = 'W/' + crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32)
      const lastModified = new Date().toUTCString()
      res.setHeader('ETag', etag)
      res.setHeader('Last-Modified', lastModified)

      const inm = req.header('if-none-match')
      const ims = req.header('if-modified-since')
      if (inm && inm === etag) {
        return res.status(304).end()
      }
      // Basic IMS check: if client has newer/equal timestamp, 304
      if (ims) {
        const t = Date.parse(ims)
        if (!isNaN(t) && t >= Date.now() - 1000) {
          return res.status(304).end()
        }
      }
    } catch {}
    return sender(body)
  }

  res.json = (b: unknown) => finalize(b, origJson)
  res.send = (b: unknown) => finalize(b, origSend)
  next()
}
