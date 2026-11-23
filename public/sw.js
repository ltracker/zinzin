// Service worker Zinzin : mode hors ligne.
// Stratégie « réseau d'abord, cache en secours » pour tout : en ligne on a toujours la
// dernière version (pas de mélange ancien JS / nouveau HTML après un déploiement) ;
// hors ligne, tout le site précaché reste utilisable.
// ⚠️ Ajouter ici tout nouveau fichier servi (le test tests/sw.test.js le vérifie).

const VERSION = 'zinzin-v3';

const PRECACHE = [
  '/',
  '/a-propos/',
  '/ce-jour-la/',
  '/noms/',
  '/jeu/',
  '/roue/',
  '/404.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/home.css',
  '/home.js',
  '/404.css',
  '/assets/fonts/bricolage.woff2',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/maskable-512.png',
  '/assets/icons/apple-touch-icon.png',
  '/shared/tokens.css',
  '/shared/base.css',
  '/shared/rng.js',
  '/shared/dates.js',
  '/shared/storage.js',
  '/shared/share.js',
  '/shared/image.js',
  '/shared/ui.js',
  '/shared/site.js',
  '/shared/autocomplete.js',
  '/a-propos/style.css',
  '/a-propos/main.js',
  '/ce-jour-la/style.css',
  '/ce-jour-la/main.js',
  '/ce-jour-la/life.logic.js',
  '/noms/style.css',
  '/noms/main.js',
  '/noms/names.logic.js',
  '/noms/dictionnaires.js',
  '/jeu/style.css',
  '/jeu/main.js',
  '/jeu/game.logic.js',
  '/jeu/geo.logic.js',
  '/jeu/data/films.js',
  '/jeu/data/pays.json',
  '/roue/style.css',
  '/roue/main.js',
  '/roue/wheel.logic.js',
  '/roue/presets.js',
  '/roue/confetti.js',
  '/avent/',
  '/avent/style.css',
  '/avent/main.js',
  '/avent/avent.logic.js',
  '/avent/calendrier.js',
  '/pere-noel-secret/',
  '/pere-noel-secret/style.css',
  '/pere-noel-secret/main.js',
  '/pere-noel-secret/santa.logic.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    } catch {
      // Hors ligne : la requête exacte, sinon la page sans paramètres, sinon l'accueil.
      const hit = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
      if (hit) return hit;
      if (req.mode === 'navigate') return (await cache.match('/')) || Response.error();
      return Response.error();
    }
  })());
});
