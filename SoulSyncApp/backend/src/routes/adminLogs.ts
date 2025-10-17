import { Router } from 'express'
import { requireRole } from '../middleware/rbac'
import fs from 'fs'
import path from 'path'
import { basicOk, parseBasicUser } from '../middleware/basicAuth'
import { adminLimiter } from '../middleware/rateLimit'
import { logger } from '../logger'

const r = Router()
r.use(adminLimiter)
const LOG_DIR = process.env.LOG_DIR || path.resolve(process.cwd(), 'logs')

function guard(req:any, res:any, next:any){
  const tokenList = (process.env.ADMIN_TOKENS||'').split(',').map(s=>s.trim()).filter(Boolean)
  const pairs = new Map(tokenList.map(s=>{ const [name,tk] = s.split(':'); return [tk, name||'admin'] }))
  const token = req.header('x-admin-token')
  if (process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN){ req.adminUser='token'; return next() }
  if (token && pairs.has(token)){ req.adminUser=pairs.get(token); return next() }
  if (basicOk(req)){ req.adminUser = parseBasicUser(req) || 'basic'; return next() }
  return res.status(403).json({ error: 'forbidden' })
}

r.get('/admin/logs', requireRole('ops'), guard, (_req,res)=>{
  if(!fs.existsSync(LOG_DIR)) return res.json({ files: [] })
  const files = fs.readdirSync(LOG_DIR).filter(f=> f.endsWith('.log') || f.endsWith('.log.gz'))
  res.json({ dir: LOG_DIR, files })
})

r.get('/admin/logs/:file', requireRole('ops'), guard, (req,res)=>{
  logger.info({act:'logs_download', user:req.adminUser, file:req.params.file})
  const f = path.resolve(LOG_DIR, req.params.file)
  if(!f.startsWith(LOG_DIR)) return res.status(400).send('bad path')
  if(!fs.existsSync(f)) return res.status(404).send('not found')
  res.download(f)
})

r.get('/admin/logs/:file.csv', guard, (req,res)=>{
  logger.info({act:'logs_download_csv', user:req.adminUser, file:req.params.file})
  const f = path.resolve(LOG_DIR, req.params.file)
  if(!fs.existsSync(f)) return res.status(404).send('not found')
  const data = fs.readFileSync(f, 'utf8')
  const lines = data.split(/\r?\n/).filter(Boolean)
  const rows = lines.map((ln)=>{ try{ return JSON.parse(ln) }catch{ return null } }).filter(Boolean)
  const header = ['time','level','msg','requestId','ip']
  res.setHeader('Content-Disposition', `attachment; filename=${req.params.file}.csv`)
  res.type('text/csv')
  res.write(header.join(',')+'\n')
  for(const r0 of rows){
    const row = [r0.time || '', r0.level || '', JSON.stringify(r0.msg||r0.message||''), r0.req?.id||'', r0.ip||'']
    res.write(row.join(',')+'\n')
  }
  res.end()
})

r.get('/admin/logs/:file.xlsx', guard, async (req,res)=>{
  logger.info({act:'logs_download_xlsx', user:req.adminUser, file:req.params.file})
  const f = path.resolve(LOG_DIR, req.params.file)
  if(!fs.existsSync(f)) return res.status(404).send('not found')
  const data = fs.readFileSync(f, 'utf8')
  const lines = data.split(/\r?\n/).filter(Boolean)
  const rows = lines.map((ln)=>{ try{ return JSON.parse(ln) }catch{ return null } }).filter(Boolean)
  const ExcelJS = require('exceljs')
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Logs')
  ws.columns = [
    { header:'time', key:'time', width:24 },
    { header:'level', key:'level', width:8 },
    { header:'msg', key:'msg', width:80 },
    { header:'requestId', key:'requestId', width:16 },
    { header:'ip', key:'ip', width:18 }
  ]
  for(const r0 of rows){
    ws.addRow({ time: r0.time||'', level: r0.level||'', msg: r0.msg||r0.message||'', requestId: r0.req?.id||'', ip: r0.ip||'' })
  }
  res.setHeader('Content-Disposition', `attachment; filename=${req.params.file}.xlsx`)
  await wb.xlsx.write(res); res.end()
})

export default r
