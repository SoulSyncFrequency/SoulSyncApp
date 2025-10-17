import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusCard from './StatusCard';
import MetricsCharts from './MetricsCharts';
import BackupRestore from './BackupRestore';
import ServerControls from './ServerControls';
import AuditLogs from './AuditLogs';
import ReportsView from './ReportsView';
import UserPlans from '../../UserPlans';
import Executor from '../../Executor';
import TherapyModules from '../../TherapyModules';
import Invites from '../../Invites';
import RateLimits from '../../RateLimits';
import Users from '../../Users';

const sections = [
      { id:'userplans', label:'User Plans', component: UserPlans },
      { id:'executor', label:'Therapy Executor', component: Executor },
      { id:'modules', label:'Therapy Modules', component: TherapyModules },
      { id:'invites', label:'Invites', component: Invites },
      { id:'ratelimits', label:'Rate Limits', component: RateLimits },
      { id:'users', label:'Users', component: Users },
  { id: 'status', label: 'Status', component: StatusCard },
  { id: 'metrics', label: 'Metrics', component: MetricsCharts },
  { id: 'backup', label: 'Backup & Restore', component: BackupRestore },
  { id: 'server', label: 'Server Controls', component: ServerControls },
  { id: 'logs', label: 'Logs & AI Audit', component: AuditLogs },
  { id: 'reports', label: 'Reports', component: ReportsView }
];

export default function AdminDashboard() {
  const nav = useNavigate();
  useEffect(()=>{(async()=>{try{const r=await fetch('/auth/me');const d=await r.json();if(!d.user||d.user.role!=='ADMIN'){nav('/admin/login');}else{(window as any).currentUser=d.user;}}catch{nav('/admin/login')}})()},[]);
  const handleLogout = async ()=>{
  await fetch('/admin/logout',{method:'POST'});
  localStorage.removeItem('admin');
  nav('/admin/login');
};
const [active, setActive] = useState('status');
  const ActiveComponent = sections.find(s=>s.id===active)?.component || StatusCard;

  if ((window as any).currentUser?.role !== 'ADMIN')
    return <p className="p-6 text-red-500">Access denied</p>;

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-gray-100 border-r p-4">
        <h1 className="text-xl font-bold mb-4">Admin</h1>
        <nav className="space-y-2">
          {sections.map(s=>(
            <button key={s.id} onClick={()=>setActive(s.id)} className={`block w-full text-left px-2 py-1 rounded ${active===s.id?'bg-blue-500 text-white':'hover:bg-gray-200'}`}>
              {s.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <ActiveComponent />
      </main>
    </div>
  );
}
