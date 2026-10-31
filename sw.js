// Guarda os arquivos do app para funcionar sem internet.
// Troque a VERSAO sempre que publicar mudanças, para os celulares baixarem a versão nova.
const VERSAO = 'fabrica-v1';
const ARQUIVOS = [
  './',
  'index.html',
  'css/app.css',
  'js/main.js',
  'js/marca.js',
  'js/quadros.js',
  'js/render.js',
  'js/audio.js',
  'js/video.js',
  'js/rascunhos.js',
  'data/exemplos.json',
  'fonts/AtkinsonHyperlegible-400.woff2',
  'fonts/AtkinsonHyperlegible-700.woff2',
  'manifest.webmanifest',
  'img/icon-192.png',
  'img/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

// Rede primeiro (para pegar atualizações); sem internet, usa o que está guardado.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        const copia = resp.clone();
        caches.open(VERSAO).then((c) => c.put(e.request, copia));
        return resp;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
