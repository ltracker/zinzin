// Cohérence du site statique : précache du service worker, sitemap, manifest, balises SEO.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../public/', import.meta.url));
const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
const precache = JSON.parse(`[${sw.match(/const PRECACHE = \[([\s\S]*?)\];/)[1].replace(/'/g, '"').replace(/,\s*$/, '')}]`);

function walk(dir, base = '') {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p, `${base}/${f}`) : [`${base}/${f}`];
  });
}

// Fichiers servis qui n'ont pas besoin d'être disponibles hors ligne.
const NOT_PRECACHED = /^\/(sw\.js|_headers|_redirects|robots\.txt|sitemap\.xml)$|^\/assets\/og\/|^\/assets\/fonts\/OFL\.txt$/;

test('le service worker précache tous les fichiers utiles, et seulement des fichiers existants', () => {
  for (const url of precache) {
    const file = url.endsWith('/') ? `${url}index.html` : url;
    assert.ok(existsSync(join(ROOT, file)), `précaché mais introuvable : ${url}`);
  }
  const served = walk(ROOT).filter((f) => !NOT_PRECACHED.test(f));
  for (const f of served) {
    const url = f.endsWith('/index.html') ? f.replace(/index\.html$/, '') : f;
    assert.ok(precache.includes(url), `fichier servi absent du précache : ${url}`);
  }
});

test('chaque page a ses balises SEO, est dans le sitemap et a son image OG', () => {
  const sitemap = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
  const pages = walk(ROOT).filter((f) => f.endsWith('/index.html'));
  for (const page of pages) {
    const html = readFileSync(join(ROOT, page), 'utf8');
    const path = page.replace(/index\.html$/, '');
    assert.match(html, /<title>[^<]{10,}<\/title>/, `${page} : titre`);
    assert.match(html, /<meta name="description" content="[^"]{50,}">/, `${page} : description`);
    assert.match(html, /<html lang="fr">/, `${page} : lang`);
    assert.ok(html.includes('<!-- seo -->'), `${page} : bloc SEO (lancer node scripts/seo-meta.mjs)`);
    assert.ok(sitemap.includes(`${path}</loc>`), `${page} absente du sitemap`);
    const og = html.match(/property="og:image" content="[^"]+\/assets\/og\/([^"]+)"/)[1];
    assert.ok(existsSync(join(ROOT, 'assets/og', og)), `${page} : image OG ${og} manquante`);
    assert.ok(!/ style="|<script>(?!\s*<\/script>)| on[a-z]+="/.test(html), `${page} : style/script inline interdit (CSP)`);
  }
});

test('manifest valide', () => {
  const m = JSON.parse(readFileSync(join(ROOT, 'manifest.webmanifest'), 'utf8'));
  assert.equal(m.lang, 'fr');
  assert.ok(m.icons.some((i) => i.sizes === '512x512' && i.purpose === 'maskable'));
  for (const i of m.icons) assert.ok(existsSync(join(ROOT, i.src)), i.src);
});
