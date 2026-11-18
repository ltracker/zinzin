// Pré-traitement UNIQUE des données pays pour le mode « Silhouette ».
// Source : Natural Earth 1:50m (domaine public) via le paquet npm world-atlas.
// Sortie : public/jeu/data/pays.json — [{ c, n, lat, lon, a, p, pool }]
//   c   : code ISO 3166-1 alpha-2       n : nom français (Intl.DisplayNames)
//   lat/lon : centroïde (pondéré par l'aire) des parties conservées
//   a   : aire approximative en km²     p : tracé SVG dans une boîte 100×100
//   pool: true si le pays peut être tiré comme puzzle (assez grand pour être reconnaissable)
//
// Usage : npm run data   (à relancer seulement si on veut changer les données)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';
import { ringArea, ringCentroid, simplify } from '../public/jeu/geo.logic.js';

const require = createRequire(import.meta.url);
const isoCountries = require('i18n-iso-countries');
const topo = JSON.parse(readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8'));
const geo = feature(topo, topo.objects.countries);
const displayNames = new Intl.DisplayNames(['fr'], { type: 'region' });

const KM_PER_DEG = 111.32;
const POOL_MIN_AREA = 20_000; // km²
const BOX = 100, PAD = 5;

// Noms plus courants que ceux d'Intl pour certains pays.
const NAME_OVERRIDES = {
  CD: 'République démocratique du Congo',
  CG: 'République du Congo',
  MM: 'Birmanie',
  CZ: 'Tchéquie',
  CI: "Côte d'Ivoire",
  PS: 'Palestine',
};
// Territoires non souverains ou trop ambigus à exclure.
const EXCLUDE = new Set(['AQ', 'TF', 'HM', 'BV', 'GS', 'UM', 'IO', 'EH']);

const polygonsOf = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []);

const out = [];
for (const f of geo.features) {
  const a2 = isoCountries.numericToAlpha2(f.id);
  if (!a2 || EXCLUDE.has(a2)) continue;
  let polys = polygonsOf(f.geometry);
  if (!polys.length) continue;

  // Antiméridien : si le pays a des parties des deux côtés de ±180°, on décale les longitudes négatives.
  const lons = polys.flat(2).map((p) => p[0]);
  const crosses = Math.min(...lons) < -150 && Math.max(...lons) > 150;
  if (crosses) polys = polys.map((poly) => poly.map((ring) => ring.map(([x, y]) => [x < 0 ? x + 360 : x, y])));

  // Aire et centroïde de chaque polygone (anneau extérieur), en projection locale équivalente.
  const info = polys.map((poly) => {
    const outer = poly[0];
    const [clon, clat] = ringCentroid(outer);
    const k = Math.cos(clat * Math.PI / 180);
    const area = Math.abs(ringArea(outer.map(([x, y]) => [x * k, y]))) * KM_PER_DEG ** 2;
    const xs = outer.map((p) => p[0]), ys = outer.map((p) => p[1]);
    const diag = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    return { poly, area, clon, clat, diag };
  });
  const main = info.reduce((m, x) => (x.area > m.area ? x : m));
  const radius = Math.max(15, main.diag);
  // On garde les parties proches du territoire principal (exclut DOM-TOM, Hawaï lointains…).
  const kept = info.filter((x) => Math.hypot((x.clon - main.clon) * Math.cos(main.clat * Math.PI / 180), x.clat - main.clat) <= radius);

  const area = kept.reduce((s, x) => s + x.area, 0);
  let lon = kept.reduce((s, x) => s + x.clon * x.area, 0) / area;
  const lat = kept.reduce((s, x) => s + x.clat * x.area, 0) / area;
  if (lon > 180) lon -= 360;

  // Projection équirectangulaire locale (cos(lat) au centre) puis ajustement dans la boîte.
  const k = Math.cos(lat * Math.PI / 180);
  const lon0 = kept.reduce((s, x) => s + x.clon * x.area, 0) / area;
  const proj = kept.map((x) => x.poly.map((ring) => ring.map(([x2, y2]) => [(x2 - lon0) * k, -y2])));
  const all = proj.flat(2);
  const minX = Math.min(...all.map((p) => p[0])), maxX = Math.max(...all.map((p) => p[0]));
  const minY = Math.min(...all.map((p) => p[1])), maxY = Math.max(...all.map((p) => p[1]));
  const scale = (BOX - 2 * PAD) / Math.max(maxX - minX, maxY - minY);
  const offX = (BOX - (maxX - minX) * scale) / 2, offY = (BOX - (maxY - minY) * scale) / 2;
  const fit = ([x, y]) => [(x - minX) * scale + offX, (y - minY) * scale + offY];

  let d = '';
  for (const poly of proj) {
    for (const ring of poly) {
      const pts = simplify(ring.map(fit), 0.22);
      if (pts.length < 4 || Math.abs(ringArea(pts)) < 0.6) continue;
      d += 'M' + pts.slice(0, -1).map(([x, y]) => `${+x.toFixed(1)} ${+y.toFixed(1)}`).join('L') + 'Z';
    }
  }
  if (!d) continue;

  // Certains territoires partagent le code de leur pays (ex. îles Ashmore-et-Cartier → AU) : on garde le plus grand.
  const dup = out.findIndex((x) => x.c === a2);
  if (dup >= 0) {
    if (out[dup].a >= area) continue;
    out.splice(dup, 1);
  }

  out.push({
    c: a2,
    n: NAME_OVERRIDES[a2] || displayNames.of(a2).replace(/’/g, "'"),
    lat: +lat.toFixed(3),
    lon: +lon.toFixed(3),
    a: Math.round(area),
    p: d,
    pool: area >= POOL_MIN_AREA,
  });
}

out.sort((x, y) => x.n.localeCompare(y.n, 'fr'));
mkdirSync('public/jeu/data', { recursive: true });
const json = JSON.stringify(out);
writeFileSync('public/jeu/data/pays.json', json);
console.log(`${out.length} pays, dont ${out.filter((x) => x.pool).length} tirables ; ${(json.length / 1024).toFixed(0)} Ko`);
