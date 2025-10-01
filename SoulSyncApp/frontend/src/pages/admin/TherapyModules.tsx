import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import React, { useEffect, useState } from 'react';

export default function TherapyModules() {
  const [mods,setMods]=useState<any[]>([]);
  const [name,setName]=useState('');
  const [version,setVersion]=useState('');
  const [description,setDescription]=useState('');

  const configure = async(id:number)=>{
  const ep = prompt('Endpoint (e.g. /engine/f0-validator)');
  const cfg = prompt('Config JSON (e.g. {"smiles":true,"f0":true})');
  const fl = prompt('Files (comma separated)');
  if(!ep && !cfg && !fl) return;
  try{
    const body:any={};
    if(ep) body.endpoint=ep;
    if(cfg) body.config=JSON.parse(cfg);
    if(fl) body.files=fl.split(',').map(f=>f.trim());
    await fetch(`/admin/modules/${id}/link`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    load();
  }catch(e){ alert('Invalid JSON'); }
};

  const runModule = async(id:number)=>{
  const r = const extra=prompt('Custom input JSON (optional)');
        let body:any={};
        if(extra){try{body.extraInput=JSON.parse(extra);}catch(e){alert('Invalid JSON');return;}}
        await fetch(`/admin/modules/${id}/run`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const d = await r.json();
  alert('Status: '+d.status+'\n'+JSON.stringify(d.response||d.error));
};
const viewLogs = async(id:number)=>{
  const r = await fetch(`/admin/modules/${id}/logs`);
  const d = await r.json();
  alert(d.map((l:any)=>l.status+' @ '+new Date(l.createdAt).toLocaleString()).join('\n'));
};

  const [filterStatus,setFilterStatus] = useState('');
const [filterSince,setFilterSince] = useState('');
const loadLogs = async(id:number)=>{
  const qs = new URLSearchParams();
  if(filterStatus) qs.set('status',filterStatus);
  if(filterSince) qs.set('since',filterSince);
  const r = await fetch(`/admin/modules/${id}/logs?`+qs.toString());
  const d = await r.json(); setLogs(d); setShowLogs(true);
};
const exportLogs = (id:number,fmt:string)=>{
  const qs = new URLSearchParams();
  if(filterStatus) qs.set('status',filterStatus);
  if(filterSince) qs.set('since',filterSince);
  qs.set('format',fmt);
  window.open(`/admin/modules/${id}/logs/export?`+qs.toString(),'_blank');
};

  const [stats,setStats] = useState<any[]>([]);
const [days,setDays] = useState(30);
const loadStats = async(id:number)=>{
  const r = await fetch(`/admin/modules/${id}/logs/stats?days=${days}`);
  const d = await r.json(); setStats(d);
};

  const [logs,setLogs] = useState<any[]>([]);
const [showLogs,setShowLogs] = useState(false);
const loadLogs = async(id:number)=>{
  const r = await fetch(`/admin/modules/${id}/logs`);
  const d = await r.json(); setLogs(d); setShowLogs(true);
};

  const load=()=>fetch('/admin/modules').then(r=>r.json()).then(setMods);
  useEffect(load,[]);

  const add=async()=>{
    await fetch('/admin/modules',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,version,description})});
    setName('');setVersion('');setDescription('');load();
  };
  const toggle=async(id:number)=>{await fetch(`/admin/modules/${id}/toggle`,{method:'POST'});load();};
  const update=async(id:number)=>{
    const n=prompt('New name'); const v=prompt('New version'); const d=prompt('New description');
    if(!n||!v) return;
    await fetch(`/admin/modules/${id}/update`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n,version:v,description:d})});
    load();
  };

  return (
    <div className="border rounded p-4">
      <h2 className="font-bold mb-2">Therapy Modules</h2>
      <label className='text-xs flex items-center gap-1 mb-2'><input type='checkbox' checked={onlyAuto} onChange={e=>setOnlyAuto(e.target.checked)} /> Show only auto-disabled</label>
      { (health.disabledModules>0 || health.failingModules>0) && (
        <div className="mb-2 p-2 bg-yellow-100 border border-yellow-300 text-xs rounded">
          <b>Health Summary:</b> disabled modules: {health.disabledModules||0}, failing(≥5): {health.failingModules||0}
        </div>
      )}
    
      <div className="flex gap-2 mb-3">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="border p-1 text-sm"/>
        <input value={version} onChange={e=>setVersion(e.target.value)} placeholder="Version" className="border p-1 text-sm"/>
        <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" className="border p-1 text-sm"/>
        <button onClick={add} className="px-3 py-1 bg-blue-500 text-white rounded text-sm">Add</button>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left"><th>ID</th><th>Name</th><th>Version</th><th>Description</th><th>Active</th><th>Actions</th></tr></thead>
        <tbody>
          {mods.map(m=>(
            <tr key={m.id} className="border-t">
              <td>{m.id}</td><td>{m.name}</td><td>{m.version}</td><td>{m.description}</td>
              <td>{m.active? 'yes':'no'}</td>
              <td className="space-x-2">
                <button onClick={()=>runModule(m.id)} disabled={!m.endpoint} className='underline text-green-600'>Run</button>
                <button onClick={()=>loadLogs(m.id)} className='underline text-gray-600'>View Logs</button>
                <button onClick={()=>configure(m.id)} className='underline text-purple-600'>Configure</button>
                <button onClick={()=>toggle(m.id)} className="underline">Toggle</button>
                <button onClick={()=>fetch(`/api/admin/modules/${m.id}/reset-failcount`,{method:'POST'}).then(()=>alert('Fail counter reset'))} className='underline text-orange-600'>Reset fail counter</button>
                <button onClick={()=>update(m.id)} className="underline text-blue-600">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
