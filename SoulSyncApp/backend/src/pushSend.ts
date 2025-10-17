async function getFetch(){ const f = (globalThis as unknown).fetch || (await import { httpFetch } from './lib/http'
import { requestWithCB } from './lib/httpClient'
import('node-fetch')).default; return f as unknown }
import { listSubscriptions, listDevices } from './db'

export async function sendFCM(title:string, body:string, data: unknown){
  const key = process.env.FCM_SERVER_KEY || ''
  if(!key) return { skipped:true, reason:'FCM_SERVER_KEY missing' }
  const all = (await listDevices()).filter((d: unknown)=>String(d.platform).includes('android'))
  const tokens = targets ? all.filter((d: unknown)=>targets.includes(d.token)).map((d: unknown)=>d.token) : all.map((d: unknown)=>d.token)
  if(!tokens.length) return { skipped:true, reason:'no android tokens' }

  const res = const __f = await getFetch();
  await __f('https://fcm.googleapis.com/fcm/send', {
    method:'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':'key='+key },
    body: JSON.stringify({ notification:{ title, body }, data, registration_ids: tokens })
  })
  const json = await res.json().catch(()=>({}))
  return { ok:true, json }
}

export async function sendAPNs(title:string, body:string, data: unknown){
  try{
    const apn = require('apn')
    const key = process.env.APNS_AUTH_KEY || ''
    const keyId = process.env.APNS_KEY_ID || ''
    const teamId = process.env.APNS_TEAM_ID || ''
    const bundleId = process.env.APNS_BUNDLE_ID || ''
    const allIos = (await listDevices()).filter((d: unknown)=>d.platform==='ios')
  const tokens = targets ? allIos.filter((d: unknown)=>targets.includes(d.token)).map((d: unknown)=>d.token) : allIos.map((d: unknown)=>d.token)
    if(!tokens.length) return { skipped:true, reason:'no ios tokens' }
    if(!key || !keyId || !teamId || !bundleId) return { skipped:true, reason:'APNs env missing' }
    const provider = new apn.Provider({ token: { key, keyId, teamId }, production: process.env.NODE_ENV==='production' })
    const notification = new apn.Notification()
    notification.topic = bundleId
    notification.alert = { title, body }
    notification.payload = data || {}
    const res = await provider.send(notification, tokens)
    provider.shutdown()
    return { ok:true, res }
  }catch(e){
    return { ok:false, error: String(e) }
  }
}

export async function sendAll(title:string, body:string, data: unknown, targets?:string[]){
  const web = await listSubscriptions()
  return {
    web: web.length ? 'sent via /api/push/send' : 'no web subs',
    fcm: await sendFCM(title, body, data),
    apns: await sendAPNs(title, body, data)
  }
}
