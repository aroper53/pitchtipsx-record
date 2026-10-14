// PitchTipsX service worker: caches the app shell only. Sheet data and clv.json always go to the network.
const CACHE='ptx-shell-v6';
const SHELL=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.hostname==='docs.google.com'||u.pathname.endsWith('clv.json'))return; // data: network only
 const isShell=SHELL.some(s=>new URL(s,self.registration.scope).href===u.href)||(e.request.mode==='navigate'&&u.pathname===new URL('./',self.registration.scope).pathname);
 if(!isShell)return;
 // network first, fall back to cached shell when offline
 e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./'))))});
