
import { Router } from 'express'

const router = Router()
router.get('/ops/config-lint', (_req, res) => {
  try{
    const env = process.env
    const issues: { level: 'info'|'warn'|'error', code: string, message: string }[] = []

    // COOP/COEP vs iframes (Grafana embeding typically needs cross-origin)
    const coop = (env.ENABLE_COOP_COEP||'false').toLowerCase()==='true'
    const graf = (env.GRAFANA_DASH_URL||'').trim()
    if (coop && graf) issues.push({ level:'warn', code:'coop_coep_iframe', message: 'ENABLE_COOP_COEP=true može blokirati embedding GRAFANA_DASH_URL (iframe). Razmotri isključivanje ili CORP iznimke.' })

    // Compression flag present but module might be missing – we can only remind
    const comp = (env.COMPRESSION_ENABLED||'false').toLowerCase()==='true'
    if (comp) issues.push({ level:'info', code:'compression_flag', message: 'COMPRESSION_ENABLED=true — provjeri da je paket `compression` instaliran u build okruženju.' })

    // Alerts enabled but missing token/endpoint
    const alerts = (env.OPS_ALERTS_ENABLED||'false').toLowerCase()==='true'
    if (alerts && !env.OPS_ALERT_TOKEN) issues.push({ level:'warn', code:'alerts_token_missing', message: 'OPS_ALERTS_ENABLED=true bez OPS_ALERT_TOKEN — preporuka: zaštititi endpoint tokenom.' })

    // SMTP/Email notify completeness
    if (env.NOTIFY_EMAIL_TO && !env.SMTP_URL) issues.push({ level:'warn', code:'notify_email_no_smtp', message: 'NOTIFY_EMAIL_TO je postavljen ali nema SMTP_URL.' })

    // Security headers defaults (informational)
    if ((env.CSP_REPORT_ONLY||'false').toLowerCase()==='true') issues.push({ level:'info', code:'csp_report_only', message: 'CSP radi u report-only modu — u produksiji preferiraj enforce.' })

    res.json({ ok:true, issues })
  }catch(e:any){
    res.status(500).json({ error:'config_lint_error', message:String(e?.message||e) })
  }
})

export default router
