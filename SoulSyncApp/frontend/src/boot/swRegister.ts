// Service worker register (moved from inline to comply with strict CSP)
if('serviceWorker' in navigator){
  try{ navigator.serviceWorker.register('/sw.js') }catch(e){ console.error(e) }
}
