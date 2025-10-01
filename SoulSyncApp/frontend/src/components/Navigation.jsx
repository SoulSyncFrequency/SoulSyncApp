import { useNotificationsState } from '../state/notificationsState'
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { clearToken } from "../api";

export default function Navigation({ onLogout }) {
  const [watchdogFail,setWatchdogFail]=useState(false)
  useEffect(()=>{ (async()=>{ try{ const j = await fetch('/api/admin/watchdog-status').then(r=>r.json()); const arr=j.items||[]; setWatchdogFail(arr.some((m:any)=> (m.consecutiveFails||0)>0)) }catch{} })() },[])
  const unread = useNotificationsState(s=>s.unread)
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    if (onLogout) onLogout();
    navigate("/");
  }

  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.75rem 1.5rem",
      backgroundColor: "#f5f5f5",
      borderBottom: "1px solid #ddd",
      marginBottom: "1rem"
    }}>
      <div>
        <Link to="/dashboard" style={{ marginRight: "1rem" }}>🏠 Dashboard</Link>
        <Link to="/settings">⚙️ Settings</Link>
              <Link to="/legal" style={{ marginLeft:'1rem' }}>⚖️ Legal</Link>
        <Link to="/sdk" style={{ marginLeft:'1rem' }}>🧩 SDK</Link>
      </div>
        <Link to="/admin/dashboard" style={{ marginLeft: '1rem' }}>📊 Admin Dashboard</Link>
        <Link to="/admin/webhooks" style={{ marginLeft: '1rem' }}>🌐 Webhooks</Link>
        <Link to="/admin/logs" style={{ marginLeft: '1rem' }}>📑 Logs</Link>
        <Link to="/admin/docs/alerting" style={{ marginLeft: '1rem' }}>📖 Docs</Link>
        <a href="/api/admin/logfiles/current" style={{ marginLeft:'1rem' }}>⬇️ Logs</a>
        <Link to="/admin/slo-config" style={{ marginLeft:'1rem' }}>🧭 SLO</Link>
        <Link to="/admin/notifications" style={{ marginLeft: '1rem' }}>🔔 Notifications{unread>0?` (${unread})`:''}</Link>
      <button onClick={handleLogout} style={{ padding: "0.4rem 1rem" }}>
        🚪 Logout
      </button>
      <a href="/profile" className="text-sm text-gray-700 hover:underline">👤 Profile</a>
</nav>
  );
}
