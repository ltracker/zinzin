// Utilitaires de dates. Calculs en millisecondes UTC ; le « jour du puzzle »
// est déterminé dans le fuseau Europe/Paris, quel que soit le fuseau du visiteur.

export const MS = {
  second: 1000,
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
};

export const PARIS_TZ = 'Europe/Paris';

const partsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: PARIS_TZ,
  hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
});

/** Composantes de l'heure murale à Paris pour un instant donné. */
export function parisParts(date = new Date()) {
  const out = {};
  for (const p of partsFormatter.formatToParts(date)) {
    if (p.type !== 'literal') out[p.type] = Number(p.value);
  }
  return out; // { year, month, day, hour, minute, second }
}

/** Décalage (ms) entre l'heure de Paris et UTC à un instant donné (+1 h ou +2 h). */
export function parisOffsetMs(date = new Date()) {
  const p = parisParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

const pad = (n, l = 2) => String(n).padStart(l, '0');

/** Clé 'AAAA-MM-JJ' du jour courant à Paris. */
export function parisDateKey(date = new Date()) {
  const p = parisParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Analyse une clé 'AAAA-MM-JJ' → { year, month, day }. */
export function parseKey(key) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) throw new Error(`Clé de date invalide : ${key}`);
  return { year: +m[1], month: +m[2], day: +m[3] };
}

/** Nombre de jours écoulés depuis le 1970-01-01 pour une clé de date (calendrier pur). */
export function dayNumber(key) {
  const { year, month, day } = parseKey(key);
  return Math.round(Date.UTC(year, month - 1, day) / MS.day);
}

/** Ajoute n jours à une clé de date. */
export function addDaysToKey(key, n) {
  const { year, month, day } = parseKey(key);
  const d = new Date(Date.UTC(year, month - 1, day + n));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Instant (Date) correspondant à minuit, heure de Paris, pour une clé donnée. */
export function parisMidnight(key) {
  const { year, month, day } = parseKey(key);
  const wall = Date.UTC(year, month - 1, day);
  // Deux passes suffisent : minuit n'est jamais dans un trou de changement d'heure (2 h → 3 h).
  let t = wall - parisOffsetMs(new Date(wall));
  t = wall - parisOffsetMs(new Date(t));
  return new Date(t);
}

/** Millisecondes restantes avant le prochain minuit à Paris. */
export function msUntilParisMidnight(now = new Date()) {
  const next = parisMidnight(addDaysToKey(parisDateKey(now), 1));
  return next.getTime() - now.getTime();
}

/** Formate une durée en 'HH:MM:SS' (heures non bornées). */
export function formatHMS(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** Formate un nombre à la française (espaces fines insécables). */
export function formatNumber(n, maximumFractionDigits = 0) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits }).format(n);
}

/** Date longue en français : « mardi 18 novembre 2026 ». */
export function formatLongDate(date, timeZone) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone,
  }).format(date);
}
