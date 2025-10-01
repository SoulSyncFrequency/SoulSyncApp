
import { Router } from 'express'
import fs from 'fs'
import path from 'path'

const router = Router()

router.get('/ops/status', (req, res) => {
  let version = 'unknown'
  try{
    const j = JSON.parse(fs.readFileSync(path.join(process.cwd(),'backend','package.json'),'utf-8'))
    version = j.version || 'unknown'
  }catch{}
  const flags = {
    CSP_REPORT_ONLY: process.env.CSP_REPORT_ONLY,
    MAINTENANCE_MODE: process.env.MAINTENANCE_MODE,
    SUPPL_REQUIRE_CLINICIAN_OK: process.env.SUPPL_REQUIRE_CLINICIAN_OK
  }
  
try{
  const fs = require('fs'); const path = require('path')
  const p = path.join(process.cwd(),'logs','access.ndjson')
  const now = Date.now()
  const w = String((req.query?.window||'15m')).toLowerCase(); const windowMs = w==='5m'? (5*60*1000): w==='60m'? (60*60*1000): (15*60*1000)
  let total=0, errs=0, latSum=0, latN=0
  if (fs.existsSync(p)){
    const lines = fs.readFileSync(p,'utf-8').split(/\r?\n/).slice(-5000) // last N lines
    for (const line of lines){
      if (!line) continue
      try{
        const j = JSON.parse(line)
        const ts = Number(j.t || j.time || 0) || (j.timestamp? Date.parse(j.timestamp): 0)
        if (ts && (now - ts) > windowMs) continue
        total++
        const st = Number(j.status||0)
        if (st>=500) errs++
        const ms = Number(j.duration_ms || j.latency_ms || 0)
        if (ms){ latSum += ms; latN++ }
      }catch{}
    }
  }
  const errRate = total? (errs/total): 0
  const avgLat = latN? (latSum/latN): 0
  const hints:string[] = []
  if (errRate > 0.05) hints.push(`High 5xx rate ${ (errRate*100).toFixed(1) }% in last 15m`)
  if (avgLat > 500) hints.push(`High avg latency ~${ Math.round(avgLat) }ms in last 15m`)
  if (!hints.length) hints.push('No anomalies detected in last 15m (best-effort)')
  const anomalyHints = hints
  res.json({ ok: true, anomalyHints, , version, flags, now: new Date().toISOString() })
})

export default router
