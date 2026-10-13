/* Apenas página offline estática — nunca faça cache de perfis, sessão, API ou fotos privadas. */
const CACHE='coollects-offline-v1'
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.add('/offline.html')));self.skipWaiting()})
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()})
self.addEventListener('fetch',event=>{
 const request=event.request
 if(request.mode!=='navigate'||request.method!=='GET')return
 event.respondWith(fetch(request).catch(()=>caches.match('/offline.html')))
})
