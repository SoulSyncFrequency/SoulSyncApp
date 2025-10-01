import React, { useEffect, useState } from 'react';

export default function RateLimits() {
  const [stats,setStats] = useState<any[]>([]);
  useEffect(()=>{ fetch('/admin/rate-limits').then(r=>r.json()).then(setStats); },[]);
  return (
    <div className="border rounded p-4">
      <h2 className="font-bold mb-2">Rate Limits</h2>
      <table className="w-full text-sm">
        <thead><tr className="text-left"><th>Key</th><th>Count</th><th>Reset</th></tr></thead>
        <tbody>
          {stats.map((s,i)=>(
            <tr key={i} className="border-t">
              <td>{s.key}</td>
              <td>{s.count}</td>
              <td>{new Date(s.reset).toLocaleTimeString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
