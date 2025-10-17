import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'

const r = Router()

const spec = {
  openapi: '3.0.0',
  info: { title: 'Admin API', version: '1.0.0' },
  paths: {
    '/admin/queues': {
      get: {
        summary: 'Queues summary',
        security: [{ AdminToken: [] }],
        responses: { '200': { description: 'OK' }, '403': { description: 'Forbidden' } }
      }
    },
    '/admin/queues/{name}/dlq': {
      get: {
        summary: 'Read DLQ for queue',
        parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ AdminToken: [] }],
        responses: { '200': { description: 'OK' }, '403': { description: 'Forbidden' } }
      }
    }
  },
  components: {
    securitySchemes: {
      AdminToken: { type: 'apiKey', in: 'header', name: 'x-admin-token' }
    }
  }
}

r.get('/api/openapi.admin.json', (_req,res)=> res.json(spec))
r.use('/admin/docs', swaggerUi.serve, swaggerUi.setup(spec))

export default r
