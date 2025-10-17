import { logger } from './logger'
import { logToDb } from '../logging/sink'
import { prisma } from '../db/prismaClient'
import { sendEmail } from '../services/emailService'
import { Request, Response } from 'express'
import PDFDocument = require('pdfkit')

export async function sendWeeklyDashboardPDF(){
  try{
    const admins = await (prisma as unknown).user.findMany({ where: { role: 'ADMIN' } })
    let buffer: Buffer | null = null
    try{
      const doc = new PDFDocument({ size:'A4', margin:36, bufferPages:true })
      const chunks: unknown[] = []
      doc.on('data', (c: unknown)=> chunks.push(c))
      doc.fontSize(18).text('SoulSync — Weekly Dashboard Report')
      doc.moveDown(0.5).fontSize(10).text(new Date().toLocaleString())
      const range = doc.bufferedPageRange()
      for(let i=0;i<range.count;i++){
        doc.switchToPage(range.start+i)
        doc.fontSize(8).fillColor('#888').text(`Page ${i+1} of ${range.count}`, 0, 812, { width:523, align:'center' })
      }
      doc.end()
      buffer = await new Promise<Buffer>(resolve=>{
        doc.on('end', ()=> resolve(Buffer.concat(chunks as unknown)))
      })
    }catch{ buffer = null }

    for(const a of admins){
      if(buffer){
        await sendEmail(a.email, '[SoulSync] Weekly dashboard report', '<div>See attached PDF.</div>', [{ filename:'weekly_dashboard.pdf', content: buffer }])
      }else{
        await sendEmail(a.email, '[SoulSync] Weekly dashboard report (HTML)', '<div>PDF generator not installed (pdfkit). Install pdfkit to enable PDF attachments.</div>')
      }
    }
  }catch(e: unknown){
    logger.info('[Weekly PDF] failed', e?.message)
  }
}
