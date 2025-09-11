import React, { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  return (<div style={{maxWidth:400, margin:"2rem auto"}}>
    <div style={{display:"flex", gap:8, marginBottom:12}}>
      <button onClick={()=>setMode("login")} disabled={mode==="login"}>Prijava</button>
      <button onClick={()=>setMode("register")} disabled={mode==="register"}>Registracija</button>
    </div>
    {mode==="login" ? <LoginForm onLogin={onLogin}/> : <RegisterForm/>}
  </div>);
}
