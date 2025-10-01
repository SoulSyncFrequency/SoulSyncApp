import 'dotenv/config'
import dotenv from 'dotenv'
import path from 'path'
// Load ops/.env.backend if present
try {
  const envPath = path.join(__dirname, '.env.backend')
  dotenv.config({ path: envPath })
} catch {}

import { config } from '../backend/src/config'

const fetch = globalThis.fetch || (await import('node-fetch')).default as any

async function check() {
  console.log('🔍 Pre-deploy self-check starting...')

  try {
    // 1) ENV check (config schema parse already throws if invalid)
    console.log('✅ ENV validated:', config)

    // 2) Backend health
    const base = process.env.CHECK_BASE_URL || 'http://localhost:8080'
    const health = await fetch(base + '/api/healthz')
    if (!health.ok) throw new Error('Healthz not OK: ' + health.status)
    const hj = await health.json()
    if (!hj.ok) throw new Error('Healthz JSON missing ok:true')
    console.log('✅ /api/healthz passed')

    const ready = await fetch(base + '/api/readiness')
    if (!ready.ok) throw new Error('Readiness not OK')
    const rj = await ready.json()
    if (!rj.ready) throw new Error('Readiness JSON missing ready:true')
    console.log('✅ /api/readiness passed')

    // 3) Metrics
    const metrics = await fetch(base + '/api/metrics')
    if (!metrics.ok) throw new Error('Metrics not OK')
    const txt = await metrics.text()
    if (!txt.includes('http_requests_total')) throw new Error('Metrics missing http_requests_total')
    console.log('✅ /api/metrics passed')

    const ver = await fetch(base + '/api/version')
    if (!ver.ok) throw new Error('Version not OK')
    const vj = await ver.json()
    if (!vj.version) throw new Error('Version JSON missing version')
    console.log('✅ /api/version passed (' + vj.version + ')')

    console.log('🎉 Pre-deploy check passed — all systems GO')
    process.exit(0)
  } catch (e) {
    console.error('❌ Pre-deploy check failed:', (e as Error).message)
    process.exit(1)
  }
}

check()


// Extra checks
async function extraChecks(base: string){
  console.log('🔎 Extra checks...')

  // 404 returns JSON with "error"
  const notfound = await fetch(base + '/api/nonexistent-endpoint')
  if (notfound.status !== 404) throw new Error('404 check failed: status ' + notfound.status)
  const nj = await notfound.json().catch(()=>({}))
  if (!nj.error) throw new Error('404 check failed: missing error field')
  console.log('✅ 404 check passed')

  // CSP report endpoint accepts 204
  const csp = await fetch(base + '/api/csp-report', { method: 'POST', headers: {'Content-Type':'application/csp-report'}, body: JSON.stringify({ "csp-report": { "violated-directive": "script-src" } }) })
  if (csp.status !== 204) throw new Error('CSP report not 204')
  console.log('✅ CSP report endpoint passed')

  // X-Request-Id exposed
  const health = await fetch(base + '/api/healthz')
  const rid = health.headers.get('x-request-id')
  if (!rid) throw new Error('Missing X-Request-Id header')
  console.log('✅ X-Request-Id header present')

  // metrics contains errors_total
  const metrics = await fetch(base + '/api/metrics')
  const mt = await metrics.text()
  if (!mt.includes('errors_total')) throw new Error('metrics missing errors_total')
  console.log('✅ metrics includes errors_total')
}

await extraChecks(base)


// OpenAPI and robots checks
const oapi = await fetch(base + '/api/openapi.yaml')
if (!oapi.ok) throw new Error('OpenAPI not OK')
console.log('✅ OpenAPI served')

const robots = await fetch(base + '/robots.txt')
if (!robots.ok) throw new Error('robots.txt not OK')
console.log('✅ robots.txt served')


const docs = await fetch(base + '/api/docs')
if (!docs.ok) throw new Error('Docs not OK')
const docsHtml = await docs.text()
if (!docsHtml.includes('SwaggerUI')) throw new Error('Docs page not SwaggerUI')
console.log('✅ /api/docs served (SwaggerUI)')


// CORS Preflight check
const pre = await fetch(base + '/api/healthz', { method: 'OPTIONS', headers: { 'Origin': 'https://example.com', 'Access-Control-Request-Method': 'GET' } })
if (pre.status !== 204) throw new Error('Preflight not 204')
console.log('✅ CORS preflight passed')


// Sentry checks (soft)
console.log('ℹ️ Sentry DSN present?', !!process.env.SENTRY_DSN)
console.log('ℹ️ Sentry ENV:', process.env.SENTRY_ENVIRONMENT || 'staging')
console.log('ℹ️ Sentry RELEASE:', process.env.SENTRY_RELEASE || 'v101.5.7')


// uptime check in healthz
const hz2 = await fetch(base + '/api/healthz')
const hj2 = await hz2.json().catch(()=>({}))
if (typeof hj2.uptime !== 'number') console.warn('⚠️ uptime missing in healthz (ok but recommended)')
else console.log('✅ healthz includes uptime')


// content-type checks
const metricsRes = await fetch(base + '/api/metrics')
const mtCT = (metricsRes.headers.get('content-type')||'').toLowerCase()
if (!mtCT.includes('text/plain')) console.warn('⚠️ metrics content-type should be text/plain')
const oapiRes = await fetch(base + '/api/openapi.yaml')
if (oapiRes.ok) {
  const oaCT = (oapiRes.headers.get('content-type')||'').toLowerCase()
  if (!oaCT.includes('yaml')) console.warn('⚠️ openapi content-type should be application/yaml')
}


// status endpoint check
const status = await fetch(base + '/api/status')
if (!status.ok) throw new Error('/api/status not OK')
const st = await status.json().catch(()=>({}))
if (!st.ok) throw new Error('/api/status ok=false')
console.log('✅ /api/status passed')


// Vary: Origin header check (for CORS-cached responses)
const verRes = await fetch(base + '/api/version')
const vary = verRes.headers.get('vary') || ''
if (!vary.toLowerCase().includes('origin')) console.warn('⚠️ Vary: Origin missing on /api/version (recommended)')
else console.log('✅ Vary: Origin present')


// header presence checks on /api/healthz
const hz = await fetch(base + '/api/healthz')
const h = hz.headers
function present(name){ return !!(h.get(name) || h.get(name.toLowerCase())) }
const must = ['x-content-type-options','x-frame-options','cross-origin-opener-policy','cross-origin-resource-policy']
for (const n of must){ if(!present(n)) console.warn('⚠️ missing header:', n) else console.log('✅ header present:', n) }
const coep = h.get('cross-origin-embedder-policy') || h.get('cross-origin-embedder-policy-report-only')
if (!coep) console.warn('⚠️ COEP header missing (ok in early dev)')


// X-Request-Id presence
const hz3 = await fetch(base + '/api/healthz')
if (!hz3.headers.get('x-request-id')) console.warn('⚠️ X-Request-Id header missing (recommended)')
else console.log('✅ X-Request-Id present')


// header: X-Powered-By should be absent
const hzXPB = await fetch(base + '/api/healthz')
if (hzXPB.headers.get('x-powered-by')) console.warn('⚠️ X-Powered-By present (disable recommended)')
else console.log('✅ X-Powered-By absent')


// metrics series existence (non-fatal)
const mtx = await (await fetch(base + '/api/metrics')).text().catch(()=> '')
if (!/http_request_duration_seconds/.test(mtx)) console.warn('⚠️ request duration histogram missing in metrics')
if (!/http_response_size_bytes/.test(mtx)) console.warn('⚠️ response size histogram missing in metrics')


// X-Correlation-Id matches X-Request-Id
const ch = await fetch(base + '/api/healthz')
const rid = ch.headers.get('x-request-id'); const cid = ch.headers.get('x-correlation-id')
if (rid && cid && rid !== cid) console.warn('⚠️ X-Correlation-Id != X-Request-Id'); else console.log('✅ correlation id mirrors request id')


// URL length guard (warn-only)
const longUrl = base + '/api/healthz?' + 'q='.repeat(9000)
const respLong = await fetch(longUrl).catch(()=>null)
if (respLong && respLong.status === 414) console.log('✅ URL length guard active (414)')
else console.warn('ℹ️ URL length guard not active (ok if MAX_URL_LENGTH not enforced)')


// expose headers check
const ver = await fetch(base + '/api/version', { headers: { Origin: 'https://example.com' }})
const ex = ver.headers.get('access-control-expose-headers') || ''
if (!/x-request-id/i.test(ex)) console.warn('⚠️ Access-Control-Expose-Headers missing X-Request-Id')
else console.log('✅ Access-Control-Expose-Headers includes X-Request-Id')


const v2 = await fetch(base + '/api/version', { headers: { Origin: 'https://example.com' } })
const tao = v2.headers.get('timing-allow-origin')
if (!tao) console.warn('⚠️ Timing-Allow-Origin missing'); else console.log('✅ Timing-Allow-Origin present:', tao)
const cc = v2.headers.get('cache-control') || ''
if (!cc) console.warn('ℹ️ Cache-Control missing on /api/version (ok)')


// security.txt check
const sec = await fetch(base + '/.well-known/security.txt')
const txt = await sec.text().catch(()=> '')
if (!/Contact:/i.test(txt)) console.warn('ℹ️ security.txt missing Contact')
else console.log('✅ security.txt present')


// Report-To & Reporting-Endpoints headers (best-effort)
const hz = await fetch(base + '/api/healthz')
const rt = hz.headers.get('report-to') || ''
const re = hz.headers.get('reporting-endpoints') || ''
if (!rt) console.warn('ℹ️ Report-To header missing (ok, but recommended)')
if (!re) console.warn('ℹ️ Reporting-Endpoints header missing (ok, but recommended)')


// X-API-Version presence (if configured)
const ver2 = await fetch(base + '/api/version')
const apiv = ver2.headers.get('x-api-version') || ''
if (apiv) console.log('✅ X-API-Version present:', apiv)
else console.log('ℹ️ X-API-Version not set (ok if API_VERSION/GIT_SHA not provided)')


// Vary includes Accept-Encoding & Accept
const vHdr = (await fetch(base + '/api/version')).headers.get('vary') || ''
if (!/accept-encoding/i.test(vHdr)) console.warn('⚠️ Vary missing Accept-Encoding (recommended)')
if (!/accept(,|$)/i.test(vHdr)) console.warn('ℹ️ Vary missing Accept (ok unless STRICT_ACCEPT_JSON=true)')


// 'Server' header should be absent (reverse proxy may still add its own)
const _hz = await fetch(base + '/api/healthz')
if (_hz.headers.get('server')) console.warn('ℹ️ Server header present (likely from proxy)')
else console.log('✅ Server header absent at app layer')

// Server-Timing present on /api/version
const vtim = await fetch(base + '/api/version')
const st = vtim.headers.get('server-timing') || ''
if (!st) console.warn('ℹ️ Server-Timing header missing (ok), but recommended for FE perf insight')
else console.log('✅ Server-Timing present:', st)

// /api 404 JSON check
const nf = await fetch(base + '/api/__definitely_not_existing__')
if (nf.status !== 404) console.warn('ℹ️ /api 404 fallback not active (ok if router handles 404)')
else {
  try { const j = await nf.json(); if (!j || j.error!=='not_found') console.warn('ℹ️ 404 payload not in expected shape') } catch { console.warn('ℹ️ 404 not JSON') }
}

// Path traversal guard check (warn-only)
const pt = await fetch(base + '/api/..', { redirect: 'manual' }).catch(()=>null)
if (pt && pt.status===400) console.log('✅ Path traversal guard active')
else console.log('ℹ️ Path traversal guard not active (ok if behind trusted proxy/router)')

// 405 JSON check (TRACE)
const tr = await fetch(base + '/api/healthz', { method: 'TRACE' }).catch(()=>null)
if (tr && tr.status===405){ try{ const jj = await tr.json(); if(!jj || jj.error!=='method_not_allowed') console.warn('ℹ️ 405 payload not in expected shape') }catch{ console.warn('ℹ️ 405 not JSON') } } else console.warn('ℹ️ TRACE 405 not enforced (ok if LB strips)')

// Query guard check
const qg = await fetch(base + '/api/healthz?' + new URLSearchParams(Object.fromEntries(Array.from({length: 205}).map((_,i)=>['k'+i,'v'])) as any) )
if (qg.status===400) console.log('✅ Query guard triggered on too many params')
else console.log('ℹ️ Query guard not active (ok if limits relaxed)')

// Extra security headers check
const hz4 = await fetch(base + '/api/healthz')
const xpd = hz4.headers.get('x-permitted-cross-domain-policies')
const xdo = hz4.headers.get('x-download-options')
const xdp = hz4.headers.get('x-dns-prefetch-control')
if (!xpd) console.warn('ℹ️ X-Permitted-Cross-Domain-Policies missing (ok)')
if (!xdo) console.warn('ℹ️ X-Download-Options missing (ok)')
if (!xdp) console.warn('ℹ️ X-DNS-Prefetch-Control missing (ok)')

// Strict content-type 415 (informational)
if ((process.env.STRICT_CONTENT_TYPE||'false').toLowerCase()==='true'){
  const bad = await fetch(base + '/api/healthz', { method:'POST', headers:{ 'Content-Type':'image/png' }, body:'x' }).catch(()=>null)
  if (bad && bad.status===415) console.log('✅ 415 Unsupported Media Type enforced')
  else console.warn('ℹ️ 415 not enforced (STRICT_CONTENT_TYPE=false or allowed)')
}

// X-Request-Start present
const rstart = await fetch(base + '/api/healthz')
const xrs = rstart.headers.get('x-request-start')
if (!xrs) console.warn('ℹ️ X-Request-Start missing (ok if disabled)')
else console.log('✅ X-Request-Start:', xrs)

// X-Response-Size present on /api/version
const vres = await fetch(base + '/api/version')
const xrsz = vres.headers.get('x-response-size')
if (!xrsz) console.warn('ℹ️ X-Response-Size missing (ok)')
else console.log('✅ X-Response-Size header:', xrsz)

// Problem+JSON toggle check (best-effort on invalid JSON)
if ((process.env.PROBLEM_JSON_ERRORS||'false').toLowerCase()==='true'){
  const bad = await fetch(base + '/api/healthz', { method:'POST', headers:{'Content-Type':'application/json'}, body:'{' }).catch(()=>null)
  if (bad){ const ctype = bad.headers.get('content-type')||''; if (/application\/problem\+json/i.test(ctype)) console.log('✅ problem+json enabled for 400'); else console.warn('ℹ️ problem+json not used (ok)') }
}

// HSTS enforce check (best-effort)
if ((process.env.ENFORCE_HTTPS||'false').toLowerCase()==='true'){
  const hz = await fetch(base + '/api/healthz', { headers:{ 'X-Forwarded-Proto':'https' } })
  const hsts = hz.headers.get('strict-transport-security') || ''
  if (!hsts) console.warn('ℹ️ HSTS header missing (when ENFORCE_HTTPS=true)')
  else console.log('✅ HSTS present:', hsts)
}

// OPTIONS fast path check
const opt = await fetch(base + '/api/version', { method:'OPTIONS' })
if (opt.status===204) console.log('✅ OPTIONS fast path 204 OK')
else console.warn('ℹ️ OPTIONS not 204 (ok if handled elsewhere)')

// CORP header check
const crp = await fetch(base + '/api/healthz')
if (!crp.headers.get('cross-origin-resource-policy')) console.warn('ℹ️ CORP header missing (ok)')
else console.log('✅ CORP header present')

// Gzip encoding check
if ((process.env.ENABLE_COMPRESSION||'true').toLowerCase()==='true'){
  const gz = await fetch(base + '/api/version', { headers:{ 'Accept-Encoding': 'gzip' } })
  const enc = gz.headers.get('content-encoding') || ''
  if (/gzip|br|deflate/i.test(enc)) console.log('✅ Response compressed:', enc)
  else console.warn('ℹ️ No content-encoding (ok if small payload or proxy handles)')
}

// 404 problem+json check
if ((process.env.PROBLEM_JSON_ERRORS||'false').toLowerCase()==='true'){
  const nf = await fetch(base + '/api/__missing__')
  const ct = nf.headers.get('content-type')||''
  if (/application\/problem\+json/i.test(ct)) console.log('✅ 404 uses problem+json')
  else console.warn('ℹ️ 404 not problem+json (toggle off or other router)')
}

// OPTIONS Vary check
const opt2 = await fetch(base + '/api/version', { method:'OPTIONS' })
const vary = opt2.headers.get('vary') || ''
if (/access-control-request-method/i.test(vary) && /access-control-request-headers/i.test(vary)) console.log('✅ OPTIONS includes Vary for preflight')
else console.warn('ℹ️ OPTIONS Vary not set (ok if handled by proxy)')

// X-Robots-Tag check
const rob = await fetch(base + '/api/healthz')
if ((rob.headers.get('x-robots-tag')||'').includes('noindex')) console.log('✅ X-Robots-Tag present')
else console.warn('ℹ️ X-Robots-Tag missing (ok)')
