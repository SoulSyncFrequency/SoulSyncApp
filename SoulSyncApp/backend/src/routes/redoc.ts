import { Router } from 'express'
const router = Router()
router.get('/redoc', async (_req, res)=>{
  try{
    const { buildOpenAPISpec } = require('../openapi')
    const spec = buildOpenAPISpec(process.env.API_BASE_URL || '/')
    const redoc = require('redoc-express')
    return redoc({ title: 'SoulSync API', specUrl: null, spec })(_req, res)
  }catch(e){
    res.status(500).json({ error: 'redoc_error', detail: (e as any)?.message })
  }
})
export default router
