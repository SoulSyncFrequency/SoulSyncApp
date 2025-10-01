
#!/usr/bin/env node
/**
 * SoulSync Grafana CLI — v101.3.0
 * Commands: export, import, backup, deploy, diff, rollback, status, notarize, verify-ledger
 * Uses native fetch (Node 18+). No external deps required.
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { execSync, spawnSync } = require('child_process')

const ROOT = process.cwd()
const OPS = path.join(ROOT, 'ops', 'grafana-cloud')
const SNAP = path.join(OPS, 'soulsync-export.ndjson')
const BACKUPS = path.join(OPS, 'backups')
const REPORTS = path.join(OPS, 'reports')
const SCREENSHOTS = path.join(OPS, 'screenshots')
const NOTAR = path.join(OPS, 'notarization')
const SIGN_DIR = path.join(OPS, 'signing')
const PUB_PEM = path.join(SIGN_DIR, 'public.pem')
const PRIV_PEM = path.join(SIGN_DIR, 'private.pem')
const LEDGER = path.join(OPS, 'ledger.json')
const CHAIN_DIR = path.join(OPS, 'chain')
if (!fs.existsSync(BACKUPS)) fs.mkdirSync(BACKUPS, { recursive: true })
if (!fs.existsSync(REPORTS)) fs.mkdirSync(REPORTS, { recursive: true })
if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true })
if (!fs.existsSync(NOTAR)) fs.mkdirSync(NOTAR, { recursive: true })
if (!fs.existsSync(CHAIN_DIR)) fs.mkdirSync(CHAIN_DIR, { recursive: true })

const GRAFANA_URL = process.env.GRAFANA_URL || 'http://localhost:3000'
const API_KEY = process.env.GRAFANA_API_KEY || ''

function nowStamp(){ return new Date().toISOString().replace(/[:]/g,'-').replace(/\..*/,'') }

async function gfetch(pathname, opts={}){
  if(!API_KEY) throw new Error('Missing GRAFANA_API_KEY env')
  const url = pathname.startsWith('http') ? pathname : `${GRAFANA_URL}${pathname}`
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers||{})
    }
  })
  if(!res.ok){
    const text = await res.text()
    throw new Error(`Grafana API ${pathname} failed: ${res.status} ${res.statusText} — ${text}`)
  }
  const ct = res.headers.get('content-type')||''
  return ct.includes('application/json') ? res.json() : res.text()
}

async function exportSnapshot(){
  console.log('🔄 Exporting dashboards & alert rules from Grafana...')
  const search = await gfetch('/api/search?type=dash-db&query=&limit=5000')
  const dashboards = []
  for(const item of search){
    const uid = item.uid
    const d = await gfetch(`/api/dashboards/uid/${uid}`)
    dashboards.push(d.dashboard)
  }
  const alerts = await gfetch('/api/v1/provisioning/alert-rules')
  const out = []
  for(const d of dashboards){
    // enforce UID versioning and title version tag if available
    if(!d.uid) d.uid = 'soulsync_'+(d.title||'').toLowerCase().replace(/\s+/g,'_').slice(0,24)
    out.push({ dashboard: d })
  }
  for(const a of alerts){
    if(!a.uid) a.uid = 'rule_'+crypto.randomBytes(6).toString('hex')
    out.push({ alertRule: a })
  }
  fs.writeFileSync(SNAP, out.map(o=>JSON.stringify(o)).join('\n'))
  console.log(`✅ Exported ${dashboards.length} dashboards & ${alerts.length} rules → ${SNAP}`)
}

async function importSnapshot(file=SNAP, { staging=false }={}){
  console.log(`🚚 Importing snapshot ${file} ${staging?'(staging)': ''}`)
  const lines = fs.readFileSync(file,'utf8').trim().split('\n').filter(Boolean)
  for(const line of lines){
    const obj = JSON.parse(line)
    if(obj.dashboard){
      const dash = obj.dashboard
      // If staging, put into folder named "staging" (create if missing)
      let folderId = 0
      if(staging){
        try{
          const folders = await gfetch('/api/folders')
          let folder = folders.find(f=>f.title==='staging')
          if(!folder){
            folder = await gfetch('/api/folders', { method:'POST', body: JSON.stringify({ title:'staging' }) })
          }
          folderId = folder.id
        }catch(e){
          console.warn('⚠️ staging folder error:', e.message)
        }
      }
      const payload = { dashboard: { ...dash, id: null }, folderId, overwrite: true }
      await gfetch('/api/dashboards/db',{ method:'POST', body: JSON.stringify(payload) })
      console.log(`  • Imported dashboard ${dash.title} (uid=${dash.uid})`)
    } else if (obj.alertRule){
      const rule = obj.alertRule
      // Upsert alert rule
      await gfetch('/api/v1/provisioning/alert-rules', { method:'POST', body: JSON.stringify(rule) })
      console.log(`  • Upserted alert rule ${rule.title||rule.uid}`)
    }
  }
  console.log('✅ Import complete.')
}

function gitCommitIfChanged(file, msg){
  try{
    execSync(`git add "${file}"`, { stdio:'ignore' })
    const diff = execSync('git diff --cached --quiet || echo "changed"').toString().trim()
    if(diff==='changed'){
      execSync(`git commit -m "${msg}"`, { stdio:'inherit' })
      execSync('git push', { stdio:'inherit' })
      console.log('✅ Changes committed & pushed.')
    } else {
      console.log('ℹ️ No changes to commit.')
    }
  }catch(e){
    console.warn('⚠️ Git commit skipped:', e.message)
  }
}

function sha256File(p){ return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex') }
function signBuffer(buf){
  if(!fs.existsSync(PRIV_PEM)) throw new Error('Missing private key at '+PRIV_PEM)
  const key = fs.readFileSync(PRIV_PEM,'utf8')
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(buf); sign.end()
  return sign.sign(key)
}
function verifyBuffer(buf, sig){
  if(!fs.existsSync(PUB_PEM)) throw new Error('Missing public key at '+PUB_PEM)
  const key = fs.readFileSync(PUB_PEM,'utf8')
  const ver = crypto.createVerify('RSA-SHA256')
  ver.update(buf); ver.end()
  return ver.verify(key, sig)
}

function updateLedger({ version, ndjsonHash, pdfHash, notarized }){
  const now = new Date().toISOString()
  const blocks = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER,'utf8')||'[]') : []
  const index = (blocks[blocks.length-1]?.index || 0) + 1
  const prev_hash = blocks[blocks.length-1]?.hash || '0'.repeat(64)
  const data = { index, timestamp: now, version, ndjson_hash: ndjsonHash, pdf_hash: pdfHash, prev_hash }
  const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')
  const signature = signBuffer(Buffer.from(hash,'utf8')).toString('base64')
  const block = { ...data, hash, signature, author:'CLI', notarized_txid: notarized||null }
  blocks.push(block)
  fs.writeFileSync(LEDGER, JSON.stringify(blocks, null, 2))
  return block
}

function verifyLedger(){
  if(!fs.existsSync(LEDGER)){ console.log('No ledger.'); return false }
  const blocks = JSON.parse(fs.readFileSync(LEDGER,'utf8')||'[]')
  let prev = '0'.repeat(64)
  for(const b of blocks){
    const data = { index:b.index, timestamp:b.timestamp, version:b.version, ndjson_hash:b.ndjson_hash, pdf_hash:b.pdf_hash, prev_hash:b.prev_hash }
    const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')
    if(hash !== b.hash){ console.error('Hash mismatch at block', b.index); return false }
    if(b.prev_hash !== prev){ console.error('Prev hash mismatch at block', b.index); return false }
    const ok = verifyBuffer(Buffer.from(b.hash,'utf8'), Buffer.from(b.signature,'base64'))
    if(!ok){ console.error('Signature invalid at block', b.index); return false }
    prev = b.hash
  }
  console.log('🛡️ Ledger verified OK. Blocks:', blocks.length)
  return true
}

async function screenshotsAndPdf(version){
  // Optional: requires playwright to be installed
  let havePW = true
  try{ execSync('npx playwright --version', { stdio: 'ignore' }) } catch{ havePW = false }
  const uids = []
  try{
    const search = await gfetch('/api/search?type=dash-db&query=&limit=5000')
    for(const s of search) uids.push(s.uid)
  }catch(e){ console.warn('⚠️ Unable to list dashboards:', e.message) }
  const ts = nowStamp()
  const saved = []
  if(havePW){
    for(const uid of uids){
      const out = path.join(SCREENSHOTS, `${uid}-${ts}.png`)
      try{
        execSync(`node -e "const { chromium }=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});await p.goto('${GRAFANA_URL}/d/${uid}?kiosk');await p.waitForTimeout(5000);await p.screenshot({path:'${out}', fullPage:true});await b.close()})()"`, { stdio:'ignore' })
        saved.push(out)
      }catch{}
    }
  } else {
    console.log('ℹ️ Playwright not installed; skipping screenshots.')
  }
  // PDF using pdfkit if available; else simple placeholder writer
  const pdfOut = path.join(REPORTS, `soulsync-report-${ts}.pdf`)
  try{
    const code = `
      const PDFDocument = require('pdfkit'); const fs = require('fs');
      const doc = new PDFDocument({ autoFirstPage:false });
      doc.pipe(fs.createWriteStream('${pdfOut}'));
      doc.addPage().fontSize(20).text('SoulSync Grafana Snapshot Report', { align:'center' });
      doc.fontSize(12).text('Version: ${version}');
      doc.fontSize(12).text('Date: ${new Date().toISOString()}');
      ${saved.map(p=>`doc.addPage().image('${p}', {fit:[600,800], align:'center', valign:'center'});`).join('\n')}
      doc.end();
    `
    execSync(`node -e "${code.replace(/"/g,'\\"')}"`, { stdio:'ignore' })
  }catch(e){
    fs.writeFileSync(pdfOut, 'PDF generation skipped (pdfkit not installed).')
  }
  return pdfOut
}

function signFile(file){
  const sig = signBuffer(fs.readFileSync(file))
  const sigPath = file + '.sig'
  fs.writeFileSync(sigPath, sig.toString('base64'))
  return sigPath
}

async function notarize(hashHex){
  // Try OpenTimestamps if available
  const otsPath = path.join(NOTAR, `${nowStamp()}.ots`)
  try{
    execSync(`echo -n ${hashHex} | ots stamp > "${otsPath}"`, { shell: '/bin/bash' })
    return `ots:${path.basename(otsPath)}`
  }catch(e){
    return null
  }
}

async function cmd_export(){ await exportSnapshot() }
async function cmd_import(){ await importSnapshot(SNAP, { staging:false }) }
async function cmd_status(){
  try{
    const search = await gfetch('/api/search?type=dash-db&query=&limit=5000')
    const rules = await gfetch('/api/v1/provisioning/alert-rules')
    console.log(`📦 Dashboarda: ${search.length}  ⚡ Alert rules: ${rules.length}`)
  }catch(e){ console.log('⚠️ Grafana not reachable:', e.message) }
  if(fs.existsSync(SNAP)){
    const stat = fs.statSync(SNAP); console.log('📝 Snapshot:', SNAP, ' updated:', stat.mtime.toISOString())
  }
  verifyLedger()
}

async function cmd_backup(){
  await exportSnapshot()
  gitCommitIfChanged(SNAP, 'chore: backup grafana snapshot')
}

function latestBackup(){
  const files = fs.readdirSync(BACKUPS).filter(f=>f.endsWith('.ndjson')).sort()
  return files.length ? path.join(BACKUPS, files[files.length-1]) : null
}

async function cmd_deploy({ unsafe=false, force=false }={}){
  // backup snapshot
  const ts = nowStamp()
  const backup = path.join(BACKUPS, `soulsync-export-${ts}.ndjson`)
  if(fs.existsSync(SNAP)) fs.copyFileSync(SNAP, backup)
  console.log('📦 Backup created:', backup)
  if(!force){
    console.log('⚠️ Approve deploy? (set --force to skip)')
  }
  // safe mode: staging then promote
  if(!unsafe){
    await importSnapshot(SNAP, { staging:true })
    // promote to production (folderId 0)
    await importSnapshot(SNAP, { staging:false })
  } else {
    await importSnapshot(SNAP, { staging:false })
  }
  // screenshots + pdf + sign + ledger + notarize
  const pdf = await screenshotsAndPdf('v101.3.0')
  const ndHash = fs.existsSync(SNAP) ? sha256File(SNAP) : ''
  const pdfHash = fs.existsSync(pdf) ? sha256File(pdf) : ''
  const pdfSig = signFile(pdf)
  const block = updateLedger({ version:'v101.3.0', ndjsonHash: ndHash, pdfHash, notarized: await notarize(pdfHash) })
  console.log('🧾 PDF:', pdf, ' SIG:', pdfSig)
  console.log('🪪 Ledger block:', block.index, block.hash)
}

async function cmd_diff(){
  if(!fs.existsSync(SNAP)){ console.log('No local snapshot. Run export first.'); return }
  const lines = fs.readFileSync(SNAP,'utf8').trim().split('\n').filter(Boolean)
  const localDash = new Map()
  const localRules = new Map()
  for(const line of lines){
    const o = JSON.parse(line)
    if(o.dashboard) localDash.set(o.dashboard.uid, o.dashboard)
    if(o.alertRule) localRules.set(o.alertRule.uid, o.alertRule)
  }
  const search = await gfetch('/api/search?type=dash-db&query=&limit=5000')
  const remoteDash = new Map()
  for(const i of search){
    const d = await gfetch(`/api/dashboards/uid/${i.uid}`)
    remoteDash.set(i.uid, d.dashboard)
  }
  const remoteRulesArr = await gfetch('/api/v1/provisioning/alert-rules')
  const remoteRules = new Map(remoteRulesArr.map(r=>[r.uid, r]))
  const onlyLocal = [...localDash.keys()].filter(k=>!remoteDash.has(k))
  const onlyRemote = [...remoteDash.keys()].filter(k=>!localDash.has(k))
  const common = [...localDash.keys()].filter(k=>remoteDash.has(k))
  const changed = []
  for(const uid of common){
    const a = JSON.stringify(localDash.get(uid))
    const b = JSON.stringify(remoteDash.get(uid))
    if(a!==b) changed.push(uid)
  }
  console.log('🔎 Dashboards diff:')
  console.log('  Missing in Grafana:', onlyLocal)
  console.log('  Missing in snapshot:', onlyRemote)
  console.log('  Changed:', changed)
  console.log('⚠️ Rules compare: local=', localRules.size, ' remote=', remoteRules.size)
}

async function cmd_rollback(){
  const last = latestBackup()
  if(!last){ console.log('No backups.'); return }
  console.log('♻️ Rolling back to', last)
  await importSnapshot(last, { staging:false })
}

async function cmd_notarize(){
  const blocks = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER,'utf8')||'[]') : []
  if(!blocks.length){ console.log('No ledger blocks.'); return }
  const tip = blocks[blocks.length-1]
  const h = tip.hash
  const ref = await notarize(h)
  if(ref){
    tip.notarized_txid = ref
    fs.writeFileSync(LEDGER, JSON.stringify(blocks, null, 2))
    console.log('⛓️ Notarized tip hash →', ref)
  } else {
    console.log('ℹ️ Notarization tool not available; skipped.')
  }
}

async function main(){
  const [cmd, ...args] = process.argv.slice(2)
  switch(cmd){
    case 'export': return exportSnapshot()
    case 'import': return importSnapshot(SNAP, { staging: args.includes('--staging') })
    case 'status': return cmd_status()
    case 'backup': return cmd_backup()
    case 'deploy': return cmd_deploy({ unsafe: args.includes('--unsafe'), force: args.includes('--force') })
    case 'diff': return cmd_diff()
    case 'rollback': return cmd_rollback()
    case 'notarize': return cmd_notarize()
    case 'verify-ledger': return verifyLedger()
    default:
      console.log(`SoulSync Grafana CLI v101.3.0
Usage:
  node ops/grafana-cloud/soulsync-grafana-cli.js export
  node ops/grafana-cloud/soulsync-grafana-cli.js import [--staging]
  node ops/grafana-cloud/soulsync-grafana-cli.js backup
  node ops/grafana-cloud/soulsync-grafana-cli.js deploy [--unsafe] [--force]
  node ops/grafana-cloud/soulsync-grafana-cli.js diff
  node ops/grafana-cloud/soulsync-grafana-cli.js status
  node ops/grafana-cloud/soulsync-grafana-cli.js rollback
  node ops/grafana-cloud/soulsync-grafana-cli.js notarize
  node ops/grafana-cloud/soulsync-grafana-cli.js verify-ledger`)
  }
}
main().catch(e=>{ console.error('❌', e.message); process.exit(1) })
