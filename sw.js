// PitchTipsX service worker v13.
// Shell + static JSON + tip images: stale-while-revalidate (instant paint, refreshed in background).
// Google Sheet CSV + football-data proxy: network first with a short timeout, cached copy when slow/offline.
// Web push is delivered by the alerts worker. This file only displays the payload it sends.
const CACHE='ptx-shell-v13',DATA='ptx-data-v13',IMG='ptx-img-v13';
const SHELL=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./tipimg.json','https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{const keep=[CACHE,DATA,IMG];e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>!keep.includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const key=u=>{const x=new URL(u);x.searchParams.delete('_');return x.href};
function swr(req,cn,k){return caches.open(cn).then(c=>c.match(k||req).then(hit=>{const net=fetch(req).then(r=>{if(r.ok)c.put(k||req,r.clone());return r}).catch(()=>hit);return hit||net}))}
function netFirst(req,k,ms){return caches.open(DATA).then(c=>new Promise(res=>{let done=false;const fb=()=>c.match(k).then(h=>{if(!done&&h){done=true;res(h)}});const t=setTimeout(fb,ms);
 fetch(req).then(r=>{clearTimeout(t);if(r.ok)c.put(k,r.clone());if(!done){done=true;res(r)}}).catch(()=>{clearTimeout(t);c.match(k).then(h=>{if(!done){done=true;res(h||Response.error())}})})}))}
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
 if(u.hostname==='docs.google.com'&&u.pathname.includes('/gviz/'))return e.respondWith(netFirst(r,key(r.url),4000));
 if(u.hostname.endsWith('workers.dev'))return e.respondWith(netFirst(r,key(r.url)+'#'+(r.headers.get('X-Auth-Token')||'').slice(-6),5000));
 if(u.hostname==='pbs.twimg.com')return e.respondWith(swr(r,IMG));
 if((u.pathname.endsWith('clv.json')||u.pathname.endsWith('odds.json')))return e.respondWith(netFirst(r,key(r.url),3000));
 const scope=new URL('./',self.registration.scope);
 if(r.mode==='navigate'&&u.pathname.startsWith(scope.pathname)&&!u.pathname.startsWith(scope.pathname+'old/'))return e.respondWith(fetch(r).then(x=>{const y=x.clone();caches.open(CACHE).then(c=>c.put('./',y));return x}).catch(()=>caches.match('./')));
 if(SHELL.some(s=>new URL(s,scope).href===u.href))return e.respondWith(swr(r,CACHE));
});
self.addEventListener('push',e=>{let data={};try{data=e.data?e.data.json():{}}catch(err){data={body:e.data?e.data.text():''}}
 const title=data.title||'',body=data.body||'';
 if(!title&&!body)return;
 e.waitUntil(self.registration.showNotification(title||'PitchTipsX',{body,icon:'icons/icon-192.png',badge:'icons/icon-192.png',data:{url:data.url||'./'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=(e.notification.data&&e.notification.data.url)||'./';
 e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{const open=list.find(c=>c.url.includes(new URL('./',self.registration.scope).pathname));if(open)return open.focus();return clients.openWindow(url)}))});
