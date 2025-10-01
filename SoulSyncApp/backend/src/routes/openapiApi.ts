import { Router } from 'express'

const router = Router()

router.get('/openapi.json', (_req, res) => {
  const spec = {
    openapi: '3.0.0',
    info: { title: 'SoulSync API', version: '1.0.0' },
    paths: {
      '/api/primary-molecule': {
        get: { summary: 'Get primary molecule', responses: { '200': { description: 'ok' } } }
      }
    }
  }
  res.json(spec)
})

export default router
