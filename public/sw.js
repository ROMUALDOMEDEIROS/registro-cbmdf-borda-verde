// Service worker do app. Mantém a interface disponível offline — a narração
// em si já não depende de rede, pois usa as vozes instaladas no dispositivo.

const VERSAO = 'cbmdf-narrador-v2';

// Caminhos relativos ao escopo do service worker, para funcionar tanto na raiz
// de um domínio quanto em subpasta (ex.: GitHub Pages).
const ESSENCIAIS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icones/icone-192.png',
  './icones/icone-512.png',
];

// O nome dos arquivos gerados pelo build tem hash, então não dá para listá-los
// aqui: lemos o index.html e guardamos o que ele referencia. Sem isso, o app só
// abriria offline enquanto o cache HTTP do navegador durasse.
async function precacharReferenciasDoIndex(cache) {
  const resposta = await fetch('./index.html', { cache: 'reload' });
  if (!resposta.ok) return;

  const html = await resposta.text();
  const referencias = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((achado) => achado[1]);

  const locais = referencias.filter((caminho) => caminho.startsWith('./'));
  const externos = referencias.filter((caminho) => caminho.startsWith('https://'));

  await Promise.allSettled([
    ...locais.map((caminho) => cache.add(caminho)),
    // CDN (Tailwind, fontes): respostas opacas não passam por cache.add,
    // então buscamos em no-cors e gravamos manualmente.
    ...externos.map(async (url) => {
      const externa = await fetch(url, { mode: 'no-cors' });
      await cache.put(url, externa);
    }),
  ]);
}

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    (async () => {
      const cache = await caches.open(VERSAO);
      // Falha em um recurso isolado não pode abortar a instalação inteira.
      await Promise.allSettled([
        ...ESSENCIAIS.map((caminho) => cache.add(caminho)),
        precacharReferenciasDoIndex(cache),
      ]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      const chaves = await caches.keys();
      await Promise.all(chaves.filter((chave) => chave !== VERSAO).map((chave) => caches.delete(chave)));
      await self.clients.claim();
    })(),
  );
});

// Permite que a página peça a ativação imediata de uma nova versão.
self.addEventListener('message', (evento) => {
  if (evento.data === 'ativar-agora') self.skipWaiting();
});

async function guardar(requisicao, resposta) {
  // Respostas opacas (CDN) têm status 0 e ainda assim servem offline.
  if (!resposta || (resposta.status !== 0 && !resposta.ok)) return;
  const cache = await caches.open(VERSAO);
  await cache.put(requisicao, resposta.clone());
}

// Navegação: rede primeiro (para pegar atualizações), cache como rede de segurança.
async function responderNavegacao(requisicao) {
  try {
    const resposta = await fetch(requisicao);
    await guardar(requisicao, resposta);
    return resposta;
  } catch {
    const cache = await caches.open(VERSAO);
    return (
      (await cache.match(requisicao)) ||
      (await cache.match('./index.html')) ||
      (await cache.match('./')) ||
      Response.error()
    );
  }
}

// Demais recursos: cache primeiro, buscando na rede quando ainda não houver cópia.
async function responderRecurso(requisicao) {
  const cache = await caches.open(VERSAO);
  const emCache = await cache.match(requisicao);
  if (emCache) return emCache;

  const resposta = await fetch(requisicao);
  await guardar(requisicao, resposta);
  return resposta;
}

self.addEventListener('fetch', (evento) => {
  const { request } = evento;

  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;

  if (request.mode === 'navigate') {
    evento.respondWith(responderNavegacao(request));
    return;
  }

  evento.respondWith(responderRecurso(request));
});
