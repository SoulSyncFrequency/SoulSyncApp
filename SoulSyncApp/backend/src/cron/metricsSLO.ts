import { requestWithCB } from './lib/httpClient'
import { register } from '../metrics'
import { logToDb } from '../logger'
import fetch from 'node-fetch'

const WEBHOOK = process.env.SLO_ALERT_WEBHOOK || ''

export async function sloCheckHourly(){
  try{
    const metricsText = await register.metrics()
    // very simple parse for counters
    function readCounter(name:string, label?:string){
      const re = new RegExp(`^${name}{${label?label:''}.*} (\d+)`, 'm')
      const m = metricsText.match(re)
      return m ? Number(m[1]) : 0
    }
    const whSucc = readCounter('webhook_sent_total', 'status="success"')
    const whFail = readCounter('webhook_sent_total', 'status="fail"')
    const emSucc = readCounter('email_sent_total', 'status="success"')
    const emFail = readCounter('email_sent_total', 'status="fail"')
    const whRatio = whSucc+whFail ? whFail/(whSucc+whFail) : 0
    const emRatio = emSucc+emFail ? emFail/(emSucc+emFail) : 0

    const thresh = Number(process.env.SLO_FAIL_THRESHOLD||0.3)
    let alerts:string[] = []
    if(whRatio > thresh) alerts.push(`Webhook fail ratio ${(whRatio*100).toFixed(0)}%`)
    if(emRatio > thresh) alerts.push(`Email fail ratio ${(emRatio*100).toFixed(0)}%`)

    if(alerts.length){
      const msg = `SLO Alert: ${alerts.join(' | ')}`
      await logToDb('warn', msg, { whSucc, whFail, emSucc, emFail })
      if(WEBHOOK){
        try{ await requestWithCB(WEBHOOK,{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text: msg }) }) }catch{}
      }
    }
  }catch(e: unknown){
    await logToDb('error','sloCheckHourly failed',{ error: e?.message||String(e) })
  }
}
