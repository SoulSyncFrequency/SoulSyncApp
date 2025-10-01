// Placeholder service worker (enable caching later if needed)
self.addEventListener('install', (e)=>{ self.skipWaiting() })
self.addEventListener('activate', (e)=>{ self.clients.claim() })


self.addEventListener('push', function(event){
  try{
    const data = event.data ? event.data.json() : {}
    const title = data.title || 'SoulSync'
    const options = { body: data.body || '', data: data.data || {} }
    event.waitUntil(self.registration.showNotification(title, options))
  }catch(e){}
})
self.addEventListener('notificationclick', function(event){
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})
