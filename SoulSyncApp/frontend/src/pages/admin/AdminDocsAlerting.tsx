
import React, { useEffect, useMemo, useState } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

export default function AdminDocsAlerting(){
  const [md,setMd]=useState<string>('')
  const [q,setQ]=useState('')
  const [lastUpdated,setLastUpdated]=useState('')
  const html = useMemo(()=> marked.parse(md), [md])
  // Inject ids into headings for TOC anchors
  const htmlWithIds = useMemo(()=>{
    let i = 0
    return (html as string).replace(/<h([1-6])>(.*?)<\/h\1>/g, (_m, lvl, text)=>{
      const id = `toc_${i++}`
      return `<h${lvl} id="${'${'}id${'}'}">${'${'}text${'}'}</h${lvl}>`
    })
  }, [html])


  useEffect(()=>{
    (async()=>{
      const r = await fetch('/api/admin/docs/alerting')
      const t = await r.text()
      setMd(t)
      // derive "last updated" locally (fallback)
      try{ const m = await fetch('/api/admin/docs/alerting/meta').then(r=>r.json()); setLastUpdated(m.lastUpdated||new Date().toLocaleString()) }catch{ setLastUpdated(new Date().toLocaleString()) }
    })()
  },[])

  const filteredHtml = useMemo(()=>{
    if(!q) return DOMPurify.sanitize(html as string)
    const tokens = (marked.lexer(md) as any)
    const lower = q.toLowerCase()
    const parts:string[] = []
    let current:string[] = []
    let include = false
    for(const tok of tokens){
      const txt = (tok.raw || tok.text || '').toLowerCase()
      if(tok.type==='heading'){
        // start new section
        if(include && current.length) parts.push(current.join(''))
        current = [marked.parser([tok])]
        include = txt.includes(lower)
      }else{
        current.push(marked.parser([tok]))
        if(txt.includes(lower)) include = true
      }
    }
    if(include && current.length) parts.push(current.join(''))
    return DOMPurify.sanitize(parts.join('') || '<p><em>No matches.</em></p>')
  },[html, md, q])

  const toc = useMemo(()=>{
    const tokens = (marked.lexer(md) as any)
    const items:{text:string, level:number, id:string}[] = []
    let idx=0
    for(const t of tokens){
      if(t.type==='heading'){
        const id = 'h_'+(idx++)
        items.push({ text: t.text, level: t.depth, id })
      }
    }
    return items
  },[md])

  return (
    <div className="p-4 grid md:grid-cols-[260px,1fr] gap-4">
      <aside className="border rounded p-3 sticky top-2 h-fit">
        <div className="font-medium mb-2">Table of Contents</div>
        <ul className="space-y-1 text-sm">
          {toc.map((t,i)=>(<li key={i} style={{ paddingLeft: (t.level-1)*12 }}><a href={'#toc_'+i} className="underline">{t.text}</a></li>))}
        </ul>
      </aside>
      <main className="space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Alerting Documentation</h1>
          <button className="underline ml-auto" onClick={()=> window.location.href='/api/admin/docs/alerting/export-pdf'}>Download PDF</button>
        </div>
        <div className="text-xs text-gray-500">Last updated: {lastUpdated}</div>
        <div>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search docs..." className="border rounded px-2 py-1 w-full md:w-80" />
        </div>
        <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: q? filteredHtml : DOMPurify.sanitize(htmlWithIds as string) }} />
      </main>
    </div>
  )
}
