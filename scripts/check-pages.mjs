// Vérification automatique des pages dans un vrai navigateur (Edge ou Chrome
// installé, piloté par playwright-core, sans téléchargement de navigateur).
// Pour chaque page : mobile et desktop, thèmes clair et sombre.
// Remonte : erreurs console et JS, requêtes en échec, débordement horizontal,
// contrôles interactifs sans nom accessible. Prend des captures d'écran.
//
// Usage : node scripts/check-pages.mjs [--out dossier] [/chemin/ ...]
//   ex. node scripts/check-pages.mjs / /a-propos/
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { startServer } from './serve.mjs';

const args = process.argv.slice(2);
let out = 'tmp/screens';
const paths = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') out = args[++i];
  else paths.push(args[i]);
}
if (!paths.length) paths.push('/', '/a-propos/', '/ce-jour-la/', '/noms/', '/jeu/', '/roue/', '/page-inexistante');

const PORT = 4173;
const server = await startServer(PORT);
await mkdir(out, { recursive: true });

let browser;
for (const channel of ['msedge', 'chrome']) {
  try { browser = await chromium.launch({ channel }); break; } catch { /* suivant */ }
}
if (!browser) { console.error('Ni Edge ni Chrome trouvés.'); process.exit(2); }

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'desktop', width: 1280, height: 860 },
];
let problems = 0;

for (const path of paths) {
  for (const vp of VIEWPORTS) {
    for (const scheme of ['light', 'dark']) {
      const ctx = await browser.newContext({ ...vp, viewport: { width: vp.width, height: vp.height }, colorScheme: scheme, locale: 'fr-FR', timezoneId: 'Europe/Paris' });
      const page = await ctx.newPage();
      const issues = [];
      page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') issues.push(`console.${m.type()}: ${m.text()}`); });
      page.on('pageerror', (e) => issues.push(`pageerror: ${e.message}`));
      page.on('response', (r) => {
        const expected404 = path.includes('inexistante') && r.url().endsWith(path);
        if (r.status() >= 400 && !expected404) issues.push(`HTTP ${r.status()} ${r.url()}`);
      });
      page.on('requestfailed', (r) => issues.push(`échec requête ${r.url()} (${r.failure()?.errorText})`));

      const resp = await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(900); // laisse finir les animations d'entrée

      const audit = await page.evaluate(() => {
        const res = [];
        const de = document.documentElement;
        if (de.scrollWidth > de.clientWidth + 1) res.push(`débordement horizontal : ${de.scrollWidth}px > ${de.clientWidth}px`);
        const interactive = document.querySelectorAll('a[href], button, input, select, textarea, [role="button"]');
        for (const n of interactive) {
          if (n.type === 'hidden') continue;
          const label = (n.getAttribute('aria-label') || n.textContent || n.getAttribute('title') || n.value || '').trim()
            || (n.id && document.querySelector(`label[for="${n.id}"]`)?.textContent.trim())
            || n.closest('label')?.textContent.trim()
            || (n.getAttribute('aria-labelledby') && document.getElementById(n.getAttribute('aria-labelledby'))?.textContent.trim());
          if (!label) res.push(`sans nom accessible : <${n.tagName.toLowerCase()} ${n.className}>`);
        }
        if (!document.title) res.push('pas de <title>');
        if (!document.documentElement.lang) res.push('pas de lang');
        const fontOk = document.fonts.check('800 20px Bricolage');
        if (!fontOk) res.push('police Bricolage non chargée');
        return res;
      });
      issues.push(...audit);

      const slug = (path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'accueil');
      const file = join(out, `${slug}--${vp.name}--${scheme}.png`);
      await page.screenshot({ path: file, fullPage: true });
      const status = resp ? resp.status() : '???';
      const tag = issues.length ? '✖' : '✔';
      console.log(`${tag} ${path} [${vp.name}/${scheme}] HTTP ${status} → ${file}`);
      for (const i of issues) console.log(`    - ${i}`);
      problems += issues.length;
      await ctx.close();
    }
  }
}

await browser.close();
server.close();
console.log(problems ? `\n${problems} problème(s) détecté(s).` : '\nAucun problème détecté.');
process.exit(problems ? 1 : 0);
