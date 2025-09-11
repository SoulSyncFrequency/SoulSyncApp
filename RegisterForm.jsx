import React, { useState } from "react";
import { register } from "../api";
export default function RegisterForm() {
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [msg,setMsg]=useState(null); const [err,setErr]=useState(null); const [loading,setLoading]=useState(false);
  async function handleSubmit(e){ e.preventDefault(); setErr(null); setMsg(null); setLoading(true);
    try{ const res = await register(email, password, name); setMsg("Uspješna registracija. Sada se prijavi."); }
    catch(e){ setErr(e.message || "Greška pri registraciji"); }
    finally{ setLoading(false); } }
  return (<form onSubmit={handleSubmit}>
    <input type="text" placeholder="Ime" value={name} onChange={(e)=>setName(e.target.value)} required style={{width:"100%",padding:"0.5rem",marginBottom:"0.5rem"}}/>
    <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required style={{width:"100%",padding:"0.5rem",marginBottom:"0.5rem"}}/>
    <input type="password" placeholder="Lozinka" value={password} onChange={(e)=>setPassword(e.target.value)} required style={{width:"100%",padding:"0.5rem",marginBottom:"0.5rem"}}/>
    <button type="submit" disabled={loading} style={{padding:"0.5rem 1rem"}}>{loading?"Slanje...":"Registriraj"}</button>
    {msg && <p style={{color:"green"}}>{msg}</p>}
    {err && <p style={{color:"red"}}>{err}</p>}
  </form>);
}
