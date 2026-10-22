/* Apenas página offline estática — nunca faça cache de perfis, sessão, API ou fotos privadas. */
const CACHE='coollects-offline-v1'
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.add('/offline.html')));self.skipWaiting()})
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()})
self.addEventListener('fetch',event=>{
 const request=event.request
 if(request.mode!=='navigate'||request.method!=='GET')return
 event.respondWith(fetch(request).catch(()=>caches.match('/offline.html')))
})

/* Notification bodies never contain private data; links stay same-origin. */
self.addEventListener('push',event=>{
 let data={}
 try{data=event.data?.json()||{}}catch{/* invalid payload */}
 const title=typeof data.title==='string'?data.title.slice(0,100):'Coollects'
 const body=typeof data.body==='string'?data.body.slice(0,220):'Você tem novidades na sua coleção.'
 const url=typeof data.url==='string'&&data.url.startsWith('/')&&!data.url.startsWith('//')?data.url:'/notificacoes'
 event.waitUntil(self.registration.showNotification(title,{body,icon:'/brand/icon-192.png?v=2',badge:'/brand/icon-192.png?v=2',tag:typeof data.tag==='string'?data.tag:'coollects-social',data:{url}}))
})
self.addEventListener('notificationclick',event=>{
 event.notification.close()
 const path=event.notification.data?.url||'/notificacoes'
 const url=new URL(path,self.location.origin)
 if(url.origin!==self.location.origin)return
 event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{
  const existing=clients.find(c=>new URL(c.url).origin===url.origin)
  if(existing){await existing.navigate(url.href);return existing.focus()}
  return self.clients.openWindow(url.href)
 }))
})
