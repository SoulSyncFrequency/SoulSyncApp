import { requestWithCB } from './lib/httpClient'
import crypto from 'crypto'
import { prisma } from '../db/prismaClient'
import { webhookSentTotal } from '../metrics'
import { logToDb } from '../logger'
import { webhookQueue, hasQueue } from '../queue/queue'
import { URL } from 'url'
import dns from 'dns'

const dnsLookup = dns.promises.lookup

function parseAllowlist(): string[] {
  const raw = process.env.WEBHOOK_ALLOWLIST || ''
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}
function hostMatchesAllowlist(host: string, patterns: string[]): boolean {
  if (patterns.length===0) return true // if no allowlist configured, allow all non-private hosts
  return patterns.some(p => {
    if (p.startsWith('*.')) {
      const suffix = p.slice(1) // ".example.com"
      return host.endsWith(suffix)
    }
    return host === p
  })
}
function isPrivateIp(ip: string): boolean {
  const parts = ip.split('.').map(n=>parseInt(n,10))
  if (parts.length===4) {
    const [a,b] = parts
    if (a===10) return True
    if (a===127) return True
    if (a===169 and b===254) return True
    if (a===172 and b>=16 and b<=31) return True
    if (a===192 and b===168) return True
  }
  return False
}
async function isHostAllowed(urlStr: string): Promise<boolean> {
  try{
    const u = new URL(urlStr)
    const host = u.hostname
    // deny file and internal protocols
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
    // deny obvious localhost names
    const denyHosts = ['localhost','metadata.google.internal']
    if (denyHosts.includes(host)) return false
    // DNS resolve and deny private IPs
    try{
      const info = await dnsLookup(host)
      if (info && info.address && isPrivateIp(String(info.address))) return false
    }catch{ /* if cannot resolve, proceed with caution (let fetch fail) */ }
    // allowlist check
    return hostMatchesAllowlist(host, parseAllowlist())
  }catch{
    return false
  }
}

async function doFetch(url: string, body: unknown, secret: string){
  const controller = new AbortController()
  const timer = setTimeout(()=>controller.abort(), Number(process.env.WEBHOOK_TIMEOUT_MS||5000))
  const json = JSON.stringify(body)
  const sig = crypto.createHmac('sha256', secret).update(json).digest('hex')
  try{
    const res = await requestWithCB(url, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'X-Signature': 'sha256='+sig },
      body: json,
      signal: controller.signal
    } as unknown)
    const ok = (res as unknown).ok
    const text = ok ? null : (await (res as unknown).text()).slice(0,500)
    return { ok, error: text }
  }catch(e: unknown){
    return { ok:false, error: (e?.message||'error').slice(0,500) }
  } finally {
    clearTimeout(timer)
  }
}

export async function sendToWebhooks(body: unknown){
  try{
    if(!prisma) return
    const hooks = await (prisma as unknown).webhookEndpoint.findMany({ where: { active: true } })
    for(const h of hooks){
      if(hasQueue && webhookQueue){ await webhookQueue.add('webhook', { hook: h, body }, { attempts: 5, backoff: { type:'exponential', delay: 2000 }, jobId: `${h.id}:${(body?.type||'evt')}:${require('crypto').createHash('sha1').update(JSON.stringify(body)).digest('hex').slice(0,12)}` } as unknown) }
      else { await sendSingleWebhook(h, body) }
    }
  }catch(e: unknown){ logger.error('[webhook] list failed', e?.message||e); try{ await logToDb('error','webhook list failed',{ error: e?.message||String(e) }) }catch{} }
}
 })
    for(const h of hooks){
      await sendSingleWebhook(h, body)
    }
  }catch(e: unknown){
    logger.error('[webhook] list failed', e?.message||e); try{ await logToDb('error','webhook list failed',{ error: e?.message||String(e) }) }catch{}
  }
}

export async function sendSingleWebhook(h: unknown, body: unknown){
  const url = h.url
  try{
    const allowed = await isHostAllowed(url)
    if(!allowed){
      await (prisma as unknown).webhookLog.create({ data: { webhookId: h.id, url, payload: body, status:'FAILED', attempts: 1, error: 'SSRF blocked or host not allowed' } })
      return
    }
    const r = await doFetch(url, body, h.secret)
    await (prisma as unknown).webhookLog.create({ data: { webhookId: h.id, url, payload: body, status: r.ok?'SUCCESS':'FAILED', attempts: 1, error: r.error } })
  }catch(e: unknown){
    await (prisma as unknown).webhookLog.create({ data: { webhookId: h.id, url, payload: body, status:'FAILED', attempts: 1, error: (e?.message||'error').slice(0,500) } }); try{ await logToDb('warn','webhook delivery failed',{ url, error: e?.message||'error' }) }catch{}
    try{ webhookSentTotal.inc({ status: 'fail' }); }catch{}
  }
}
