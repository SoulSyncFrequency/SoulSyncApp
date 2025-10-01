import { useState } from 'react'
import { apiBase, setToken } from '../lib/auth'
import { useNavigate } from 'react-router-dom'
export default function Login(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState<string|null>(null)
  const navigate=useNavigate()
  const submit=async()=>{
    setError(null)
    try{
      const res=await fetch(`${apiBase()}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})})
      const data=await res.json()
      if(!res.ok||!data.ok) throw new Error(data?.error||'Login failed')
      setToken(data.token)
      navigate('/therapy')
    }catch(e:any){setError(e.message)}
  }
  return (<div className='p-4 max-w-md mx-auto'><h1 className='text-xl font-bold mb-4'>Login</h1>
  <div className='space-y-3'><input className='w-full border rounded px-3 py-2 bg-transparent' placeholder='Email' value={email} onChange={e=>setEmail(e.target.value)} />
  <input className='w-full border rounded px-3 py-2 bg-transparent' placeholder='Password' type='password' value={password} onChange={e=>setPassword(e.target.value)} />
  <button onClick={submit} className='px-4 py-2 rounded bg-blue-600 text-white'>Login</button>
  {error&&<div className='text-red-500 text-sm'>{error}</div>}</div></div>)
}
