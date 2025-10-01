import { requestWithCB } from './lib/httpClient'
export async function createIssue(opts: { repo?: string, title: string, body?: string, labels?: string[] }){
  const token = process.env.GITHUB_TOKEN || ''
  const repo = opts.repo || process.env.GITHUB_REPO || ''
  if(!token || !repo) return { ok:false, skipped: true }
  try{
    const r = await requestWithCB(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github+json' },
      body: JSON.stringify({ title: opts.title, body: opts.body||'', labels: opts.labels||['auto'] })
    })
    const d = await r.json()
    return { ok: r.ok, data: d }
  }catch(e:any){
    return { ok:false, error: e?.message||String(e) }
  }
}
