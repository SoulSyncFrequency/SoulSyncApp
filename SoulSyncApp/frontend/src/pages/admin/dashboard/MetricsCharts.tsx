import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function MetricsCharts() {
  const [metrics,setMetrics] = useState<any[]>([]);

  useEffect(()=>{
    const poll = ()=>{
      fetch('/metrics').then(r=>r.text()).then(txt=>{
        const lines = txt.split('\n');
        const req = Number(lines.find(l=>l.startsWith('app_requests_total'))?.split(' ')[1]||0);
        const heap = Number(lines.find(l=>l.startsWith('app_heap_used_bytes'))?.split(' ')[1]||0)/1024/1024;
        const uptime = Number(lines.find(l=>l.startsWith('app_uptime_seconds'))?.split(' ')[1]||0);
        setMetrics(m=>[...m.slice(-19),{time:new Date().toLocaleTimeString(),req,heap,uptime}]);
      });
    };
    poll();
    const intv=setInterval(poll,10000);
    return ()=>clearInterval(intv);
  },[]);

  return (
    <div className="border rounded p-4">
      <h2 className="font-bold mb-2">Metrics</h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={metrics}>
          <XAxis dataKey="time" hide/>
          <YAxis/>
          <Tooltip/>
          <Line type="monotone" dataKey="req" stroke="#8884d8" name="Requests" />
          <Line type="monotone" dataKey="heap" stroke="#82ca9d" name="Heap MB" />
          <Line type="monotone" dataKey="uptime" stroke="#ff7300" name="Uptime s" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
