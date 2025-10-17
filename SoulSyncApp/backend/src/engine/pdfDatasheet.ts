// src/engine/pdfDatasheet.ts
import fs from 'fs-extra'
import path from 'path'
let PDFDocument: any
import { summarizeRows } from '../ai/summarize'
try { PDFDocument = require('pdfkit') } catch { PDFDocument = null }

export interface DataSheetOptions{
  title?: string
  columns?: string[]
}

export async function generateDataSheetPDF(rows: any[], opts: DataSheetOptions = {}){
  if(!PDFDocument) throw new Error('pdfkit not installed')
  const reportsDir = path.join(process.cwd(), 'reports')
  await fs.ensureDir(reportsDir)
  const filename = `datasheet_${Date.now()}.pdf`
  const filepath = path.join(reportsDir, filename)
  const doc = new PDFDocument({ size:'A4', margin: 36 })

  const stream = fs.createWriteStream(filepath)
  doc.pipe(stream)

  const title = opts.title || 'SoulSync — Data Sheet'
  doc.fontSize(18).text(title, { align:'left' })
  const bullets = await summarizeRows(rows)
  if(bullets.length){ doc.moveDown(0.5); doc.fontSize(11).text('Summary:'); bullets.forEach(b=> doc.text('• '+b)); doc.moveDown(0.5) }
  doc.moveDown(0.5)
  doc.fontSize(10).text(new Date().toLocaleString())
  doc.moveDown(1)

  const cols = opts.columns || Object.keys(rows[0]||{})
  // Header
  doc.fontSize(12).text(cols.join(' | '))
  doc.moveDown(0.3)
  doc.moveTo(doc.x, doc.y).lineTo(550, doc.y).stroke()
  doc.moveDown(0.5)

  rows.forEach((r:any)=>{
    const line = cols.map(c => String(r[c] ?? '')).join(' | ')
    doc.fontSize(10).text(line)
  })

  doc.end()

  await new Promise(res => stream.on('finish', res))
  return filepath
}
