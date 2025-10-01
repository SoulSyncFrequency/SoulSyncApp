import React, { useEffect, useState } from 'react';

export default function AuditLog(){
  const [logs,setLogs] = useState<any[]>([]);
  const [filtered,setFiltered] = useState<any[]>([]);
  const [events,setEvents] = useState<string[]>([]);
  const [filter,setFilter] = useState({event:'',actorId:'',targetType:'',targetId:'',from:'',to:''});
  const [diffData,setDiffData] = useState<any|null>(null);
  const [showDiff,setShowDiff] = useState(false);

  useEffect(()=>{
    fetch('/admin/audit').then(r=>r.json()).then((d)=>{
      setLogs(d);
      setEvents([...new Set(d.map((x:any)=>x.event))]);
      setFiltered(d);
    }).catch(()=>{});
  },[]);

  useEffect(()=>{
    const from = filter.from? new Date(filter.from).getTime() : 0;
    const to = filter.to? new Date(filter.to).getTime() : Infinity;
    const f = logs.filter(l=>
      (!filter.event || l.event===filter.event) &&
      (!filter.actorId || String(l.actorId).includes(filter.actorId)) &&
      (!filter.targetType || l.targetType===filter.targetType) &&
      (!filter.targetId || String(l.targetId).includes(filter.targetId)) &&
      (!filter.from || new Date(l.createdAt).getTime()>=from) &&
      (!filter.to || new Date(l.createdAt).getTime()<=to)
    );
    setFiltered(f);
  },[filter,logs]);

  const groupBySession = ()=>{
    const groups:any[] = [];
    const sorted = [...filtered].sort((a,b)=>new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime());
    let current:any=null;
    for(const l of sorted){
      if(!current || current.actorId!==l.actorId || (new Date(l.createdAt).getTime()-new Date(current.end).getTime())>15*60*1000){
        current = {actorId:l.actorId, start:l.createdAt, end:l.createdAt, logs:[l]};
        groups.push(current);
      } else {
        current.logs.push(l);
        current.end = l.createdAt;
      }
    }
    return groups;
  };

  const downloadCSV = ()=>{
    const rows = ['timestamp,event,actorId,targetType,targetId'];
    for(const l of filtered){
      rows.push(`${l.createdAt},${l.event},${l.actorId||''},${l.targetType||''},${l.targetId||''}`);
    }
    const blob = new Blob([rows.join('\n')],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='auditlog.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const groups = groupBySession();

  return (
    <div className='p-4'>
      <h2 className='font-bold text-lg mb-2'>Audit Log</h2>
      <div className='flex flex-wrap gap-2 text-xs mb-4'>
        <select value={filter.event} onChange={e=>setFilter({...filter,event:e.target.value})} className='border p-1'>
          <option value=''>All events</option>
          {events.map(ev=><option key={ev}>{ev}</option>)}
        </select>
        <input placeholder='Actor ID' value={filter.actorId} onChange={e=>setFilter({...filter,actorId:e.target.value})} className='border p-1 w-24'/>
        <input placeholder='Target type' value={filter.targetType} onChange={e=>setFilter({...filter,targetType:e.target.value})} className='border p-1 w-28'/>
        <input placeholder='Target ID' value={filter.targetId} onChange={e=>setFilter({...filter,targetId:e.target.value})} className='border p-1 w-24'/>
        <input type='date' value={filter.from} onChange={e=>setFilter({...filter,from:e.target.value})} className='border p-1'/>
        <input type='date' value={filter.to} onChange={e=>setFilter({...filter,to:e.target.value})} className='border p-1'/>
        <button onClick={downloadCSV} className='px-2 py-1 border rounded'>Export CSV</button>
      </div>

      <div className='space-y-4'>
        {groups.map((g,i)=>(
          <div key={i} className='border rounded p-2 bg-gray-50'>
            <div className='font-semibold mb-1 text-sm'>Session: actor #{g.actorId} ({new Date(g.start).toLocaleString()} → {new Date(g.end).toLocaleTimeString()})</div>
            <table className='w-full text-xs border'>
              <thead><tr className='bg-gray-100'>
                <th className='border p-1'>Time</th>
                <th className='border p-1'>Event</th>
                <th className='border p-1'>Target</th>
                <th className='border p-1'>Actions</th>
              </tr></thead>
              <tbody>
                {g.logs.map((l:any)=>(
                  <tr key={l.id} className='border-t'>
                    <td className='border p-1'>{new Date(l.createdAt).toLocaleTimeString()}</td>
                    <td className='border p-1'>{l.event}</td>
                    <td className='border p-1'>{l.targetType} #{l.targetId}</td>
                    <td className='border p-1'>
                      {l.data?.diff && <button onClick={()=>{setDiffData(l.data.diff);setShowDiff(true);}} className='px-2 py-0.5 border rounded'>View diff</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {showDiff && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
          <div className='bg-white p-4 rounded shadow max-w-[90vw] max-h-[85vh] overflow-auto text-xs'>
            <h3 className='font-bold mb-2'>Diff</h3>
            <button onClick={()=>setShowDiff(false)} className='mb-2 px-2 py-1 border rounded'>Close</button>
            <pre className='whitespace-pre-wrap break-all bg-gray-50 border p-2 rounded'>{JSON.stringify(diffData,null,2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
