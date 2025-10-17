import { Router } from 'express'
import billingRoute from './billing.routes'
import { requireStepUp } from '../middleware/requireStepUp'
import { requireAuth } from '../middleware/requireAuth'
import { gateFeature } from '../config/flags'

// This route gate keeps billing portal actions with step-up MFA, non-breaking (new path)
const r = Router()

r.use('/billing/secure', gateFeature('billingPortal'), requireAuth, requireStepUp('billing'))

// reuse handlers by proxying to existing billing/portal path if needed
r.get('/billing/secure/portal/:userId', (req, res, next) => {
  // delegate to existing billing routes by rewriting url
  req.url = `/billing/portal/${req.params.userId}`
  ;(billingRoute as any)(req, res, next)
})

export default r
