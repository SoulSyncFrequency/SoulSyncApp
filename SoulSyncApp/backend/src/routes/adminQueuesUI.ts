import { requestWithCB } from './lib/httpClient'
import crypto from 'crypto'
import { Router } from 'express'
import path from 'path'

const r = Router()

// Very small static HTML that fetches JSON endpoints with x-admin-token
r.get('/admin/queues/ui', (req,res,next)=>{ if(process.env.ADMIN_UI_ENABLED==='false'){ return res.status(404).send('disabled') } next() },, (_req, res) => {
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Queues Admin</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Arial;margin:16px}
table{border-collapse:collapse;width:100%;margin-top:12px}
th,td{border:1px solid #ddd;padding:8px;text-align:left}
th{background:#f3f4f6}
input{padding:6px 10px;margin-right:6px}
button{padding:6px 10px}
.small{color:#555;font-size:12px}
pre{white-space:pre-wrap;word-break:break-word;background:#111;color:#eee;padding:12px;border-radius:8px}
</style>
</head>
<body>
<h1>Queues Admin</h1><p><a href="/admin/logs" target="_blank">Admin Logs (JSON)</a></p>
<p class="small">Ova stranica poziva <code>/admin/queues</code> i <code>/admin/queues/:name/dlq</code> uz header <code>x-admin-token</code>.</p>
<div>
  <input id="token" placeholder="x-admin-token" />
  <button onclick="load()">Učitaj</button>
</div>
<div id="summary"></div>
<div style="margin-top:8px"><input id="filter" placeholder="filter (id, name, error, data)" style="width:60%" oninput="filterDlq()"/></div>
<div id="dlq"></div><div style="margin-top:8px"><button id="loadMore" style="display:none" onclick="loadMore()">Load more</button></div>
<script nonce="${nonce}" nonce="${nonce}">
async function load(){
  const ct = await requestWithCB('/admin/csrf'); const cj = await ct.json(); window._csrf = cj.csrfToken || '';

  const token = document.getElementById('token').value
  const res = await requestWithCB('/admin/queues', { headers: { 'x-admin-token': token }})
  if(!res.ok){ document.getElementById('summary').innerHTML='<p>Forbidden</p>'; return }
  const data = await res.json()
  let html = '<table><tr><th>Queue</th><th>Waiting</th><th>Active</th><th>Delayed</th><th>Failed</th><th>Paused</th><th>DLQ</th></tr>'
  for(const q of data.queues){
    html += '<tr><td>'+q.name+'</td><td>'+q.waiting+'</td><td>'+q.active+'</td><td>'+q.delayed+'</td><td>'+q.failed+'</td><td>'+q.paused+'</td><td><button onclick="showDlq(\''+q.name+'\')">Open</button></td></tr>'
  }
  html += '</table>'
  document.getElementById('summary').innerHTML = html
  window._token = token
}
async function showDlq(name){
  const res = await requestWithCB('/admin/queues/'+name+'/dlq?offset='+_offset+'&limit='+_limit, { headers: { 'x-admin-token': window._token }})
  const data = await res.json()
  let items = data.items || []
  let html = '<h2>'+data.name+':dlq</h2>'+
      '<button onclick="downloadDlq(\''+data.name+'\')">Download JSON</button>'+\n      '<button onclick="downloadDlqCsv(\''+data.name+'\')">Download CSV</button>'+\n      '<button style="font-weight:bold;color:green" onclick="downloadDlqXlsx(\''+data.name+'\')">Download XLSX</button>'+
      '<input id="purgeDays" placeholder="days (optional)" style="width:80px" />'+
      '<button onclick="purgeDlq(\''+data.name+'\')">Purge DLQ</button>'+
      '<table>'<tr><th>JobId</th><th>Name</th><th>Error</th><th>Data</th></tr>'
  for(const it of items){
    html += '<tr><td>'+it.id+'</td><td>'+it.name+'</td><td>'+String(it.failedReason||it.error||'')+'</td><td><pre>'+JSON.stringify(it.data||it.original||{},null,2)+'</pre></td></tr>'
  }
  html += '</table>'
  document.getElementById('dlq').innerHTML = html
}
async function downloadDlq(name){
  const res = await requestWithCB('/admin/queues/'+name+'/dlq?download=1',{headers:{'x-admin-token':window._token}})
  if(res.ok){
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name+'-dlq.json'
    a.click()
    URL.revokeObjectURL(url)
  }
}
async function purgeDlq(name){
  if(!confirm('Stvarno obrisati DLQ '+name+'?')) return
  const days = document.getElementById('purgeDays').value
  const url = '/admin/queues/'+name+'/dlq?purge=1'+(days?('&days='+days):'')
  const res = await requestWithCB(url,{method:'POST',headers:{'x-admin-token':window._token,'x-csrf-token':window._csrf}})
  const data = await res.json()
  alert('Purged '+(data.purged||0)+' jobs from '+name+':dlq')
}
async function downloadDlqCsv(name){
  const res = await requestWithCB('/admin/queues/'+name+'/dlq?download=csv',{headers:{'x-admin-token':window._token}})
  if(res.ok){
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name+'-dlq.csv'
    a.click()
    URL.revokeObjectURL(url)
  }
}
async function downloadDlqXlsx(name){
  const res = await requestWithCB('/admin/queues/'+name+'/dlq?download=xlsx',{headers:{'x-admin-token':window._token}})
  if(res.ok){
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name+'-dlq.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }
}
let _dlqItems = []
let _offset = 0
let _limit = 50
let _name = ''
function filterDlq(){
  const q = (document.getElementById('filter').value||'').toLowerCase()
  const rows = _dlqItems.filter(it=> !q || JSON.stringify(it).toLowerCase().includes(q))
  renderDlq(rows)
}
function renderDlq(items){
  let html = '<table><tr><th>JobId</th><th>Name</th><th>Error</th><th>Data</th></tr>'
  for(const it of items){
    html += '<tr><td>'+it.id+'</td><td>'+it.name+'</td><td>'+String(it.failedReason||it.error||'')+'</td><td><pre>'+JSON.stringify(it.data||it.original||{},null,2)+'</pre></td></tr>'
  }
  html += '</table>'
  document.getElementById('dlq').innerHTML = html
}

async function load(){
  const ct = await requestWithCB('/admin/csrf'); const cj = await ct.json(); window._csrf = cj.csrfToken || '';

  const token = document.getElementById('token').value
  const res = await requestWithCB('/admin/queues', { headers: { 'x-admin-token': token }})
  if(!res.ok){ document.getElementById('summary').innerHTML='<p>Forbidden</p>'; return }
  const data = await res.json()
  let html = '<table><tr><th>Queue</th><th>Waiting</th><th>Active</th><th>Delayed</th><th>Failed</th><th>Paused</th><th>DLQ</th></tr>'
  for(const q of data.queues){
    html += '<tr><td>'+q.name+'</td><td>'+q.waiting+'</td><td>'+q.active+'</td><td>'+q.delayed+'</td><td>'+q.failed+'</td><td>'+q.paused+'</td><td><button onclick="showDlq(\''+q.name+'\')">Open</button></td></tr>'
  }
  html += '</table>'
  document.getElementById('summary').innerHTML = html
  window._token = token
}
async function showDlq(name){
  const res = await requestWithCB('/admin/queues/'+name+'/dlq?offset='+_offset+'&limit='+_limit, { headers: { 'x-admin-token': window._token }})
  const data = await res.json()
  let items = data.items || []
  let html = '<h2>'+data.name+':dlq</h2>'+
      '<button onclick="downloadDlq(\''+data.name+'\')">Download JSON</button>'+\n      '<button onclick="downloadDlqCsv(\''+data.name+'\')">Download CSV</button>'+\n      '<button style="font-weight:bold;color:green" onclick="downloadDlqXlsx(\''+data.name+'\')">Download XLSX</button>'+
      '<input id="purgeDays" placeholder="days (optional)" style="width:80px" />'+
      '<button onclick="purgeDlq(\''+data.name+'\')">Purge DLQ</button>'+
      '<table>'<tr><th>JobId</th><th>Name</th><th>Error</th><th>Data</th></tr>'
  for(const it of items){
    html += '<tr><td>'+it.id+'</td><td>'+it.name+'</td><td>'+String(it.failedReason||it.error||'')+'</td><td><pre>'+JSON.stringify(it.data||it.original||{},null,2)+'</pre></td></tr>'
  }
  html += '</table>'
  document.getElementById('dlq').innerHTML = html
}
async function downloadDlq(name){
  const res = await requestWithCB('/admin/queues/'+name+'/dlq?download=1',{headers:{'x-admin-token':window._token}})
  if(res.ok){
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name+'-dlq.json'
    a.click()
    URL.revokeObjectURL(url)
  }
}
async function purgeDlq(name){
  if(!confirm('Stvarno obrisati DLQ '+name+'?')) return
  const days = document.getElementById('purgeDays').value
  const url = '/admin/queues/'+name+'/dlq?purge=1'+(days?('&days='+days):'')
  const res = await requestWithCB(url,{method:'POST',headers:{'x-admin-token':window._token,'x-csrf-token':window._csrf}})
  const data = await res.json()
  alert('Purged '+(data.purged||0)+' jobs from '+name+':dlq')
}
async function downloadDlqCsv(name){
  const res = await requestWithCB('/admin/queues/'+name+'/dlq?download=csv',{headers:{'x-admin-token':window._token}})
  if(res.ok){
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name+'-dlq.csv'
    a.click()
    URL.revokeObjectURL(url)
  }
}
async function downloadDlqXlsx(name){
  const res = await requestWithCB('/admin/queues/'+name+'/dlq?download=xlsx',{headers:{'x-admin-token':window._token}})
  if(res.ok){
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name+'-dlq.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }
}

// patch showDlq to cache items
const _origShowDlq = showDlq
showDlq = async function(name){
  _name = name; _offset = 0; _dlqItems = []
  const res = await requestWithCB('/admin/queues/'+name+'/dlq?offset='+_offset+'&limit='+_limit, { headers: { 'x-admin-token': window._token }})
  const data = await res.json()
  _dlqItems = data.items || []
  _offset = data.nextOffset || null
  document.getElementById('loadMore').style.display = (_offset!=null)?'inline-block':'none'
  renderDlq(_dlqItems)
}
async function loadMore(){
  if(_offset==null) return
  const res = await requestWithCB('/admin/queues/'+_name+'/dlq?offset='+_offset+'&limit='+_limit, { headers: { 'x-admin-token': window._token }})
  const data = await res.json()
  _dlqItems = _dlqItems.concat(data.items||[])
  _offset = data.nextOffset || null
  renderDlq(_dlqItems)
  document.getElementById('loadMore').style.display = (_offset!=null)?'inline-block':'none'
}
</script>
</body></html>`
  res.type('html').send(html)
})

export default r
