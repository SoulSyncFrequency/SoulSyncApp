import type { Request, Response, NextFunction } from 'express'
import { ai } from '../ai'
import { isEnabled } from '../config/flags'

export async function aiModeration(req: Request, res: Response, next: NextFunction){
  try {
    if (!isEnabled('ai_moderation')) return next()
    const text = (req.body && (req.body.text || req.body.content || req.body.message)) || ''
    if (!text) return next()
    const result = await (ai.moderate ? ai.moderate(text) : Promise.resolve({ allowed: true }))
    if (result && result.allowed === false){
      return res.status(403).json({ error: { code:'forbidden', message:'Content rejected by moderation' } })
    }
  } catch (e) {
    // fail-open to not block legit traffic if provider down
  }
  next()
}
