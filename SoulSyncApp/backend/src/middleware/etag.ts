import { NextFunction, Request, Response } from 'express'
import crypto from 'crypto'

export function withETag(req: Request, res: Response, next: NextFunction) {
  const oldJson = res.json.bind(res)
  res.json = (body: unknown) => {
    try {
      const raw = JSON.stringify(body)
      const hash = crypto.createHash('sha1').update(raw).digest('hex')
      res.setHeader('ETag', `W/"${hash}"`)
      res.setHeader('Last-Modified', new Date().toUTCString())
      if (req.header('if-none-match') === `W/"${hash}"`) {
        res.status(304)
        return res.send()
      }
      if (req.header('if-modified-since')) {
        const since = new Date(req.header('if-modified-since') as string)
        const last = new Date(res.getHeader('Last-Modified') as string)
        if (last <= since) {
          res.status(304)
          return res.send()
        }
      }
    } catch {}
    return oldJson(body)
  }
  next()
}
