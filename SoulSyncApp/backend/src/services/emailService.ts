
import nodemailer from 'nodemailer'
import { emailSentTotal } from '../metrics'
import { prisma } from '../db/prismaClient'

import { emailQueue, hasQueue } from '../queue/queue'

export async function _sendEmailDirect(to:string, subject:string, html:string, attachments?: unknown[]){
  const from = process.env.EMAIL_FROM || 'SoulSync <no-reply@soulsync.app>'
  try{
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT||587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
    await transporter.sendMail({ from, to, subject, html, attachments }); try{ emailSentTotal.inc({ status:'success' }) }catch{}
    if(prisma) await (prisma as unknown).emailLog.create({ data: { to, subject, status: 'SENT' } })
  }catch(e: unknown){
    if(prisma) await (prisma as unknown).emailLog.create({ data: { to, subject, status: 'FAILED', error: (e?.message||'error').slice(0,500) } }); try{ emailSentTotal.inc({ status:'fail' }) }catch{}
  }
}

export async function sendEmail(to:string, subject:string, html:string, attachments?: unknown[]){
  if(hasQueue && emailQueue){ await emailQueue.add('email', { to, subject, html, attachments }, { jobId: `${to}:${subject}`.slice(0,240), attempts: 5, backoff: { type:'exponential', delay: 2000 } } as unknown); return }
  await _sendEmailDirect(to, subject, html, attachments)
}
