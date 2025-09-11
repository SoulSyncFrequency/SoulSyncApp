import React, { useEffect, useState } from "react";
import { me } from "../api";
export default function Dashboard({ token }) {
  const [profile, setProfile] = useState(null);
  useEffect(()=>{ (async()=>{ try{ const data = await me(); setProfile(data);} catch(e){ console.error("Failed to load profile", e);} })(); },[]);
  return (<div style={{maxWidth:600, margin:"0 auto"}}>
    <h2>📊 Dashboard</h2>
    {profile ? (<div>
      <p><b>ID:</b> {profile.id}</p>
      <p><b>Name:</b> {profile.name}</p>
      <p><b>Email:</b> {profile.email}</p>
      <p><b>Created:</b> {new Date(profile.created_at).toLocaleString()}</p>
    </div>) : <p>Loading profile...</p>}
  </div>);
}
