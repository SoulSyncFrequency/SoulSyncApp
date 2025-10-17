const { generateSW } = require('workbox-build')
async function build(){
  const { count, size } = await generateSW({
    globDirectory: 'frontend/dist',
    globPatterns: ['**/*.{html,js,css,svg,png,woff2}'],
    swDest: 'frontend/public/sw.js',
    navigateFallback: '/index.html',
    runtimeCaching: [
      { urlPattern: ({url}) => /^(\/api|\/ai|\/gdpr|\/history)\//.test(url.pathname), handler: 'NetworkFirst', options: { cacheName: 'api-get' } },
      { urlPattern: ({request}) => ['style','script','image','font'].includes(request.destination), handler: 'StaleWhileRevalidate', options: { cacheName: 'static' } },
    ]
  })
  console.log(`SW ready. Precached ${count} files (${size} bytes).`)
}
build()

// custom race strategy
const { NetworkFirst }=require('workbox-strategies')
class NetworkFirstWithRace extends NetworkFirst{ async _handle(request,handler){ const cache=handler.cacheMatch(request); const net=super._handle(request,handler); return Promise.race([net,new Promise(r=>setTimeout(async()=>r(await cache),2000))]) }}
const { BackgroundSyncPlugin } = require('workbox-background-sync')
module.exports = async function(){ /* no-op for bundlers */ }
const { generateSW } = require('workbox-build')
const { BackgroundSyncPlugin } = require('workbox-background-sync')

async function build(){
  const { count, size } = await generateSW({
    globDirectory: 'frontend/dist',
    globPatterns: ['**/*.{html,js,css,svg,png,woff2}'],
    swDest: 'frontend/public/sw.js',
    navigateFallback: '/index.html',
    runtimeCaching: [
      { urlPattern: ({url}) => /^(\/api|\/ai|\/gdpr|\/history)\//.test(url.pathname), handler: 'NetworkFirst', options: { cacheName: 'api-get' } },
      { urlPattern: ({request}) => ['style','script','image','font'].includes(request.destination), handler: 'StaleWhileRevalidate', options: { cacheName: 'static' } },
      { urlPattern: ({url, request}) => url.pathname==='/therapy/drafts/promote' && request.method==='POST',
        handler: 'NetworkOnly',
        options: { backgroundSync: new BackgroundSyncPlugin('promote-queue', { maxRetentionTime: 60 }) } }
    ]
  })
  console.log(`SW ready. Precached ${count} files (${size} bytes).`)
}
build()
