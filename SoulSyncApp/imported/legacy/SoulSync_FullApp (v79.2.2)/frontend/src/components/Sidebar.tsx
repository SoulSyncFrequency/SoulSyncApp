import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Home, Settings, Info, FileText, Activity, User, BarChart2 } from 'lucide-react'

export default function Sidebar(){ const navigate = useNavigate(); const handleLogout = ()=>{ localStorage.removeItem('token'); navigate('/login') }; return ( {
  const [open, setOpen] = useState(false)

  const menuItems = [
    { path: '/', label: 'Home', icon: <Home size={18} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={18} /> },
    { path: '/about', label: 'About', icon: <Info size={18} /> },
    { path: '/legal/index.html', label: 'Legal', icon: <FileText size={18} />, external: true },
    { path: '/therapy', label: 'Therapy Modules', icon: <Activity size={18} /> },
    { path: '/profile', label: 'User Profile', icon: <User size={18} /> },
    { path: '/reports', label: 'Reports', icon: <BarChart2 size={18} /> },
  ]

  return (
    <div>
      <button onClick={() => setOpen(!open)} className="p-2 text-xl text-gray-800 dark:text-gray-200">≡</button>
      {open && (
        <div className="fixed top-0 left-0 w-64 h-full bg-white dark:bg-gray-800 shadow-lg p-4 z-50 text-gray-900 dark:text-gray-100">
          <button onClick={() => setOpen(false)} className="mb-4 text-lg">✖</button>
          <ul className="space-y-4">
            {menuItems.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                {item.external ? (
                  <a href={item.path} target="_blank" onClick={() => setOpen(false)} className="flex items-center gap-2">{item.icon}{item.label}</a>
                ) : (
                  <Link to={item.path} onClick={() => setOpen(false)} className="flex items-center gap-2">{item.icon}{item.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}