// PitchTipsX retired member app: kill-switch service worker.
// Drops every old cache, stops intercepting requests, and moves open tabs to the new site.
// Push display is kept so existing alert subscribers still get notifications.
const NEW_HOME='https://pitchtipsx-record.lovable.app/record?utm_source=oldapp&utm_campaign=redirect';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  for(const k of await caches.keys())await caches.delete(k);
  await self.clients.claim();
  for(const c of await self.clients.matchAll({type:'window',includeUncontrolled:true})){try{c.navigate(NEW_HOME)}catch(err){}}
})()));
self.addEventListener('push',e=>{let data={};try{data=e.data?e.data.json():{}}catch(err){data={body:e.data?e.data.text():''}}
 const title=data.title||'',body=data.body||'';if(!title&&!body)return;
 e.waitUntil(self.registration.showNotification(title||'PitchTipsX',{body,icon:'icons/icon-192.png',badge:'icons/icon-192.png',data:{url:data.url||NEW_HOME}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();
 const url=(e.notification.data&&e.notification.data.url)||NEW_HOME;
 const safe=/^https:\/\/pitchtipsx-record\.lovable\.app\//.test(url)?url:NEW_HOME;
 e.waitUntil(clients.openWindow(safe))});
