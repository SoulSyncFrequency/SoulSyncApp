import nodemailer from 'nodemailer'
import { prisma } from '../db/prismaClient'

export async function sendEmail(to:string, subject:string, html:string){
  try{
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT||587),
      secure: false,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    } as unknown)
    const from = process.env.EMAIL_FROM || 'SoulSync <no-reply@soulsync>'
    await transporter.sendMail({ from, to, subject, html })
    try{ await (prisma as unknown)?.emailLog.create({ data: { to, subject, status: 'SUCCESS' } }) }catch{}
    return { ok: true }
  }catch(e: unknown){
    try{ await (prisma as unknown)?.emailLog.create({ data: { to, subject, status: 'FAILED', error: String(e?.message||e) } }) }catch{}
    return { ok: false, error: e?.message||'email failed' }
  }
}