import { Router } from 'express'
import { buildOpenAPISpec } from '../openapi'

const router = Router()

router.get('/openapi.json', (_req, res)=>{
  try{
    const base = process.env.API_BASE_URL || '/'
    const doc = buildOpenAPISpec(base)
    res.set('Cache-Control','public, max-age=300, stale-while-revalidate=300'); res.json(doc)
  }catch(e:any){
    res.status(500).json({ error: e?.message || 'openapi_error' })
  }
})

export default router
