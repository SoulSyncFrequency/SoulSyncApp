import { Router } from 'express'
import { httpFetch } from '../lib/http'
import { requestWithCB } from '../lib/httpClient'
import fs from 'fs'
import path from 'path'
import child_process from 'child_process'
const router = Router()

router.get('/docs/alerting/last-updated', async (_req,res)=>{
  try{
    let last = ''
    if(fs.existsSync('.git')){
      try{
        last = child_process.execSync('git log -1 --format=%cd README_ALERTING.md').toString().trim()
      }catch{}
    }
    if(!last) last = new Date().toLocaleString()
    res.json({ lastUpdated: last })
  }catch(e: unknown){
    res.json({ lastUpdated: new Date().toLocaleString() })
  }
})

router.get('/docs/alerting/export-pdf', async (_req,res)=>{
  try{
    const txt = fs.readFileSync(path.join(process.cwd(),'README_ALERTING.md'),'utf8')
    const PDFDocument = require('pdfkit')
    const doc = new PDFDocument({ size: 'A4', margin: 36 })
    const chunks: unknown[] = []
    doc.on('data', (c: unknown)=> chunks.push(c))
    doc.on('end', ()=>{
      const buffer = Buffer.concat(chunks)
      res.setHeader('Content-Type','application/pdf')
      res.setHeader('Content-Disposition','attachment; filename="alerting_docs.pdf"')
      res.send(buffer)
    })
    doc.fontSize(16).text('SoulSync — Alerting Documentation',{align:'left'})
    doc.fontSize(10).text('Last updated: '+new Date().toLocaleString(),{align:'right'})
    doc.moveDown()
    txt.split('\n').forEach(l=> doc.fontSize(10).text(l))
    const range = doc.bufferedPageRange()
    for(let i=0;i<range.count;i++){
      doc.switchToPage(i)
      doc.fontSize(8).fillColor('gray').text(`Page ${i+1} of ${range.count}`, 300, 800,{align:'center'})
    }
    doc.end()
  }catch(e: unknown){
    res.status(501).json({ error: 'PDF export requires pdfkit', details: e?.message })
  }
})

export default router
