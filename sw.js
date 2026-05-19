const CACHE_NAME = 'btp-pro-ci-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png'
];

// Installation : Mise en cache des fichiers essentiels
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('BTP PRO CI : Mise en cache des fichiers');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activation : Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  console.log('BTP PRO CI Service Worker activé');
});

// Stratégie de réponse : Réseau d'abord, sinon Cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
