import React, { useState } from 'react';

export default function Executor() {
  const [userId, setUserId] = useState('');
  const [inputJson, setInputJson] = useState('{"emotion":"fear"}');
  const [out, setOut] = useState<any>(null);
  const run = async ()=>{
    let input:any={};
    try { input = JSON.parse(inputJson||'{}'); } catch { return alert('Invalid JSON'); }
    const r = await fetch('/executor/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:Number(userId), input})});
    const d = await r.json(); setOut(d);
  };
  return (
    <div className="border rounded p-4">
      <h2 className="font-bold mb-2">Therapy Executor</h2>
      <div className="flex gap-2 mb-3">
        <input placeholder="userId" value={userId} onChange={e=>setUserId(e.target.value)} className="border p-1 text-sm w-32"/>
        <input placeholder='Input JSON' value={inputJson} onChange={e=>setInputJson(e.target.value)} className="border p-1 text-sm flex-1"/>
        <button onClick={run} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Run</button>
      </div>
      {out && (
        <div className="text-xs bg-gray-50 p-2 rounded border">
          <div className="mb-2">Session: <b>{out.sessionId}</b> — {out.summary?.success} success, {out.summary?.failed} failed, {out.summary?.skipped} skipped</div>
          <pre className="whitespace-pre-wrap">{JSON.stringify(out.modules,null,2)}</pre>
        </div>
      )}
    </div>
  );
}
