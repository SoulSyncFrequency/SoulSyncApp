import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import yaml from 'yaml'
import fs from 'fs'

dotenv.config()
const app = express()
import { initSentry, sentryErrorHandler, captureError } from './sentry.js'
initSentry(app)
app.use(cors())
app.use(express.json())


// --- Swagger UI Basic Auth (optional) ---
function basicAuth(req: any, res: any, next: any){
  const user = process.env.BASIC_AUTH_USER
  const pass = process.env.BASIC_AUTH_PASS
  if(!user || !pass) return next()
  const hdr = req.headers['authorization'] || ''
  if(hdr.startsWith('Basic ')){
    const decoded = Buffer.from(hdr.slice(6), 'base64').toString('utf-8')
    const [u,p] = decoded.split(':')
    if(u===user && p===pass) return next()
  }
  res.set('WWW-Authenticate','Basic realm="docs"')
  return res.status(401).send('Auth required')
}

// --- OpenAPI (Swagger UI) ---
try{
  const spec = yaml.parse(fs.readFileSync('./openapi.yaml','utf-8'))
  app.use('/api/docs', basicAuth, swaggerUi.serve, swaggerUi.setup(spec, {
  customSiteTitle: 'SoulSync API Docs',
  customCss: ':root{ --primary:#111827 } .topbar{ background:#111827 } .swagger-ui .info .title{ font-family: ui-sans-serif,system-ui; }',
}))
  app.get('/api/openapi.json', (_req,res)=>res.json(spec))
}catch(e){ console.warn('[openapi] spec load failed:', e?.message) }


// Flags endpoint
app.get('/api/flags', (_req, res)=>{ res.json({ flags: Array.from(parseFlags()) }) })
import authRouter from './auth.js'
app.use('/api/auth', authRouter)

// --- Rate limiting ---
const limiterAuth = rateLimit({ windowMs: 15*60*1000, max: 100, standardHeaders: true, legacyHeaders: false })
const limiterTherapy = rateLimit({ windowMs: 60*1000, max: 12, standardHeaders: true, legacyHeaders: false })

// Apply to auth and therapy endpoints
app.use('/api/auth', limiterAuth)

app.use('/api', healthRouter)
app.use('/api', metricsRouter)
app.use('/api', metricsRouter)
import path from 'path'
import fs from 'fs-extra'
import { generateTherapy } from './engine/therapy.js'
import { z } from 'zod'
import { parseFlags } from './flags.js'
import { generateTherapyPDF } from './engine/pdf.js'
// --- Validation ---
const TherapyInputSchema = z.object({
  disease: z.string().min(1),
  chakra: z.string().min(1).optional(),
  symptoms: z.array(z.string()).optional(),
  language: z.enum(['en','hr']).optional(),
  age: z.number().int().min(0).max(130).optional(),
  sex: z.enum(['M','F']).optional()
})

import { authLimiter, therapyLimiter } from './rateLimit.js'
import { therapyInputSchema } from './validate.js'
import metricsRouter from './metrics.js'

// serve reports statically
app.use('/reports', (req, res, next) => {
  const p = path.join(process.cwd(), 'reports')
  fs.ensureDirSync(p)
  express.static(p)(req, res, next)
})

const PORT = process.env.PORT || 5000

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'soulsync-backend', version: '1.0.0' })
})

// Full therapy endpoint
app.post('/api/generateTherapy', async (req, res) => {
  try {
    const input = req.body || {}
    const plan = generateTherapy({
      disease: input.disease,
      symptoms: input.symptoms,
      language: input.language || 'en'
    })
    const pdf = await generateTherapyPDF(plan, input)
    res.json({ ok: true, therapy: plan, pdfUrl: pdf.urlPath })
  } catch (e) {
    console.error(e)
    try{ captureError(e) }catch{}
    res.status(500).json({ ok: false, error: 'THERAPY_GENERATION_FAILED' })
  }
})

// Healthcheck endpoint
app.get("/healthz", (req, res) => {
    res.status(200).send("OK");
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})

// Sentry error handler (after routes)
app.use(sentryErrorHandler())


process.on('unhandledRejection', (reason) => {
  try { captureError(reason) } catch {}
  console.error('[unhandledRejection]', reason)
})
process.on('uncaughtException', (err) => {
  try { captureError(err) } catch {}
  console.error('[uncaughtException]', err)
})
