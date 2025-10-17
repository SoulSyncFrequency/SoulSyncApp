
import fetch from 'node-fetch'
import nodemailer from 'nodemailer'

export type NotifyResult = { ok: boolean, channel: string, detail?: string }

export async function notifySlack(message: string): Promise<NotifyResult>{
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) return { ok:true, channel:'slack', detail:'noop (no webhook)' }
  const resp = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text: message }) })
  return { ok: resp.ok, channel:'slack', detail: String(resp.status) }
}

export async function notifyDiscord(message: string): Promise<NotifyResult>{
  const url = process.env.DISCORD_WEBHOOK_URL
  if (!url) return { ok:true, channel:'discord', detail:'noop (no webhook)' }
  const resp = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ content: message }) })
  return { ok: resp.ok, channel:'discord', detail: String(resp.status) }
}

export async function notifyEmail(subject: string, body: string): Promise<NotifyResult>{
  const smtp = process.env.SMTP_URL
  const to = process.env.NOTIFY_EMAIL_TO
  if (!smtp || !to) return { ok:true, channel:'email', detail:'noop (no smtp/to)' }
  const transporter = nodemailer.createTransport(smtp)
  const from = process.env.NOTIFY_EMAIL_FROM || 'noreply@soulsync.local'
  await transporter.sendMail({ from, to, subject, text: body })
  return { ok:true, channel:'email' }
}

export async function notifyAll(subject: string, body: string): Promise<NotifyResult[]>{
  const message = `**${subject}**\n${body}`
  const results:NotifyResult[] = []
  try { results.push(await notifySlack(message)) } catch(e:any){ results.push({ ok:false, channel:'slack', detail:String(e?.message||e) }) }
  try { results.push(await notifyDiscord(message)) } catch(e:any){ results.push({ ok:false, channel:'discord', detail:String(e?.message||e) }) }
  try { results.push(await notifyEmail(subject, body)) } catch(e:any){ results.push({ ok:false, channel:'email', detail:String(e?.message||e) }) }
  if (!results.length) results.push({ ok:true, channel:'noop' })
  return results
}
