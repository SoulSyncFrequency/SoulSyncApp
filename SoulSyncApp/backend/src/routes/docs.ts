import { Router } from 'express'
const router = Router()
function allowDocs(req:any){ if(process.env.DOCS_ALLOW==='1') return true; return (process.env.NODE_ENV||'development')!=='production' }
router.get('/openapi.json', async (req,res)=>{
  if(!allowDocs(req)) return res.status(404).end()
  try{ let spec:any=null; try{ const mod = require('../openapi'); if(mod?.getSpec) spec = await mod.getSpec(); else if(mod?.default) spec = mod.default; else if(mod?.spec) spec = mod.spec }catch{}; if(!spec){ spec = { openapi:'3.0.3', info:{ title:'SoulSync API', version:'dev' }, paths:{} } } res.json(spec) }catch(e:any){ res.status(500).json({ ok:false, error:e?.message }) }
})
router.get('/docs', (req,res)=>{
  if(!allowDocs(req)) return res.status(404).end()
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>API Docs</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.css">
</head><body><redoc spec-url="/api/openapi.json"></redoc>
<script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"></script></body></html>`
  res.setHeader('Content-Type','text/html'); res.send(html)
})
router.get('/docs/swagger', (req,res)=>{
  if(!allowDocs(req)) return res.status(404).end()
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Swagger UI</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
</head><body><div id="swagger-ui"></div>
<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>window.ui = SwaggerUIBundle({ url: '/api/openapi.json', dom_id: '#swagger-ui' })</script>
</body></html>`
  res.setHeader('Content-Type','text/html'); res.send(html)
})
export default router
