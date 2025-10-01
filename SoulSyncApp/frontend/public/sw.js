importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.6.0/workbox-sw.js');
if(self.workbox){
  workbox.core.setCacheNameDetails({ prefix: 'soulsync', suffix: 'v178' });
  // Static assets
  workbox.routing.registerRoute(({request})=>['style','script','image','font'].includes(request.destination),
    new workbox.strategies.StaleWhileRevalidate({ cacheName:'static' }));
  // API: NetworkFirst for key JSON endpoints
  workbox.routing.registerRoute(({url,request})=> request.method==='GET' && url.pathname.match(/^\/(api|gdpr|history|ai)\//),
    new workbox.strategies.NetworkFirst({ cacheName: 'api-get', networkTimeoutSeconds: 3 }));
  // Background sync for POSTs
  const bgSync = new workbox.backgroundSync.BackgroundSyncPlugin('ss-post', { maxRetentionTime: 24*60 });
  workbox.routing.registerRoute(({request})=> request.method==='POST', new workbox.strategies.NetworkOnly({ plugins:[bgSync] }), 'POST');
}
self.addEventListener('push', (event)=>{
  let data={}; try{ data=(event as any).data.json(); }catch{}
  (event as any).waitUntil(self.registration.showNotification(data.title||'SoulSync', { body: data.body||'' }));
});
