import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import NavBar from './components/NavBar'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Settings from './pages/Settings'
import About from './pages/About'
import Therapy from './pages/Therapy'
import Profile from './pages/Profile'
import Reports from './pages/Reports'
import Login from './pages/Login'
import Register from './pages/Register'
import Protected from './components/Protected'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/therapy" element={<Protected><Therapy /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="/reports" element={<Protected><Reports /></Protected>} />
          <Route path="/privacy" element={<Privacy/>} />
  <Route path="/terms" element={<Terms/>} />
</Routes>
      </main>
            <footer className="mt-auto text-center text-sm opacity-80 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        © 2025 SoulSync — <a href="/legal/index.html" target="_blank" rel="noreferrer" className="hover:underline">Legal</a> | <a href="mailto:soulsyncfrequency@gmail.com" className="hover:underline">Contact</a>
      </footer>
    </div>
  )
}
