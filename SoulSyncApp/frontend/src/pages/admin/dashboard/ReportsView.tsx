import React, { useEffect, useState } from 'react';

export default function ReportsView() {
  const [reports,setReports]=useState<string[]>([]);
  useEffect(()=>{
    fetch('/admin/logs').then(r=>r.json()).then(d=>{
      const lines = d.logs||[];
      const daily = lines.filter((l:string)=>l.includes('[SoulSync Daily Health Report]')).slice(-5);
      setReports(daily);
    });
  },[]);

  return (
    <div className="border rounded p-4">
      <h2 className="font-bold mb-2">Daily Reports</h2>
      <div className="text-sm space-y-2">
        {reports.map((r,i)=>(<div key={i} className="p-2 border rounded bg-gray-50 whitespace-pre-line">{r}</div>))}
      </div>
    </div>
  );
}
