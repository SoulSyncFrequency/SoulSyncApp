// Theme boot (moved from inline to comply with strict CSP)
try{
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const stored = localStorage.getItem('theme')
  const enable = stored === 'dark' || (!stored && prefersDark)
  document.documentElement.classList.toggle('dark', !!enable)
}catch{}
