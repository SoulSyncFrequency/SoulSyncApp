import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]; const [otp,setOtp] = useState('');=useState('');
  const nav = useNavigate();

  const handleLogin = async (e:React.FormEvent)=>{
    e.preventDefault();
    const r = await fetch('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:username, password, otp})});
    if(r.ok){
      
      nav('/admin');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <form onSubmit={handleLogin} className="bg-white shadow p-6 rounded w-80 space-y-4">
        <h1 className="text-xl font-bold text-center">Admin Login</h1>
        <input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} className="border p-2 w-full"/>
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="border p-2 w-full"/>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">Login</button>
      <input placeholder="OTP (if 2FA)" value={otp} onChange={e=>setOtp(e.target.value)} className="border p-2 w-full"/>
          <a href="#" onClick={async(e)=>{e.preventDefault(); if(!username) return alert('Enter email first'); await fetch('/auth/password/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:username})}); alert('If the email exists, a reset link has been sent.');}} className="text-sm text-blue-600 underline block text-center mt-2">Forgot password?</a>
        </form>
    </div>
  );
}
