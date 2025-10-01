// Minimal scaffolding: converts simple Zod schemas to OpenAPI and writes backend/openapi/openapi.json
import { OpenAPIRegistry, OpenApiGeneratorV3 } from 'zod-to-openapi'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'

const registry = new OpenAPIRegistry()

import { PrimaryMoleculeMetaSchema } from '../src/schemas/primaryMolecule'
// Example registration (extend later by importing real zod schemas)
const Healthz = registry.register('Healthz', z.object({ ok: z.boolean() }))

const PrimaryMolecule = registry.register('PrimaryMoleculeMeta', PrimaryMoleculeMetaSchema)
const TherapyInput = registry.register('TherapyInput', z.object({ text: z.string().describe('therapy input text') }))
const TherapyResponse = registry.register('TherapyResponse', z.object({ primaryMolecule: PrimaryMolecule, notes: z.string().optional() }))
const AdminQueues = registry.register('AdminQueues', z.object({
  enabled: z.boolean().optional(),
  queues: z.array(z.object({
    name: z.string(),
    waiting: z.number(),
    active: z.number(),
    delayed: z.number(),
    failed: z.number(),
    paused: z.number()
  }))
}))

const DlqItem = registry.register('DlqItem', z.object({
  id: z.any(),
  name: z.string(),
  data: z.any(),
  failedReason: z.any().optional()
}))

const DlqList = registry.register('DlqList', z.object({
  name: z.string(),
  count: z.number(),
  items: z.array(DlqItem)
}))

const PurgeResult = registry.register('PurgeResult', z.object({
  purged: z.number(),
  olderThanDays: z.number().optional()
}))

const LogsList = registry.register('LogsList', z.object({
  dir: z.string(),
  files: z.array(z.string())
}))

const paths: any = {
  '/admin/queues': { get: { summary: 'Queues summary', responses: { '200': { description: 'OK', content: { 'application/json': { schema: AdminQueues } } }, '403': { description: 'Forbidden' } } } },
  '/admin/queues/{name}/dlq': { get: { summary: 'Read DLQ', parameters: [{ name:'name', in:'path', required:true, schema:{ type:'string'} }], responses: { '200': { description: 'OK', content: { 'application/json': { schema: DlqList } } } } } },
  '/admin/queues/{name}/dlq:purge': { post: { summary: 'Purge DLQ', parameters: [{ name:'name', in:'path', required:true, schema:{ type:'string'} }, { name:'days', in:'query', required:false, schema:{ type:'integer', minimum:1 } }], responses: { '200': { description: 'OK', content: { 'application/json': { schema: PurgeResult } } }, '403': { description: 'Forbidden' } } } },
  '/healthz': {
    get: {
      responses: { '200': { description: 'OK', content: { 'application/json': { schema: Healthz } } } }
    }
  }
}

const generator = new OpenApiGeneratorV3(registry.definitions)
const doc = generator.generateDocument({
  openapi: '3.0.0',
  info: { title: 'SoulSync API', version: '1.0.0' },
  paths
// Extend paths
paths['/admin/queues'] = {
  get: { summary: 'Queues summary', responses: { '200': { description:'OK', content:{ 'application/json':{ schema: AdminQueues } } } } }
}
paths['/admin/queues/{name}/dlq'] = {
  get: {
    summary: 'List DLQ jobs',
    parameters: [{ name:'name', in:'path', required:true, schema:{ type:'string'} }, { name:'download', in:'query', schema:{ type:'string', enum:['1','csv','xlsx'] } }],
    responses: { '200': { description:'OK', content:{ 'application/json':{ schema: DlqList } } } }
  },
  post: {
    summary: 'Purge DLQ (CSRF protected)',
    parameters: [{ name:'name', in:'path', required:true, schema:{ type:'string'} }, { name:'days', in:'query', required:false, schema:{ type:'integer', minimum:0 } }],
    responses: { '200': { description:'OK', content:{ 'application/json':{ schema: PurgeResult } } }, '403': { description:'Forbidden/CSRF' } }
  }
}
paths['/admin/logs'] = {
  get: { summary: 'List log files', responses: { '200': { description:'OK', content:{ 'application/json':{ schema: LogsList } } } } }
}
paths['/admin/logs/{file}'] = {
  get: { summary: 'Download log file', parameters: [{ name:'file', in:'path', required:true, schema:{ type:'string'} }], responses: { '200': { description:'OK' } } }
}
paths['/admin/logs/{file}.csv'] = {
  get: { summary: 'Download logs as CSV', parameters: [{ name:'file', in:'path', required:true, schema:{ type:'string'} }], responses: { '200': { description:'OK' } } }
}
paths['/admin/logs/{file}.xlsx'] = {
  get: { summary: 'Download logs as XLSX', parameters: [{ name:'file', in:'path', required:true, schema:{ type:'string'} }], responses: { '200': { description:'OK' } } }
}
paths['/admin/csrf'] = {
  get: { summary: 'Issue CSRF token for admin UI', responses: { '200': { description:'OK' } } }
}
paths['/api/therapy'] = {
  post: { summary: 'Therapy endpoint (scaffold)', requestBody: { required: true, content: { 'application/json': { schema: TherapyInput } } }, responses: { '200': { description:'OK', content: { 'application/json': { schema: TherapyResponse } } } } }
}
paths['/metrics'] = {
  get: { summary: 'Prometheus metrics', responses: { '200': { description:'OK' } } }
}

const out = path.resolve(process.cwd(), 'backend', 'openapi')
fs.mkdirSync(out, { recursive: true })
fs.writeFileSync(path.join(out, 'openapi.json'), JSON.stringify(doc, null, 2))
console.log('OpenAPI written to backend/openapi/openapi.json')


// --- AUTO-SCAN ROUTES (Prefer Zod schemas if available; fallback only) (best-effort) ---
/**
 * Scans src/routes/*.ts for simple Express route definitions like:
 *   r.get('/api/foo', ...), r.post('/api/bar', ...)
 * and appends minimal path entries if not already present.
 * This is a fallback; for rich schemas, register Zod schemas above.
 */
import fs from 'fs'
const routesDir = path.resolve(process.cwd(), 'backend', 'src', 'routes')
if (fs.existsSync(routesDir)) {
  const files = fs.readdirSync(routesDir).filter(f=>f.endsWith('.ts'))
  for (const f of files) {
    const txt = fs.readFileSync(path.join(routesDir, f), 'utf8')
    const re = /(r|router)\.(get|post|put|patch|delete)\(\s*['\"]([^'\"]+)['\"]/g
    let m: RegExpExecArray | null
    while ((m = re.exec(txt))) {
      const method = m[2].toLowerCase()
      const pth = m[3]
      if (!paths[pth]) paths[pth] = {}
      if (!paths[pth][method]) {
        paths[pth][method] = { summary: `Auto-scanned: ${method.toUpperCase()} ${pth}`, responses: { '200': { description: 'OK' } } }
      }
    }
  }
}
