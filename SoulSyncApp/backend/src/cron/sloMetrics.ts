import { requestWithCB } from './lib/httpClient'
import { register } from '../metrics'
import { prisma } from '../db/prismaClient'
import { logToDb } from '../logging/sink'

let WEBHOOK_FAIL_ALERT = Number(process.env.SLO_WEBHOOK_FAIL_ALERT||50) // percent
let EMAIL_FAIL_ALERT = Number(process.env.SLO_EMAIL_FAIL_ALERT||50)

import { autoTicket } from '../utils/autoTicket'
import { createIssue } from '../services/github'

export async function checkSLOs(){
  try{

    // Load SLO config from DB if present
    try{
      const cfg = await (prisma as unknown).sLOConfig.findUnique({ where: { id: 1 } })
      if(cfg){ WEBHOOK_FAIL_ALERT = cfg.webhookFailAlertPct; EMAIL_FAIL_ALERT = cfg.emailFailAlertPct }
      var alertUrl = cfg?.alertWebhookUrl || process.env.SLO_ALERT_WEBHOOK_URL || ''
    }catch{ var alertUrl = process.env.SLO_ALERT_WEBHOOK_URL || '' }
    
    const webhook = register.getSingleMetric('webhook_sent_total') as unknown
    const email = register.getSingleMetric('email_sent_total') as unknown
    if(!webhook || !email) return
    const wVals = (await webhook.get()).values || []
    const eVals = (await email.get()).values || []
    const wSucc = sumByLabel(wVals, 'success'), wFail = sumByLabel(wVals, 'fail')
    const eSucc = sumByLabel(eVals, 'success'), eFail = sumByLabel(eVals, 'fail')
    const wRatio = ratio(wFail, wSucc)
    const eRatio = ratio(eFail, eSucc)
    if(wRatio >= WEBHOOK_FAIL_ALERT){ try{ await logToDb('WARN', `Webhook fail ratio ${wRatio}%`, { succ:wSucc, fail:wFail }); await postAlert(alertUrl, { type:'SLO_WEBHOOK', ratio:wRatio, succ:wSucc, fail:wFail }) }catch{} }
    if(eRatio >= EMAIL_FAIL_ALERT){ try{ await logToDb('WARN', `Email fail ratio ${eRatio}%`, { succ:eSucc, fail:eFail }); await postAlert(alertUrl, { type:'SLO_EMAIL', ratio:eRatio, succ:eSucc, fail:eFail }) }catch{} }
  }catch(e: unknown){
    try{ await logToDb('ERROR', 'SLO check failed', { err: e?.message||String(e) }) }catch{}
  }
}

function sumByLabel(values: unknown[], label: string){ 
  return values.filter(v=> (v.labels||{}).status===label).reduce((a,b)=> a + (b.value||0), 0)
}
function ratio(fail:number, succ:number){ 
  const tot = fail+succ; if(!tot) return 0; return Math.round((fail/tot)*100) 
}


async function postAlert(url:string, payload: unknown){
  if(!url) return
  try{
    const ctrl = new AbortController()
    const timer = setTimeout(()=>ctrl.abort(), 5000)
    await requestWithCB(url, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload), signal: ctrl.signal } as unknown)
    clearTimeout(timer)
  }catch{}
}

// Auto-ticketing (simple): if webhook/email failure > configured, open a GitHub issue (rate-limited)
try{
  const critical = Math.max(Number(process.env.SLO_WEBHOOK_FAIL_ALERT||0), Number(process.env.SLO_EMAIL_FAIL_ALERT||0))
  if(critical>=1){
    await autoTicket('slo-critical', async ()=> createIssue({
      title: `SLO critical breach at ${new Date().toISOString()}`,
      body: 'Automated alert: check dashboards and logs.',
      labels: ['slo','auto']
    }))
  }
}catch{}
