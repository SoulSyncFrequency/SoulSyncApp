// Enterprise OpenAPI diff checker
// Detects: removed paths/methods/status codes, property removals, type changes,
// required tightenings, enum removals, plus QUERY & PATH param changes.
import fs from 'fs'

const base = JSON.parse(fs.readFileSync(process.argv[2], 'utf-8'))
const head = JSON.parse(fs.readFileSync(process.argv[3], 'utf-8'))

let breaking = []
const toObject = (x) => (x && typeof x === 'object' ? x : {})

function compareSchemas(baseSchema, headSchema, path) {
  if (!baseSchema || !headSchema) return
  if (baseSchema.$ref && headSchema.$ref && baseSchema.$ref !== headSchema.$ref) {
    breaking.push(`REF CHANGE at ${path}: ${baseSchema.$ref} -> ${headSchema.$ref}`); return
  }
  if (baseSchema.type && headSchema.type && baseSchema.type !== headSchema.type) {
    breaking.push(`TYPE CHANGE at ${path}: ${baseSchema.type} -> ${headSchema.type}`)
  }
  const bp = toObject(baseSchema.properties), hp = toObject(headSchema.properties)
  for (const k of Object.keys(bp)) {
    if (!(k in hp)) breaking.push(`REMOVED property at ${path}: ${k}`)
  }
  const bReq = new Set(baseSchema.required || []), hReq = new Set(headSchema.required || [])
  for (const k of hReq) if (!bReq.has(k)) breaking.push(`REQUIRED tightened at ${path}: ${k} is now required`)
  if (Array.isArray(baseSchema.enum) && Array.isArray(headSchema.enum)) {
    const bSet = new Set(baseSchema.enum), hSet = new Set(headSchema.enum)
    for (const v of bSet) if (!hSet.has(v)) breaking.push(`ENUM value removed at ${path}: ${JSON.stringify(v)}`)
  }
  for (const k of Object.keys(bp)) if (hp[k]) compareSchemas(bp[k], hp[k], `${path}.${k}`)
}

function compareQueryParams(baseParams = [], headParams = [], opPath = '') {
  const baseQ = baseParams.filter(p => (p.in === 'query'))
  const headQ = headParams.filter(p => (p.in === 'query'))
  const mapBy = (list) => Object.fromEntries(list.map(p => [p.name, p]))
  const bmap = mapBy(baseQ), hmap = mapBy(headQ)
  for (const name of Object.keys(bmap)) {
    if (!hmap[name]) { breaking.push(`REMOVED query param at ${opPath}: ${name}`); continue }
    const b = bmap[name], h = hmap[name]
    if (!!h.required && !b.required) breaking.push(`REQUIRED tightened for query param at ${opPath}: ${name}`)
    const bSchema = toObject(b.schema||{}), hSchema = toObject(h.schema||{})
    if (bSchema.type && hSchema.type && bSchema.type !== hSchema.type) breaking.push(`TYPE CHANGE for query param at ${opPath}: ${name} ${bSchema.type} -> ${hSchema.type}`)
    if (Array.isArray(bSchema.enum) && Array.isArray(hSchema.enum)) {
      const bSet = new Set(bSchema.enum), hSet = new Set(hSchema.enum)
      for (const v of bSet) if (!hSet.has(v)) breaking.push(`ENUM value removed for query param at ${opPath}: ${name}=${JSON.stringify(v)}`)
    }
  }
}

function comparePathParams(baseParams = [], headParams = [], opPath = '') {
  const baseP = baseParams.filter(p => (p.in === 'path'))
  const headP = headParams.filter(p => (p.in === 'path'))
  const mapBy = (list) => Object.fromEntries(list.map(p => [p.name, p]))
  const bmap = mapBy(baseP), hmap = mapBy(headP)
  for (const name of Object.keys(bmap)) {
    if (!hmap[name]) { breaking.push(`REMOVED path param at ${opPath}: ${name}`); continue }
    const b = bmap[name], h = hmap[name]
    if (!!h.required && !b.required) breaking.push(`REQUIRED tightened for path param at ${opPath}: ${name}`)
    const bSchema = toObject(b.schema||{}), hSchema = toObject(h.schema||{})
    if (bSchema.type && hSchema.type && bSchema.type !== hSchema.type) breaking.push(`TYPE CHANGE for path param at ${opPath}: ${name} ${bSchema.type} -> ${hSchema.type}`)
  }
}

const basePaths = base.paths || {}, headPaths = head.paths || {}

for (const p of Object.keys(basePaths)) {
  if (!headPaths[p]) { breaking.push(`REMOVED path: ${p}`); continue }
  for (const m of Object.keys(basePaths[p])) {
    if (!headPaths[p][m]) { breaking.push(`REMOVED operation: ${m.toUpperCase()} ${p}`); continue }
    const baseOp = basePaths[p][m], headOp = headPaths[p][m]
    const baseCodes = Object.keys(baseOp.responses || {}), headCodes = Object.keys(headOp.responses || {})
    for (const code of baseCodes) if (!headCodes.includes(code)) breaking.push(`REMOVED status code: ${m.toUpperCase()} ${p} ${code}`)
    for (const code of headCodes) {
      if (baseOp.responses && baseOp.responses[code] && headOp.responses[code]) {
        const bResp = baseOp.responses[code], hResp = headOp.responses[code]
        const bSchema = (bResp.content && Object.values(bResp.content)[0] && Object.values(bResp.content)[0].schema) || null
        const hSchema = (hResp.content && Object.values(hResp.content)[0] && Object.values(hResp.content)[0].schema) || null
        compareSchemas(bSchema, hSchema, `${m.toUpperCase()} ${p} ${code} response`)
      }
    }
    if (baseOp.requestBody && headOp.requestBody) {
      const bBody = Object.values(baseOp.requestBody.content||{})[0], hBody = Object.values(headOp.requestBody.content||{})[0]
      const bSchema = bBody && bBody.schema, hSchema = hBody && hBody.schema
      compareSchemas(bSchema, hSchema, `${m.toUpperCase()} ${p} body`)
    }
    compareQueryParams(baseOp.parameters, headOp.parameters, `${m.toUpperCase()} ${p}`)
    comparePathParams(baseOp.parameters, headOp.parameters, `${m.toUpperCase()} ${p}`)
  }
}

if (breaking.length) {
  console.error('BREAKING API CHANGES DETECTED:'); for (const line of breaking) console.error(' -', line); process.exit(1)
} else {
  console.log('No breaking changes detected.')
}


/** Write a human-readable Markdown report */
const report = [
  '# OpenAPI Change Report',
  '',
  breaking.length ? '## Breaking changes detected:' : '## No breaking changes',
  ...breaking.map(s => `- ${s}`)
].join('\n')

try {
  fs.writeFileSync('openapi-change-report.md', report, 'utf-8')
} catch {}
