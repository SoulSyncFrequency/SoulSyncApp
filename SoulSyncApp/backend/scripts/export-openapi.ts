// backend/scripts/export-openapi.ts
import fs from 'fs'
import path from 'path'
import { buildOpenAPISpec } from '../src/openapi'

const base = process.env.API_BASE_URL || '/'
const doc = buildOpenAPISpec(base)
const outDir = path.join(process.cwd(), 'public')
fs.mkdirSync(outDir, { recursive: true })
const file = path.join(outDir, 'openapi.json')
fs.writeFileSync(file, JSON.stringify(doc, null, 2), 'utf-8')
console.log('OpenAPI written to', file)
