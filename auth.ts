export function apiBase(){return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}
export function token(){return localStorage.getItem('token') || ''}
export function setToken(t: string){localStorage.setItem('token', t)}
