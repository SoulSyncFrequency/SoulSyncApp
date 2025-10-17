import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'
import { buildOpenAPISpec } from '../openapi'

const router = Router()

router.use('/docs', (req, res, next) => {
  try{
    const base = process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`
    const spec = buildOpenAPISpec(base)
    ;(swaggerUi as any).setup(spec)(req, res, next)
  } catch (e) {
    next(e)
  }
}, swaggerUi.serve)

export default router
