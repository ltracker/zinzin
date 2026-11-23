// Outil de maintenance (PAS une étape de build) : insère/met à jour dans chaque page HTML un
// bloc de balises SEO et de partage entre <!-- seo --> et <!-- /seo -->. Le résultat est commité.
// Réutilise le <title> et la <meta name="description"> déjà présents dans la page.
// Usage : node scripts/seo-meta.mjs   (à relancer après ajout d'une page ou changement d'URL)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const SITE_URL = (readFileSync('public/shared/site.js', 'utf8').match(/url: '([^']+)'/) || [])[1];
if (!SITE_URL) throw new Error('SITE.url introuvable dans public/shared/site.js');

// chemin de la page → image OG (public/assets/og/<slug>.png)
export const PAGES = [
  ['/', 'accueil'],
  ['/ce-jour-la/', 'ce-jour-la'],
  ['/noms/', 'noms'],
  ['/jeu/', 'jeu'],
  ['/roue/', 'roue'],
  ['/a-propos/', 'a-propos'],
  ['/avent/', 'avent'],
  ['/pere-noel-secret/', 'pere-noel-secret'],
  ['/album/', 'album'],
  ['/horoscope/', 'horoscope'],
  ['/quiz/', 'quiz'],
  ['/chrono/', 'chrono'],
  ['/equipes/', 'equipes'],
  ['/excuses/', 'excuses'],
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const unesc = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<');

let count = 0;
for (const [path, og] of PAGES) {
  const file = `public${path}index.html`;
  if (!existsSync(file)) continue;
  let html = readFileSync(file, 'utf8');
  const title = unesc((html.match(/<title>([^<]+)<\/title>/) || [])[1] || 'Zinzin');
  const desc = unesc((html.match(/<meta name="description" content="([^"]+)">/) || [])[1] || '');
  const url = SITE_URL + path;
  const img = `${SITE_URL}/assets/og/${og}.png`;
  const block = [
    '<!-- seo -->',
    `<link rel="canonical" href="${url}">`,
    '<link rel="manifest" href="/manifest.webmanifest">',
    '<link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Zinzin">',
    '<meta property="og:locale" content="fr_FR">',
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${img}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${esc(title)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(desc)}">`,
    `<meta name="twitter:image" content="${img}">`,
    '<!-- /seo -->',
  ].map((l, i) => (i ? `  ${l}` : l)).join('\n');

  if (html.includes('<!-- seo -->')) html = html.replace(/<!-- seo -->[\s\S]*?<!-- \/seo -->/, block);
  else html = html.replace(/(\n\s*<link rel="icon")/, `\n  ${block}$1`);
  writeFileSync(file, html);
  count++;
}

// sitemap.xml (pages publiques existantes)
const today = new Date().toISOString().slice(0, 10);
const urls = PAGES.filter(([p]) => existsSync(`public${p}index.html`))
  .map(([p]) => `  <url><loc>${SITE_URL}${p}</loc><lastmod>${today}</lastmod><changefreq>${p === '/jeu/' || p === '/avent/' ? 'daily' : 'monthly'}</changefreq><priority>${p === '/' ? '1.0' : '0.8'}</priority></url>`);
writeFileSync('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
writeFileSync('public/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`${count} pages mises à jour, sitemap (${urls.length} URL) et robots.txt écrits.`);
