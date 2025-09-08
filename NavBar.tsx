import { Link } from 'react-router-dom'
import Sidebar from './Sidebar'
import DarkModeToggle from './DarkModeToggle'
import { useEffect, useState } from 'react'
import { apiBase } from '../lib/auth'
import { useNavigate } from 'react-router-dom'

export default function NavBar() {
  const [email,setEmail] = useState<string>('')
  const navigate = useNavigate()
  useEffect(()=>{
    const t = localStorage.getItem('token')
    if(!t) return
    fetch(`${apiBase()}/api/auth/me`,{ headers: { Authorization: `Bearer ${t}` }})
      .then(r=>r.json()).then(d=>{ if(d?.ok && d?.user?.email) setEmail(d.user.email) }).catch(()=>{})
  },[])
  const logout = ()=>{ localStorage.removeItem('token'); navigate('/login') }
  return (
    <nav className="flex items-center justify-between bg-gray-100 dark:bg-gray-900 px-4 py-2 shadow">
      <div className="flex items-center gap-4">
        <Sidebar />
        <div className="font-bold text-lg text-gray-900 dark:text-gray-100">SoulSync</div>
      </div>
      <div className="flex items-center gap-4">
        <ul className="flex gap-4">
          <li><Link to="/" className="hover:underline text-gray-800 dark:text-gray-200">Home</Link></li>
          <li><Link to="/settings" className="hover:underline text-gray-800 dark:text-gray-200">Settings</Link></li>
          <li><Link to="/about" className="hover:underline text-gray-800 dark:text-gray-200">About</Link></li>
        </ul>
        {email && <span className="text-sm opacity-80">{email}</span>}
        <button onClick={logout} className="text-sm underline">Logout</button>
        <DarkModeToggle />
      </div>
    </nav>
  )
}
