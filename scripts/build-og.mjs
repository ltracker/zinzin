// Génère UNE FOIS les visuels statiques du site (commités dans le repo) :
// - images Open Graph 1200×630 : public/assets/og/<page>.png
// - icônes PWA : public/assets/icons/icon-192.png, icon-512.png, maskable-512.png, apple-touch-icon.png
// Rendu par Edge/Chrome via playwright-core. Usage : node scripts/build-og.mjs
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Police intégrée en data: URL (une page setContent ne peut pas lire file://).
const FONT = `data:font/woff2;base64,${readFileSync(resolve('public/assets/fonts/bricolage.woff2')).toString('base64')}`;
const FAVICON = readFileSync('public/favicon.svg', 'utf8');

export const OG_PAGES = [
  { slug: 'accueil', emoji: '🤪', color: '#ffd23f', kicker: '4 mini-apps zinzins', title: 'Zinzin', sub: 'Stats de vie, noms absurdes, jeu du jour et roue de la décision.' },
  { slug: 'ce-jour-la', emoji: '🎂', color: '#ffd23f', kicker: 'Ce jour-là', title: 'Ta vie en chiffres zinzins', sub: 'Ton âge à la seconde, sur Mars et en pleines lunes.' },
  { slug: 'noms', emoji: '🎸', color: '#ff6fae', kicker: 'Noms absurdes', title: 'La machine à noms', sub: 'Groupe de rock, startup, cocktail, super-vilain, wifi…' },
  { slug: 'jeu', emoji: '🧩', color: '#3ddc97', kicker: 'Le jeu du jour', title: 'Émojifilm & Silhouette', sub: 'Un film en émojis, un pays en silhouette. 6 essais.' },
  { slug: 'roue', emoji: '🎡', color: '#4cc3ff', kicker: 'La roue de la décision', title: 'On mange quoi ?', sub: 'Laisse la roue trancher. Avec confettis.' },
  { slug: 'a-propos', emoji: '🍪', color: '#b28dff', kicker: 'À propos', title: 'Zéro cookie. Vraiment.', sub: 'Tout reste dans ton navigateur.' },
  { slug: 'avent', emoji: '🎄', color: '#ff7a45', kicker: 'Calendrier de l\'Avent', title: '24 cases zinzines', sub: 'Une surprise absurde chaque jour de décembre.' },
  { slug: 'pere-noel-secret', emoji: '🎅', color: '#ff6fae', kicker: 'Père Noël secret', title: 'Qui offre à qui ?', sub: 'Un tirage au sort sans serveur, un lien secret par personne.' },
  { slug: 'horoscope', emoji: '🔮', color: '#b28dff', kicker: "Horoscope absurde", title: "Les astres ont parlé", sub: "Amour, travail, santé : l'horoscope le plus inutile du web." },
  { slug: 'quiz', emoji: '🧀', color: '#ffd23f', kicker: "Quiz zinzins", title: "Quel fromage es-tu ?", sub: "Des quiz de personnalité scientifiquement infondés." },
  { slug: 'chrono', emoji: '⏱️', color: '#4cc3ff', kicker: "Chrono parfait", title: "Pile 10 secondes ?", sub: "Le chrono disparaît après 3 secondes. Bonne chance." },
  { slug: 'equipes', emoji: '👥', color: '#3ddc97', kicker: "Équipes & dés", title: "Que les jeux commencent", sub: "Équipes tirées au sort, noms ridicules et lancers de dés." },
  { slug: 'excuses', emoji: '🙊', color: '#ff6fae', kicker: "Excuses bidon", title: "Ce n'est pas ma faute", sub: "Le générateur d'excuses absurdes, crédibilité non garantie." },
  { slug: 'album', emoji: '⭐', color: '#ffd23f', kicker: 'Album d\'autocollants', title: 'Collectionne-les tous', sub: 'Des succès zinzins à débloquer dans toutes les apps.' },
];

const ogHtml = (p) => `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: B; src: url("${FONT}") format("woff2"); font-weight: 200 800; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: #fff6e5; font-family: B, sans-serif; color: #24104f; overflow: hidden;
  background-image: radial-gradient(rgba(36,16,79,.09) 3px, transparent 3.5px); background-size: 34px 34px; }
.card { position: absolute; left: 70px; top: 60px; width: 1060px; height: 470px; background: ${p.color};
  border: 8px solid #24104f; border-radius: 48px; box-shadow: 18px 18px 0 #24104f; padding: 48px 64px; }
.kicker { display: inline-block; background: #24104f; color: #fff6e5; font-weight: 750; font-size: 34px;
  padding: 10px 28px; border-radius: 99px; transform: rotate(-2deg); }
h1 { font-size: 92px; font-weight: 800; letter-spacing: -0.04em; line-height: .98; margin-top: 34px; max-width: 760px; }
p { font-size: 34px; font-weight: 600; margin-top: 22px; max-width: 760px; line-height: 1.2; }
.emoji { position: absolute; right: 60px; top: 70px; font-size: 220px; transform: rotate(8deg);
  font-family: "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif; }
.brand { position: absolute; left: 70px; bottom: 22px; font-weight: 800; font-size: 40px; letter-spacing: -0.03em; }
</style><div class="card"><span class="kicker">${p.kicker}</span><h1>${p.title}</h1><p>${p.sub}</p><div class="emoji">${p.emoji}</div></div>
<div class="brand">Zinzin</div>`;

const iconHtml = (size, maskable) => `<!doctype html><style>*{margin:0}body{width:${size}px;height:${size}px;display:grid;place-items:center;
background:${maskable ? '#ffd23f' : 'transparent'}}svg{width:${maskable ? size * 0.62 : size}px;height:${maskable ? size * 0.62 : size}px}</style>${FAVICON}`;

const browser = await chromium.launch({ channel: 'msedge' }).catch(() => chromium.launch({ channel: 'chrome' }));
mkdirSync('public/assets/og', { recursive: true });
mkdirSync('public/assets/icons', { recursive: true });

for (const p of OG_PAGES) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(ogHtml(p), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `public/assets/og/${p.slug}.png` });
  await page.close();
}

for (const [name, size, maskable] of [['icon-192', 192, false], ['icon-512', 512, false], ['maskable-512', 512, true], ['apple-touch-icon', 180, true]]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(iconHtml(size, maskable));
  await page.screenshot({ path: `public/assets/icons/${name}.png`, omitBackground: !maskable });
  await page.close();
}

await browser.close();
console.log(`${OG_PAGES.length} images OG et 4 icônes générées.`);
