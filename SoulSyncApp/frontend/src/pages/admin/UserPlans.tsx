import React, { useEffect, useState } from 'react';

export default function UserPlans() {
  const [plans,setPlans] = useState<any[]>([]);
  const [search,setSearch] = useState('');
  const [sortKey,setSortKey] = useState<'userId'|'sessionId'|'createdAt'>('createdAt');
  const [sortDir,setSortDir] = useState<'asc'|'desc'>('desc');
  const deletePlan = async(id:number)=>{
    if(!confirm('Delete this plan?')) return;
    await fetch(`/admin/user-plans/${id}`,{method:'DELETE'});
    load();
  };
  const [diffData,setDiffData] = useState<{a:any,b:any}|null>(null);
const [showDiff,setShowDiff] = useState(false);
const revert = async(id:number)=>{
  const r = await fetch(`/admin/user-plans/${id}/revert`,{method:'POST'});
  const d = await r.json(); if(!d.ok) return alert(d.error||'Failed'); load();
};
const diffPrev = async(p:any)=>{
  // find previous
  const prev = [...plans].filter(x=>x.userId===p.userId && new Date(x.createdAt)<new Date(p.createdAt)).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())[0];
  if(!prev) return alert('No previous plan');
  setDiffData({a: p.plan, b: prev.plan}); setShowDiff(true);
};

  const [showCompactDiff,setShowCompactDiff] = useState(false);
function getByPath(obj:any, path:string){
  return path.split('.').reduce((o,k)=> (o!==undefined && o!==null)? o[k] : undefined, obj);
}
async function copyToClipboard(text:string){ try { await navigator.clipboard.writeText(text) } catch {} }
      function pretty(v:any){
  try{
    if(typeof v==='string') return v;
    return JSON.stringify(v);
  }catch{ return String(v); }
}

const [compactDiff,setCompactDiff]
  const downloadDiffCsv = ()=>{
  if(!compactDiff) return;
  const rows:string[] = [];
  rows.push('type,path,old,new');
  // added (value is from current plan if available)
  for(const k of (compactDiff.added||[])){
    const v = getByPath(diffCurPlan, k);
    const val = (v===undefined||v===null)? '' : String(pretty(v)).replaceAll('"','""');
    rows.push(`added,"${k.replaceAll('"','""')}",,"${val}"`);
  }
  // removed (value from previous plan)
  for(const k of (compactDiff.removed||[])){
    const v = getByPath(diffPrevPlan, k);
    const val = (v===undefined||v===null)? '' : String(pretty(v)).replaceAll('"','""');
    rows.push(`removed,"${k.replaceAll('"','""')}","${val}",`);
  }
  // changed
  for(const k of (compactDiff.changed||[])){
    const oldV = getByPath(diffPrevPlan, k);
    const newV = getByPath(diffCurPlan, k);
    const oldS = (oldV===undefined||oldV===null)? '' : String(pretty(oldV)).replaceAll('"','""');
    const newS = (newV===undefined||newV===null)? '' : String(pretty(newV)).replaceAll('"','""');
    rows.push(`changed,"${k.replaceAll('"','""')}","${oldS}","${newS}"`);
  }
  const csv = rows.join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='plan-compact-diff.csv'; a.click(); URL.revokeObjectURL(url);
};

  const copyChangedPaths = async()=>{
  if(!compactDiff) return;
  await copyToClipboard((compactDiff.changed||[]).join('\n'));
  alert('Changed paths copied');
};
const [concise,setConcise] = useState(true);
  const [showAdded,setShowAdded] = useState(true);
const [showRemoved,setShowRemoved] = useState(true);
const [showChanged,setShowChanged] = useState(true);
const expandAll = ()=>{ setShowAdded(true); setShowRemoved(true); setShowChanged(true); };
const collapseAll = ()=>{ setShowAdded(false); setShowRemoved(false); setShowChanged(false); };

  const [diffFilter,setDiffFilter] = useState('');
  const filteredAdded = (compactDiff?.added||[]).filter(k=>!diffFilter || k.includes(diffFilter));
const filteredRemoved = (compactDiff?.removed||[]).filter(k=>!diffFilter || k.includes(diffFilter));
const filteredChanged = (compactDiff?.changed||[]).filter(k=>!diffFilter || k.includes(diffFilter));

const copyAdded = async()=>{
  if(!compactDiff) return;
  const items = (compactDiff.added||[]).join('\n'); 
  await copyToClipboard(items); 
  alert('Added paths copied');
};
const copyRemoved = async()=>{
  if(!compactDiff) return;
  const items = (compactDiff.removed||[]).join('\n'); 
  await copyToClipboard(items); 
  alert('Removed paths copied');
};

function prettyShort(v:any){
  const s = pretty(v);
  return (concise && s && s.length>120) ? (s.slice(0,120)+' …') : s;
}

  const buildFullDiffPayload = ()=>{
  const detailed = (compactDiff?.changed||[]).map(k=>({ path:k, old: getByPath(diffPrevPlan,k), new: getByPath(diffCurPlan,k) }));
  return { added: compactDiff?.added||[], removed: compactDiff?.removed||[], changed: detailed };
};
const copyAllChanges = async()=>{
  const payload = buildFullDiffPayload();
  await copyToClipboard(JSON.stringify(payload, null, 2));
  alert('All changes copied to clipboard');
};
const downloadDiffJson = ()=>{
  const payload = buildFullDiffPayload();
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='plan-compact-diff.json'; a.click(); URL.revokeObjectURL(url);
};
 = useState<{added:string[],removed:string[],changed:string[]}|null>(null);
  const [diffPrevPlan,setDiffPrevPlan] = useState<any>({});
  const [diffCurPlan,setDiffCurPlan] = useState<any>({});

function flatKeys(obj:any, prefix:string=''){ 
  let out:string[]=[]; 
  if(obj && typeof obj==='object'){ 
    for(const k of Object.keys(obj)){ 
      const key = prefix? prefix+'.'+k : k; 
      out.push(...flatKeys(obj[k], key)); 
    } 
  } else { 
    out.push(prefix); 
  } 
  return out; 
}

function compactDiffCalc(a:any,b:any){
  // flatten to leaf paths
  const A = new Set(flatKeys(a));
  const B = new Set(flatKeys(b));
  const added = [...B].filter(k=>!A.has(k));
  const removed = [...A].filter(k=>!B.has(k));
  const common = [...A].filter(k=>B.has(k));
  const get = (obj:any, path:string)=> path.split('.').reduce((o,k)=> (o? o[k] : undefined), obj);
  const changed = common.filter(k=>JSON.stringify(get(a,k)) !== JSON.stringify(get(b,k)));
  return { added, removed, changed };
}

const openCompactDiff = (p:any)=>{
  const prev = [...plans].filter(x=>x.userId===p.userId && new Date(x.createdAt)<new Date(p.createdAt)).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())[0];
  if(!prev){ alert('No previous plan'); return; }
  setCompactDiff(compactDiffCalc(prev.plan, p.plan)); setDiffPrevPlan(prev.plan); setDiffCurPlan(p.plan); setSelected(p);
  setShowCompactDiff(true);
};

  const [selected,setSelected] = useState<any|null>(null);
  const [showPlan,setShowPlan] = useState(false);
  const load = async()=>{
    const r = await fetch('/admin/user-plans');
    const d = await r.json(); setPlans(d);
  };
  const activate = async(id:number)=>{
    await fetch(`/admin/user-plans/${id}/activate`,{method:'POST'});
    load();
  };
  useEffect(()=>{ load(); },[]);

  const toggleSort = (key:'userId'|'sessionId'|'createdAt')=>{
    if(sortKey===key) setSortDir(sortDir==='asc'?'desc':'asc');
    else {setSortKey(key);setSortDir('asc');}
  };

  return (
    <div className="p-4">
      <h2 className="font-bold mb-2">User Plans</h2>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder='Search by userId or sessionId' className='border p-1 mb-2 text-sm'/>
      <table className="w-full text-sm border">
        <thead><tr className="bg-gray-100 text-left">
          <th className="p-1 border cursor-pointer" onClick={()=>toggleSort('userId')}>User</th>
          <th className="p-1 border cursor-pointer" onClick={()=>toggleSort('sessionId')}>Session</th>
          <th className="p-1 border">Active</th>
          <th className="p-1 border cursor-pointer" onClick={()=>toggleSort('createdAt')}>Created</th>
          <th className="p-1 border"></th>
        </tr></thead>
        <tbody>
          {[...plans]
            .sort((a,b)=>{
              const va = sortKey==='createdAt'?new Date(a.createdAt).getTime():a[sortKey];
              const vb = sortKey==='createdAt'?new Date(b.createdAt).getTime():b[sortKey];
              return sortDir==='asc'?va-vb:vb-va;
            })
            .filter(p=>!search || p.userId.toString().includes(search) || p.sessionId.toString().includes(search))
            .map((p:any)=>(
            <tr key={p.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={()=>{setSelected(p);setShowPlan(true);}}>
              <td className="p-1 border">{p.userId}</td>
              <td className="p-1 border">{p.sessionId}</td>
              <td className="p-1 border">{p.active?'✅':'❌'}</td>
              <td className="p-1 border">{new Date(p.createdAt).toLocaleString()}</td><td className="p-1 border">{p.active ? `<span class=\"px-2 py-0.5 text-xs rounded bg-green-100 border border-green-300 text-green-700\">Active v${p.version||1}</span>` : `<span class=\"px-2 py-0.5 text-xs rounded bg-gray-100 border border-gray-300 text-gray-700\">v${p.version||1}</span>`}</td><td className="p-1 border">{p.version||1}</td>
              <td className="p-1 border">
                {!p.active && (
                  <button onClick={()=>activate(p.id)} className="px-2 py-1 border rounded text-xs mr-1">Activate</button>
                  <button onClick={()=>deletePlan(p.id)} className="px-2 py-1 border rounded text-xs text-red-600">Delete</button>
                  <button onClick={(e)=>{e.stopPropagation(); const blob=new Blob([JSON.stringify(p.plan,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`user-${p.userId}-plan-${p.id}.json`; a.click(); URL.revokeObjectURL(url);}} className="ml-1 px-2 py-1 border rounded text-xs">Export</button>
                  <button onClick={(e)=>{e.stopPropagation(); const html=`<html><head><title>Plan ${p.id}</title><style>body{font-family:system-ui,Segoe UI,Arial; padding:16px} pre{white-space:pre-wrap; word-break:break-word; font-size:12px; background:#f9fafb; padding:12px; border:1px solid #e5e7eb; border-radius:8px}</style></head><body><h1>Plan #${p.id} — User ${p.userId}</h1><pre>${JSON.stringify(p.plan,null,2).replace(/</g,'&lt;')}</pre><script>window.onload=()=>{window.print();}</script></body></html>`; const blob=new Blob([html],{type:'text/html'}); const url=URL.createObjectURL(blob); window.open(url,'_blank'); }} className="ml-1 px-2 py-1 border rounded text-xs">Export PDF</button>
                  <button onClick={(e)=>{e.stopPropagation(); diffPrev(p);}} className="ml-1 px-2 py-1 border rounded text-xs">Diff prev</button>
                  <button onClick={(e)=>{e.stopPropagation(); openCompactDiff(p);}} className="ml-1 px-2 py-1 border rounded text-xs">Diff (compact)</button>
                  <button onClick={(e)=>{e.stopPropagation(); revert(p.id);}} className="ml-1 px-2 py-1 border rounded text-xs">Revert</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    {showPlan && selected && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-4 rounded shadow max-w-[90vw] max-h-[80vh] overflow-auto">
      <h3 className="font-bold mb-2">Plan #{selected.id} — User {selected.userId}</h3>
      <button onClick={()=>setShowPlan(false)} className="mb-2 px-2 py-1 border rounded">Close</button>
      <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded border">{JSON.stringify(selected.plan,null,2)}</pre>
    </div>
  </div>
)}

    </div>
  );
}
