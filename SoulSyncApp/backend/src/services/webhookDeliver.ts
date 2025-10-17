import { requestWithCB } from './lib/httpClient'
import crypto from 'crypto'
import fetch from 'node-fetch'
import { prisma } from '../db/prismaClient'

function hmacSHA256(body:string, secret:string){
  const mac = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return 'sha256=' + mac
}

export async function deliverWebhook(url:string, secret:string, payload: unknown, attempts:number=1){
  const body = JSON.stringify(payload)
  const headers: unknown = { 'Content-Type': 'application/json', 'X-Signature': hmacSHA256(body, secret) }
  try{
    const r = await requestWithCB(url, { method:'POST', headers, body })
    if(!r.ok) throw new Error('HTTP '+r.status)
    await (prisma as unknown)?.webhookLog.create({ data: { url, payload: payload, status: 'SUCCESS', attempts } })
    return { ok: true }
  }catch(e: unknown){
    await (prisma as unknown)?.webhookLog.create({ data: { url, payload: payload, status: 'FAILED', attempts, error: String(e?.message||e) } })
    return { ok: false, error: e?.message||'webhook failed' }
  }
}

export async function deliverToAllActive(payload: unknown){
  if(!prisma) return
  const endpoints = await (prisma as unknown).webhookEndpoint.findMany({ where: { active: true } })
  for(const ep of endpoints){
    deliverWebhook(ep.url, ep.secret, payload).catch(()=>{})
  }
}