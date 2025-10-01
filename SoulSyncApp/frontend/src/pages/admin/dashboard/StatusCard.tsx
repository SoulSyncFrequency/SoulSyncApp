import React, { useEffect, useState } from 'react';

interface Data {
  status: string; uptime: number; timestamp: number;
  version: string; commit: string; buildTime: string;
  memory: { rss:number; heapUsed:number; heapTotal:number };
  platform: string; node: string;
}

export default function StatusCard() {
  const [data,setData] = useState<Data|null>(null);

  useEffect(()=>{ fetch('/admin/diagnostics').then(r=>r.json()).then(setData); },[]);

  if(!data) return <p>Loading...</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border rounded p-4">
        <h2 className="font-bold mb-2">Status</h2>
        <p>{data.status}</p>
        <p className="text-sm text-gray-500">{new Date(data.timestamp).toLocaleString()}</p>
      </div>
      <div className="border rounded p-4">
        <h2 className="font-bold mb-2">Uptime</h2>
        <p>{(data.uptime/3600).toFixed(2)} h</p>
      </div>
      <div className="border rounded p-4">
        <h2 className="font-bold mb-2">Memory</h2>
        <p>RSS: {(data.memory.rss/1024/1024).toFixed(1)} MB</p>
        <p>Heap Used: {(data.memory.heapUsed/1024/1024).toFixed(1)} MB</p>
      </div>
      <div className="border rounded p-4">
        <h2 className="font-bold mb-2">Environment</h2>
        <p>{data.platform}</p>
        <p>{data.node}</p>
      </div>
      <div className="border rounded p-4 md:col-span-2">
        <h2 className="font-bold mb-2">Version</h2>
        <p>v{data.version} • {data.commit}</p>
        <p>Build: {data.buildTime}</p>
      </div>
    </div>
  );
}
