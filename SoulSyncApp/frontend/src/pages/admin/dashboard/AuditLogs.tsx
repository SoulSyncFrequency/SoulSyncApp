import React, { useState } from 'react';

export default function AuditLogs() {
  const [logs,setLogs]=useState<any[]>([]);
  const [analysis,setAnalysis]=useState<string>('');
  const [q,setQ]=useState('');
  const [limit,setLimit]=useState(200);
  const loadLogs = async ()=>{
    const r=await fetch(`/admin/audit?limit=${limit}&q=${encodeURIComponent(q)}`); const d=await r.json(); setLogs(d.lines||[]);
  };
  const exportCsv = ()=>{
  if(!logs.length) return;
  const headers = Object.keys(typeof logs[0]==='string'? {line:''}: logs[0]);
  const rows = logs.map(l=> typeof l==='string'? [l] : headers.map(h=>l[h]));
  const csv = [headers.join(','), ...rows.map(r=>r.join(','))].join('\n');
  const blob = new Blob([csv],{type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'audit_logs.csv'; a.click();
};

  const analyze = async ()=>{
    const r=await fetch('/admin/logs/analyze',{method:'POST'});
    const d=await r.json(); setAnalysis(d.summary||d.error);
  };

  return (
    <div className="border rounded p-4">
      <h2 className="font-bold mb-2">Audit Logs</h2>
      <div className="flex gap-2 items-center mb-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search (path/method/user)" className="border p-1 text-sm"/>
        <input value={limit} onChange={e=>setLimit(Number(e.target.value)||200)} className="border p-1 text-sm w-20" />
        <button onClick={loadLogs} className="px-3 py-1 bg-gray-300 rounded">Load</button>
        <button onClick={exportCsv} className='px-2 py-1 bg-green-500 text-white rounded text-xs'>Export CSV</button>
            <span className="text-xs text-gray-500">DB-backed if Prisma active</span>
      </div>
      <div className="mt-2 text-sm max-h-64 overflow-y-auto bg-gray-50 p-2">
        {logs.map((l:any,i:number)=>(
          <div key={i} className="border-b py-1">
            {typeof l === 'string' ? l : (<div className="grid grid-cols-6 gap-2">
              <span className="col-span-2">{new Date(l.ts || l.ts?.toString() || Date.now()).toLocaleString()}</span>
              <span>{l.method}</span>
              <span className="truncate">{l.path}</span>
              <span>{l.status}</span>
              <span>{l.user}</span>
            </div>)}
          </div>
        ))}
      </div>
      <div className="mt-3">
        <button onClick={analyze} className="px-3 py-1 bg-purple-500 text-white rounded">Analyze</button>
        {analysis && <div className="mt-2 text-sm p-2 border rounded bg-purple-50 whitespace-pre-line">{analysis}</div>}
      </div>
    </div>
  );
}
