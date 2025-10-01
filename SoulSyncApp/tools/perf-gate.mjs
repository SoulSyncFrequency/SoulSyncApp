#!/usr/bin/env node
/**
 * Perf gate: parse one or more k6 summary JSON files and fail if p95 exceeds threshold (ms).
 * Usage: node tools/perf-gate.mjs <summary1.json> <summary2.json> ... <thresholdMs>
 */
import fs from 'node:fs'

const args = process.argv.slice(2)
if (args.length < 1) {
  console.error('Usage: node tools/perf-gate.mjs <summary.json> [more summaries...] <thresholdMs>')
  process.exit(2)
}
const threshold = Number(args[args.length - 1])
const files = args.slice(0, -1).length ? args.slice(0, -1) : ['summary.json']

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.error('Summary file not found:', file)
    process.exit(1)
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  const http = data?.metrics?.http_req_duration
  if (!http) {
    console.error('No http_req_duration metric in', file)
    process.exit(1)
  }
  const p95 = http?.p(95) || http['p(95)'] || http?.['p95'] || http?.percentiles?.p95
  const p95ms = typeof p95 === 'number' ? p95 : Number(p95)
  if (!Number.isFinite(p95ms)) {
    console.error('Cannot read p95 from', file, 'value:', p95)
    process.exit(1)
  }
  console.log(`k6 p95 from ${file}: ${p95ms} ms (threshold: ${threshold} ms)`)
  if (p95ms > threshold) {
    console.error('❌ Perf gate failed for', file, ': p95 above threshold')
    process.exit(1)
  }
}
console.log('✅ Perf gate passed for all summaries.')
