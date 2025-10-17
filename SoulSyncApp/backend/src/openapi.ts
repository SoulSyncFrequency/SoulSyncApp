import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { F0InputSchema } from './schemas/f0'
import { SuggestionsApplySchema } from './schemas/suggestions'
import { DataSheetRequestSchema } from './schemas/datasheet'

export function buildOpenAPISpec(baseUrl = '/') {
  const registry = new OpenAPIRegistry()

  registry.registerPath({
    method: 'post',
    path: '/api/f0score',
    summary: 'Compute F0 score',
    request: { body: { content: { 'application/json': { schema: F0InputSchema } } } },
    responses: {
      200: { description: 'OK' }
    }
  })

  registry.registerPath({
    method: 'get',
    path: '/api/f0/healthz',
    summary: 'Health probe',
    responses: { 200: { description:'OK' } }
  })

  registry.registerPath({
    method: 'post',
    path: '/api/admin/suggestions/apply',
    extensions: { 'x-roles': ['editor'] },
    summary: 'Apply suggestions with autoTune + backup',
    request: { body: { content: { 'application/json': { schema: SuggestionsApplySchema } } } },
    responses: { 200: { description:'OK' } }
  })

  registry.registerPath({
    method: 'post',
    path: '/api/admin/datasheet/pdf',
    extensions: { 'x-roles': ['editor'] },
    summary: 'Generate Data Sheet PDF from rows',
    request: { body: { content: { 'application/json': { schema: DataSheetRequestSchema } } } },
    responses: { 200: { description:'OK' } }
  })

  registry.registerComponent('securitySchemes','ApiKeyAuth', { type:'apiKey', in:'header', name:'x-api-key' })
  const generator = new OpenApiGeneratorV3(registry.definitions)
  const doc = generator.generateDocument({
    openapi: '3.0.3',
    info: { title: 'SoulSync API', version: 'v289', description: 'Auto-generated from Zod schemas' },
    servers: [{ url: baseUrl }]
  })
  return doc
}

// --- v316 additions ---

registry.registerPath({
  method: 'get',
  path: '/api/admin/diagnostics/bundle.tgz',
  summary: 'Diagnostics bundle (tgz)',
  extensions: { 'x-roles': ['viewer'] },
})

registry.registerPath({
  method: 'post',
  path: '/api/admin/ops/summary',
  summary: 'AI ops summary',
  extensions: { 'x-roles': ['viewer'] },
})

registry.registerPath({
  method: 'get',
  path: '/api/admin/heapdump',
  summary: 'Heap snapshot (heapsnapshot)',
  extensions: { 'x-roles': ['admin'] },
})

registry.registerPath({
  method: 'get',
  path: '/api/admin/reports/upload',
  summary: 'Upload report to S3',
  extensions: { 'x-roles': ['viewer'] },
})

registry.registerPath({
  method: 'get',
  path: '/api/admin/audit/exportUpload',
  summary: 'Audit dir -> tgz -> S3',
  extensions: { 'x-roles': ['viewer'] },
})

registry.registerPath({
  method: 'post',
  path: '/api/admin/audit/exportSelectedUpload',
  summary: 'Selected audit -> tgz -> S3',
  extensions: { 'x-roles': ['viewer'] },
})

registry.registerPath({
  method: 'post',
  path: '/api/admin/stats/export',
  summary: 'Stats snapshot export',
  extensions: { 'x-roles': ['viewer'] },
})

// --- v317 additions ---

registry.registerPath({
  method: 'get',
  path: '/api/admin/logs/tail',
  summary: 'Tail recent request logs',
  extensions: { 'x-roles': ['viewer'] },
})

// --- v318 additions ---

registry.registerPath({
  method: 'post',
  path: '/api/admin/diagnostics/upload',
  summary: 'Upload diagnostics tgz to S3',
  extensions: { 'x-roles': ['viewer'] },
})

// --- v319 additions ---

registry.registerPath({
  method: 'post',
  path: '/api/admin/logs/export',
  summary: 'Export recent request tail to JSONL (stats/)',
  extensions: { 'x-roles': ['viewer'] },
})

registry.registerPath({
  method: 'post',
  path: '/api/admin/logs/clear',
  summary: 'Clear in-memory request tail',
  extensions: { 'x-roles': ['viewer'] },
})

registry.registerPath({
  method: 'post',
  path: '/api/admin/audit/review',
  summary: 'AI review of admin_actions',
  extensions: { 'x-roles': ['viewer'] },
})

// --- v320 additions ---

registry.registerPath({
  method: 'get',
  path: '/api/_policy',
  summary: 'Compact policy/health snapshot',
  extensions: { 'x-roles': ['public'] },
})

registry.registerPath({
  method: 'get',
  path: '/api/whoami',
  summary: 'Return current role from API key/JWT',
  extensions: { 'x-roles': ['viewer'] },
})


// --- v321 additions ---
registry.registerPath({
  method: 'get',
  path: '/api/admin/s3/sign',
  summary: 'Get pre-signed S3 URL for a key',
  extensions: { 'x-roles': ['viewer'] },
})

// --- v322 additions ---
registry.registerPath({
  method: 'get',
  path: '/api/admin/s3/signPut',
  summary: 'Get pre-signed S3 PUT URL for a key',
  extensions: { 'x-roles': ['viewer'] },
})
registry.registerPath({
  method: 'get',
  path: '/api/_policy',
  summary: 'Compact policy/health snapshot (with p95 and top slow routes)',
  extensions: { 'x-roles': ['public'] },
})

// --- v323 additions ---

registry.registerPath({
  method: 'get',
  path: '/api/_stats/history',
  summary: 'Read p95 history from disk snapshots',
  extensions: { 'x-roles': ['viewer'] },
})

registry.registerPath({
  method: 'post',
  path: '/api/admin/s3/signPost',
  summary: 'Get pre-signed S3 POST policy',
  extensions: { 'x-roles': ['viewer'] },
})


// --- v324 additions ---
registry.registerPath({
  method: 'get',
  path: '/api/_slo',
  summary: 'Per-route p95 and SLO budget status',
  extensions: { 'x-roles': ['public'] },
})
