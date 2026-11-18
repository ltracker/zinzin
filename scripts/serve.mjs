// Mini-serveur statique sans dépendance, qui imite Cloudflare Pages :
// - /dossier → redirection 308 vers /dossier/ ; /dossier/ → dossier/index.html
// - fichier introuvable → 404.html avec le statut 404
// Usage : node scripts/serve.mjs [port]   (défaut 3000)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../public', import.meta.url)));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.ics': 'text/calendar; charset=utf-8',
};

async function isFile(p) {
  try { return (await stat(p)).isFile(); } catch { return false; }
}
async function isDir(p) {
  try { return (await stat(p)).isDirectory(); } catch { return false; }
}

export function startServer(port = 3000) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      const target = normalize(join(ROOT, pathname));
      if (!target.startsWith(ROOT)) { res.writeHead(403).end(); return; }

      let file = null;
      if (await isFile(target)) file = target;
      else if (await isDir(target)) {
        if (!pathname.endsWith('/')) {
          res.writeHead(308, { Location: pathname + '/' + url.search }).end();
          return;
        }
        if (await isFile(join(target, 'index.html'))) file = join(target, 'index.html');
      } else if (await isFile(target + '.html')) file = target + '.html';

      if (!file) {
        const body = await readFile(join(ROOT, '404.html')).catch(() => 'Introuvable');
        res.writeHead(404, { 'Content-Type': TYPES['.html'] }).end(body);
        return;
      }
      const body = await readFile(file);
      res.writeHead(200, {
        'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      }).end(body);
    } catch (err) {
      res.writeHead(500).end(String(err));
    }
  });
  return new Promise((ok) => server.listen(port, () => ok(server)));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2]) || 3000;
  await startServer(port);
  console.log(`Zinzin servi sur http://localhost:${port}`);
}
