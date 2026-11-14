/* Offline-Cache: Dateien der App werden beim ersten Öffnen gespeichert, online wird immer die neueste Version geladen.
   Bei einer neuen Version hier die Nummer erhöhen, dann lädt das iPad die neuen Dateien. */
var CACHE = 'wizbolt-v5';
var FILES = ['./', 'index.html', 'style.css', 'manifest.json', 'js/data.js', 'js/flavor.js', 'js/dice.js', 'js/app.js', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(FILES.map(function (f) { return fetch(f, { cache: 'reload' }).then(function (r) { if (!r.ok) throw new Error(f); return c.put(f, r); }); })); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
/* Online: immer die neueste Datei holen (und für offline merken). Ohne Netz: aus dem Cache. */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(function (res) {
    if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
    return res;
  }).catch(function () { return caches.match(e.request, { ignoreSearch: true }); }));
});
