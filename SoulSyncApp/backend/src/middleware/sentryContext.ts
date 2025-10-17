
import type { Request, Response, NextFunction } from 'express'
import * as Sentry from '@sentry/node'
import crypto from 'crypto'

function h(s:string){
  return crypto.createHash('sha256').update(s||'').digest('hex').slice(0,16)
}

export function sentryContext(){
  return (req: Request & { user?: any }, _res: Response, next: NextFunction) => {
    try{
      const route = (req.route && (req.baseUrl + (req.route.path||''))) || req.path || 'unknown'
      const userId = req.user?.id ? h(String(req.user.id)) : undefined
      const planId = (req.params && (req.params.planId||req.body?.planId)) ? h(String(req.params.planId || req.body?.planId)) : undefined
      Sentry.configureScope(scope => {
        scope.setTag('route', route)
        if (userId) scope.setTag('user', userId)
        if (planId) scope.setTag('plan', planId)
        const tier = (req.headers['x-plan-tier'] as string) || undefined
        if (tier) scope.setTag('tier', tier)
      })
    }catch{}
    next()
  }
}
