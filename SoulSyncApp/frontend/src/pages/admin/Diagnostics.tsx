import React,
  { useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'; { useEffect, useState } from 'react';

interface DiagnosticsData {
  status: string;
  uptime: number;
  timestamp: number;
  version: string;
  commit: string;
  buildTime: string;
  memory: { rss: number; heapUsed: number; heapTotal: number };
  platform: string;
  node: string;
}

export default function Diagnostics() {
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const handleRestart = async () => {
  if (!confirm('Are you sure you want to restart the server?')) return;
  await fetch('/admin/restart', { method: 'POST' });
  alert('Restart requested. The server will restart shortly.');
};

  const [logs, setLogs] = useState<string[]>([]);
const [analysis, setAnalysis] = useState<string>('');
const handleBackup = async () => {
  const res = await fetch('/admin/backup', { method: 'POST' });
  const data = await res.json();
  alert('Backup created: ' + data.url);
  window.open(data.url,'_blank');
};
const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files?.[0]) return;
  const form = new FormData();
  form.append('file', e.target.files[0]);
  await fetch('/admin/restore', { method: 'POST', body: form });
  alert('Restore complete. Server restarting...');
};
const loadLogs = async () => {
  const r = await fetch('/admin/logs');
  const d = await r.json();
  setLogs(d.logs);
};
const analyzeLogs = async () => {
  const r = await fetch('/admin/logs/analyze',{method:'POST'});
  const d = await r.json();
  setAnalysis(d.summary || d.error);
};

  useEffect(() => {
    fetch('/admin/diagnostics')
      .then(res => res.json())
      .then(setData)
      .catch(() => {});
    try {
      const user = (window as any).currentUser;
      if (user?.role) setRole(user.role);
    } catch {}
  const poll = () => {
  fetch('/metrics')
    .then(r=>r.text())
    .then(txt => {
      const lines = txt.split('\n');
      const req = Number(lines.find(l=>l.startsWith('app_requests_total'))?.split(' ')[1] || 0);
      const heap = Number(lines.find(l=>l.startsWith('app_heap_used_bytes'))?.split(' ')[1] || 0)/1024/1024;
      const uptime = Number(lines.find(l=>l.startsWith('app_uptime_seconds'))?.split(' ')[1] || 0);
      setMetricsHistory(h => [...h.slice(-19), { time: new Date().toLocaleTimeString(), req, heap, uptime }]);
    });
};
poll();
const intv = setInterval(poll, 10000);
return () => clearInterval(intv);

  }, []);

  if (role !== 'ADMIN') return <p className="p-6 text-red-500">Access denied</p>;
  if (!data) return <p className="p-6">Loading...</p>;

  const uptimeHrs = (data.uptime/3600).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Diagnostics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <h2 className="font-bold mb-2">Status</h2>
          <p>{data.status}</p>
          <p className="text-sm text-gray-500">{new Date(data.timestamp).toLocaleString()}</p>
        </div>
        <div className="border rounded p-4">
          <h2 className="font-bold mb-2">Uptime</h2>
          <p>{uptimeHrs} h</p>
        </div>
        <div className="border rounded p-4">
          <h2 className="font-bold mb-2">Memory</h2>
          <p>RSS: {(data.memory.rss/1024/1024).toFixed(1)} MB</p>
          <p>Heap Used: {(data.memory.heapUsed/1024/1024).toFixed(1)} MB</p>
          <p>Heap Total: {(data.memory.heapTotal/1024/1024).toFixed(1)} MB</p>
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
    </div>
  );
}
