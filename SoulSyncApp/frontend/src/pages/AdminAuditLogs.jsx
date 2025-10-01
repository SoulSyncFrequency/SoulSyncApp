import '../setupDevFetchPatch';
import useAdminGuard from '../hooks/useAdminGuard';
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AuditLogsPage() {
  useAdminGuard();
  const [logs, setLogs] = useState([]);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState({ userId:'', status:'', from:'', to:'' });
  const [total, setTotal] = useState(0);

  const fetchLogs = async (format=null) => {
    const params = { limit, offset, ...filters };
    try {
      if(format){
        const url = `/api/v1/admin/audit-logs?${new URLSearchParams({...params, format})}`;
        window.location = url;
        return;
      }
      const res = await axios.get('/api/v1/admin/audit-logs', { params });
      setLogs(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch(err){ console.error(err); }
  };

  useEffect(()=>{ fetchLogs(); }, [limit, offset]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Audit Logs</h1>
      <div className="mb-2 space-x-2">
        <input placeholder="UserId" value={filters.userId} onChange={e=>setFilters({...filters,userId:e.target.value})}/>
        <input placeholder="Status" value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}/>
        <input type="date" value={filters.from} onChange={e=>setFilters({...filters,from:e.target.value})}/>
        <input type="date" value={filters.to} onChange={e=>setFilters({...filters,to:e.target.value})}/>
        <button onClick={()=>{setOffset(0);fetchLogs();}} className="bg-blue-500 text-white px-2 py-1">Filter</button>
      </div>
      <table className="table-auto border w-full mb-4">
        <thead><tr>{['id','userId','endpoint','status','createdAt'].map(h=><th key={h} className="border px-2">{h}</th>)}</tr></thead>
        <tbody>
          {logs.map(log=>(
            <tr key={log.id}>
              <td className="border px-2">{log.id}</td>
              <td className="border px-2">{log.userId}</td>
              <td className="border px-2">{log.endpoint}</td>
              <td className="border px-2">{log.status}</td>
              <td className="border px-2">{new Date(log.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex space-x-2 mb-2">
        <button disabled={offset===0} onClick={()=>setOffset(Math.max(0,offset-limit))} className="bg-gray-200 px-2">Prev</button>
        <button disabled={offset+limit>=total} onClick={()=>setOffset(offset+limit)} className="bg-gray-200 px-2">Next</button>
      </div>
      <div className="space-x-2">
        <button onClick={()=>fetchLogs('csv')} className="bg-green-500 text-white px-2 py-1">Export CSV</button>
        <button onClick={()=>fetchLogs('json')} className="bg-green-500 text-white px-2 py-1">Export JSON</button>
        <button onClick={()=>fetchLogs('xlsx')} className="bg-green-500 text-white px-2 py-1">Export XLSX</button>
      </div>
    </div>
  );
}


// --- v157: Simple tabs for Logs / My Exports / Insights ---
import React, { useState, useEffect } from 'react';

function AdminTabs() {
  const badge = (text, type) => (<span style={{padding:'2px 6px',borderRadius:6,background:type==='high'?'#ffebee':type==='medium'?'#fff8e1':'#e8f5e9',border:'1px solid #ccc',marginLeft:6}}>{text}</span>);
  const [tab, setTab] = useState('logs');
  const [features, setFeatures] = useState({ASYNC_EXPORT:true, AI_INSIGHTS:true});
  const [jobs, setJobs] = useState([]);
  const [insights, setInsights] = useState(null);

  useEffect(()=>{
    fetch('/api/v1/admin/features', { headers: { 'X-Admin-Token': localStorage.getItem('adminToken') || '' } })
      .then(r=>r.json()).then(setFeatures).catch(()=>{});
  },[]);

  useEffect(()=>{
    let t;
    if(tab==='exports' && features.ASYNC_EXPORT){
      const poll=()=>{
        const list = JSON.parse(localStorage.getItem('exportJobs')||'[]');
        Promise.all(list.map(id => fetch(`/api/v1/admin/audit-logs/export-status/${id}`, { headers: { 'X-Admin-Token': localStorage.getItem('adminToken') || '' } }).then(r=>r.json()).then(s=>({id, ...s}))))          .then(setJobs).catch(()=>{});
        t=setTimeout(poll, 3000);
      };
      poll();
    }
    return ()=> t && clearTimeout(t);
  },[tab, features]);

  const requestExport = async () => {
    const body = { format:'csv' };
    const r = await fetch('/api/v1/admin/audit-logs/export-request', { method:'POST', headers:{'Content-Type':'application/json','X-Admin-Token': localStorage.getItem('adminToken') || ''}, body: JSON.stringify(body) });
    const data = await r.json();
    const list = JSON.parse(localStorage.getItem('exportJobs')||'[]'); list.push(data.jobId); localStorage.setItem('exportJobs', JSON.stringify(list));
    alert('Export job queued: ' + data.jobId);
    setTab('exports');
  };

const downloadNow = async () => {
  try{
    const q = new URLSearchParams({ format:'csv', limit:'200' });
    const r = await fetch('/api/v1/admin/audit-logs/export-signed?' + q.toString(), { headers: { 'X-Admin-Token': localStorage.getItem('adminToken') || '' } });
    const data = await r.json();
    if(data && data.url){ window.location.href = data.url; } else { alert('Failed to get signed URL'); }
  }catch(e){ alert('Download failed'); }
};

const loadInsights = async () => {
    const r = await fetch('/api/v1/admin/audit-logs/insights?limit=500', { headers: { 'X-Admin-Token': localStorage.getItem('adminToken') || '' } });
    const data = await r.json(); setInsights(data);
  };

  return (
    <div style={{marginTop: '1rem'}}>
      <div style={{display:'flex', gap:8}}>
        <button onClick={()=>setTab('logs')}>Logs</button>
        {features.ASYNC_EXPORT && <button onClick={()=>setTab('exports')}>My Exports</button>}
        {features.AI_INSIGHTS && <button onClick={()=>{setTab('insights'); loadInsights();}}>Insights</button>}
        {features.ASYNC_EXPORT && <button onClick={requestExport} style={{marginLeft:'auto'}}>Export (Async)</button>}
      </div>
      <hr/>
      {tab==='exports' && features.ASYNC_EXPORT && (
        <div>
          <h2>My Exports</h2>
          <table><thead><tr><th>Job ID</th><th>Status</th><th>Download</th></tr></thead><tbody>
            {jobs.map(j=>(<tr key={j.id}><td>{j.id}</td><td>{j.state}</td><td>{j.downloadUrl ? <a href={j.downloadUrl}>Download</a> : '-'}</td></tr>))}
          </tbody></table>
          {!jobs.length && <p>No export jobs yet.</p>}
        </div>
      )}
      {tab==='insights' && features.AI_INSIGHTS && (
        <div>
          <h2>Insights</h2>
          {insights && <p>Severity: {insights.severity} {badge(insights.costImpact||'low', (insights.costImpact||'low'))}</p>}
          {!insights ? <p>Loading...</p> : (
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
              <div>
                <h3>Top Endpoints</h3>
                <ul>{(insights.topEndpoints||[]).sort((a,b)=>b[1]-a[1]).map(([ep,c])=> <li key={ep}><strong>{ep}</strong> — {c}</li>)}</ul>
              </div>
              <div>
                <h3>Status Codes</h3>
                <ul>{(insights.topStatuses||[]).map(([s,c])=> <li key={s}><strong>{s}</strong> — {c}</li>)}</ul>
              </div>
              <div>
                <h3>Top Users</h3>
                <ul>{(insights.topUsers||[]).map(([u,c])=> <li key={u}><strong>{u}</strong> — {c}</li>)}</ul>
              </div>
              <div>
                <h3>Suggestions</h3>
                <ul>{(insights.suggestions||[]).map((t,i)=> <li key={i}>{t}</li>)}</ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Try render AdminTabs if React is present
try{ /* noop, component is exported below if file supports it */ }catch(_e){}

