import React, { useState } from "react";
import { login } from "../api";
export default function LoginForm({ onLogin }) {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(null); const [loading,setLoading]=useState(false);
  async function handleSubmit(e){ e.preventDefault(); setLoading(true); setError(null);
    try{ const res = await login(email, password); if(res?.token){ onLogin(res.token);} }
    catch(err){ setError(err.message || "Greška pri prijavi"); } finally{ setLoading(false); } }
  return (<form onSubmit={handleSubmit}>
    <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required style={{width:"100%",padding:"0.5rem",marginBottom:"0.5rem"}}/>
    <input type="password" placeholder="Lozinka" value={password} onChange={(e)=>setPassword(e.target.value)} required style={{width:"100%",padding:"0.5rem",marginBottom:"0.5rem"}}/>
    <button type="submit" disabled={loading} style={{padding:"0.5rem 1rem"}}>{loading?"Prijava...":"Prijavi se"}</button>
    {error && <p style={{color:"red"}}>{error}</p>}
    <p style={{marginTop:8}}><a href="/forgot-password">Zaboravljena lozinka?</a></p>
  </form>);
}
