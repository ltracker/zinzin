// « Ce jour-là » — logique pure (aucun accès au DOM), testée par tests/life.test.js.
// Les dates de naissance sont des objets Date en heure locale du navigateur
// (c'est l'heure que les gens connaissent pour leur naissance).

export const DAY = 86_400_000;
export const YEAR_DAYS = 365.25;

/* ------------------------------------------------------------------ */
/* Saisie                                                              */
/* ------------------------------------------------------------------ */

/**
 * Construit la Date de naissance (heure locale) depuis 'AAAA-MM-JJ' et 'HH:MM' optionnel.
 * Renvoie null si la saisie est invalide.
 */
export function parseBirth(dateStr, timeStr = '') {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || '');
  if (!m) return null;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  let hh = 0, mm = 0;
  if (timeStr) {
    const t = /^(\d{2}):(\d{2})$/.exec(timeStr);
    if (!t) return null;
    hh = +t[1]; mm = +t[2];
    if (hh > 23 || mm > 59) return null;
  }
  const date = new Date(y, mo - 1, d, hh, mm, 0, 0);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

/** Vérifie qu'une date de naissance est plausible. Renvoie un message d'erreur ou null. */
export function validateBirth(birth, now = new Date()) {
  if (!birth) return 'Cette date ne semble pas exister.';
  if (birth.getTime() > now.getTime()) return "Tu n'es pas encore né·e ? Choisis une date passée.";
  if (birth.getFullYear() < 1900) return 'Les calculs sont prévus à partir de 1900.';
  return null;
}

/* ------------------------------------------------------------------ */
/* Âge                                                                 */
/* ------------------------------------------------------------------ */

const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

/** Ajoute n mois calendaires (le 31 → dernier jour du mois si besoin ; le 29/02 → 28/02). */
export function addMonths(date, n) {
  const y = date.getFullYear();
  const m = date.getMonth() + n;
  const target = new Date(y, m, 1, date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  target.setDate(Math.min(date.getDate(), daysInMonth(target.getFullYear(), target.getMonth())));
  return target;
}

/** Ajoute n jours calendaires (stable lors des changements d'heure). */
export function addDays(date, n) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + n);
  return d;
}

/**
 * Âge exact décomposé : années, mois, jours calendaires puis heures/min/s restantes,
 * plus les totaux écoulés.
 */
export function ageBreakdown(birth, now = new Date()) {
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (addMonths(birth, months) > now) months--;
  const anchor = addMonths(birth, months);
  let days = 0;
  while (addDays(anchor, days + 1) <= now) days++;
  let rest = now - addDays(anchor, days);
  const hours = Math.floor(rest / 3_600_000); rest -= hours * 3_600_000;
  const minutes = Math.floor(rest / 60_000); rest -= minutes * 60_000;
  const seconds = Math.floor(rest / 1000);
  const ms = now - birth;
  return {
    years: Math.floor(months / 12),
    months: months % 12,
    days, hours, minutes, seconds,
    totalMs: ms,
    totalSeconds: Math.floor(ms / 1000),
    totalMinutes: Math.floor(ms / 60_000),
    totalHours: Math.floor(ms / 3_600_000),
    totalDays: Math.floor(ms / DAY),
    totalWeeks: Math.floor(ms / (7 * DAY)),
    totalMonths: months,
  };
}

/* ------------------------------------------------------------------ */
/* Jalons                                                              */
/* ------------------------------------------------------------------ */

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);

/** Définition des jalons « ronds ». `ms` pour les unités fixes, `months` pour les mois calendaires. */
export const MILESTONE_DEFS = [
  ...[1000, 5000, 10000, 15000, 20000, 25000, 30000].map((n) => ({ id: `j${n}`, emoji: '📆', label: `${fmt(n)} jours`, ms: n * DAY })),
  ...[1e5, 2e5, 3e5, 4e5, 5e5, 6e5, 7e5].map((n) => ({ id: `h${n}`, emoji: '⏳', label: `${fmt(n)} heures`, ms: n * 3_600_000 })),
  { id: 'm1e6', emoji: '⏱️', label: '1 million de minutes', ms: 1e6 * 60_000 },
  ...[1e7, 2e7, 3e7, 4e7].map((n) => ({ id: `m${n}`, emoji: '⏱️', label: `${n / 1e6} millions de minutes`, ms: n * 60_000 })),
  { id: 's1e9', emoji: '🤯', label: '1 milliard de secondes', ms: 1e9 * 1000 },
  ...[2e9, 3e9].map((n) => ({ id: `s${n}`, emoji: '🤯', label: `${n / 1e9} milliards de secondes`, ms: n * 1000 })),
  ...[1000, 2000, 3000, 4000].map((n) => ({ id: `w${n}`, emoji: '🗓️', label: `${fmt(n)} semaines`, ms: n * 7 * DAY })),
  ...[100, 250, 500, 750, 1000].map((n) => ({ id: `mo${n}`, emoji: '🌙', label: `${fmt(n)} mois`, months: n })),
];

/** Tous les jalons avec leur date et leur statut, triés chronologiquement. */
export function milestones(birth, now = new Date()) {
  return MILESTONE_DEFS
    .map((def) => {
      const date = def.months ? addMonths(birth, def.months) : new Date(birth.getTime() + def.ms);
      return { ...def, date, past: date <= now };
    })
    .sort((a, b) => a.date - b.date);
}

/** Le prochain jalon à venir (ou null). */
export function nextMilestone(birth, now = new Date()) {
  return milestones(birth, now).find((m) => !m.past) || null;
}

/* ------------------------------------------------------------------ */
/* Anniversaire                                                        */
/* ------------------------------------------------------------------ */

/** Prochain anniversaire (strictement après `now`). Né un 29/02 → fêté le 28/02 les années non bissextiles. */
export function nextBirthday(birth, now = new Date()) {
  const age = ageBreakdown(birth, now).years;
  const date = addMonths(birth, (age + 1) * 12);
  return { date, turning: age + 1, ms: date - now, isToday: isSameDayOfYear(birth, now) };
}

function isSameDayOfYear(birth, now) {
  const b = addMonths(birth, (now.getFullYear() - birth.getFullYear()) * 12);
  return b.getMonth() === now.getMonth() && b.getDate() === now.getDate();
}

/* ------------------------------------------------------------------ */
/* Planètes                                                            */
/* ------------------------------------------------------------------ */

/** Périodes orbitales sidérales en jours terrestres. */
export const PLANETS = [
  { id: 'mercure', name: 'Mercure', period: 87.969 },
  { id: 'venus', name: 'Vénus', period: 224.701 },
  { id: 'terre', name: 'Terre', period: 365.256 },
  { id: 'mars', name: 'Mars', period: 686.98 },
  { id: 'jupiter', name: 'Jupiter', period: 4332.59 },
  { id: 'saturne', name: 'Saturne', period: 10759.22 },
  { id: 'uranus', name: 'Uranus', period: 30688.5 },
  { id: 'neptune', name: 'Neptune', period: 60182 },
];

/** Âge sur chaque planète + date du prochain anniversaire planétaire. */
export function planetAges(birth, now = new Date()) {
  const days = (now - birth) / DAY;
  return PLANETS.map((p) => {
    const age = days / p.period;
    const next = new Date(birth.getTime() + Math.ceil(age + 1e-9) * p.period * DAY);
    return { ...p, age, nextBirthday: next };
  });
}

/* ------------------------------------------------------------------ */
/* Lune (algorithme de Meeus, « Astronomical Algorithms », chap. 49)   */
/* ------------------------------------------------------------------ */

const RAD = Math.PI / 180;
const JD_UNIX_EPOCH = 2440587.5;
export const SYNODIC_MONTH = 29.530588853;

/**
 * Instant (ms UTC) de la phase lunaire k. k entier → nouvelle lune,
 * k + 0.5 → pleine lune. k = 0 ≈ nouvelle lune du 6 janvier 2000.
 * Précision de l'ordre de la minute sur 1900-2100 (termes principaux).
 */
export function lunarPhaseTime(k) {
  const T = k / 1236.85;
  const T2 = T * T;
  let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.00000015 * T2 * T;
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const M = (2.5534 + 29.1053567 * k - 0.0000014 * T2) * RAD;
  const Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T2) * RAD;
  const F = (160.7108 + 390.67050284 * k - 0.0016118 * T2) * RAD;
  const O = (124.7746 - 1.56375588 * k + 0.0020672 * T2) * RAD;
  const full = Math.abs(k % 1) > 0.25;
  const c = full
    ? [-0.40614, 0.17302, 0.01614, 0.01043, 0.00734, -0.00515, 0.00209]
    : [-0.4072, 0.17241, 0.01608, 0.01039, 0.00739, -0.00514, 0.00208];
  jde += c[0] * Math.sin(Mp)
    + c[1] * E * Math.sin(M)
    + c[2] * Math.sin(2 * Mp)
    + c[3] * Math.sin(2 * F)
    + c[4] * E * Math.sin(Mp - M)
    + c[5] * E * Math.sin(Mp + M)
    + c[6] * E * E * Math.sin(2 * M)
    - 0.00111 * Math.sin(Mp - 2 * F)
    - 0.00057 * Math.sin(Mp + 2 * F)
    + 0.00056 * E * Math.sin(2 * Mp + M)
    - 0.00042 * Math.sin(3 * Mp)
    + 0.00042 * E * Math.sin(M + 2 * F)
    + 0.00038 * E * Math.sin(M - 2 * F)
    - 0.00024 * E * Math.sin(2 * Mp - M)
    - 0.00017 * Math.sin(O);
  return (jde - JD_UNIX_EPOCH) * DAY;
}

const kApprox = (ms) => (ms / DAY + JD_UNIX_EPOCH - 2451550.09766) / SYNODIC_MONTH;

/** Nombre de pleines lunes survenues dans l'intervalle ]from, to]. */
export function countFullMoons(from, to) {
  const a = from.getTime(), b = to.getTime();
  if (b <= a) return 0;
  let k = Math.floor(kApprox(a)) - 2 + 0.5;
  while (lunarPhaseTime(k) <= a) k++;
  let n = 0;
  while (lunarPhaseTime(k) <= b) { n++; k++; }
  return n;
}

/** Prochaine pleine lune après `date`. */
export function nextFullMoon(date = new Date()) {
  let k = Math.floor(kApprox(date.getTime())) - 2 + 0.5;
  while (lunarPhaseTime(k) <= date.getTime()) k++;
  return new Date(lunarPhaseTime(k));
}

/** Nouvelles lunes (ms UTC) comprises dans [a, b]. */
export function newMoonsBetween(a, b) {
  const out = [];
  let k = Math.floor(kApprox(a)) - 2;
  for (; ; k++) {
    const t = lunarPhaseTime(k);
    if (t > b) break;
    if (t >= a) out.push(t);
  }
  return out;
}

const MOON_PHASES = [
  { name: 'Nouvelle lune', emoji: '🌑' },
  { name: 'Premier croissant', emoji: '🌒' },
  { name: 'Premier quartier', emoji: '🌓' },
  { name: 'Gibbeuse croissante', emoji: '🌔' },
  { name: 'Pleine lune', emoji: '🌕' },
  { name: 'Gibbeuse décroissante', emoji: '🌖' },
  { name: 'Dernier quartier', emoji: '🌗' },
  { name: 'Dernier croissant', emoji: '🌘' },
];

/** Phase de la Lune à une date (fraction de lunaison 0-1 depuis la nouvelle lune précédente). */
export function moonPhase(date) {
  const t = date.getTime();
  let k = Math.floor(kApprox(t)) + 1;
  while (lunarPhaseTime(k) > t) k--;
  const prev = lunarPhaseTime(k);
  const fraction = (t - prev) / (lunarPhaseTime(k + 1) - prev);
  const idx = Math.round(fraction * 8) % 8;
  return { fraction, ...MOON_PHASES[idx] };
}

/* ------------------------------------------------------------------ */
/* Estimations (moyennes rigolotes, pas des données médicales)        */
/* ------------------------------------------------------------------ */

export const ESTIMATE_RATES = {
  heartbeatsPerMin: 80,        // moyenne sur une vie (bébé ≈ 130, adulte au repos ≈ 70)
  breathsPerMin: 16,
  sleepHoursPerDay: 8.5,       // moyenne sur une vie (bébés et enfants dorment plus)
  blinksPerMinAwake: 15,
  earthOrbitKmPerSec: 29.78,   // vitesse moyenne de la Terre autour du Soleil
  galaxyKmPerSec: 230,         // vitesse du Soleil autour du centre de la Voie lactée
  laughsPerDay: 15,
};

export function estimates(birth, now = new Date()) {
  const ms = now - birth;
  const min = ms / 60_000;
  const sec = ms / 1000;
  const days = ms / DAY;
  const r = ESTIMATE_RATES;
  return {
    heartbeats: min * r.heartbeatsPerMin,
    breaths: min * r.breathsPerMin,
    nights: Math.floor(days),
    sleepYears: (days * r.sleepHoursPerDay) / 24 / YEAR_DAYS,
    blinks: min * (1 - r.sleepHoursPerDay / 24) * r.blinksPerMinAwake,
    earthOrbitKm: sec * r.earthOrbitKmPerSec,
    galaxyKm: sec * r.galaxyKmPerSec,
    laughs: days * r.laughsPerDay,
  };
}

/* ------------------------------------------------------------------ */
/* Jour de la semaine, zodiaques                                       */
/* ------------------------------------------------------------------ */

export const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/** Comptine anglaise « Monday's child… » adaptée en français. */
const WEEKDAY_RHYME = [
  'Chanceux·se, joyeux·se et un peu flemmard·e.',
  'Beau visage, et courage pour toute la semaine.',
  'Plein·e de grâce (et de café).',
  'En plein milieu, donc parfaitement équilibré·e.',
  'A encore du chemin à faire, mais avec style.',
  'Aimant·e, généreux·se, déjà en week-end.',
  'Travailleur·se… mais seulement après la grasse mat.',
];

export function weekdayOf(date) {
  const i = date.getDay();
  return { index: i, name: WEEKDAYS[i], rhyme: WEEKDAY_RHYME[i] };
}

/** Signes du zodiaque occidental (dates tropicales usuelles). `from` = [mois, jour] de début. */
export const ZODIAC = [
  { name: 'Capricorne', emoji: '♑', from: [12, 22] },
  { name: 'Verseau', emoji: '♒', from: [1, 20] },
  { name: 'Poissons', emoji: '♓', from: [2, 19] },
  { name: 'Bélier', emoji: '♈', from: [3, 21] },
  { name: 'Taureau', emoji: '♉', from: [4, 20] },
  { name: 'Gémeaux', emoji: '♊', from: [5, 21] },
  { name: 'Cancer', emoji: '♋', from: [6, 21] },
  { name: 'Lion', emoji: '♌', from: [7, 23] },
  { name: 'Vierge', emoji: '♍', from: [8, 23] },
  { name: 'Balance', emoji: '♎', from: [9, 23] },
  { name: 'Scorpion', emoji: '♏', from: [10, 23] },
  { name: 'Sagittaire', emoji: '♐', from: [11, 22] },
];

export function westernZodiac(date) {
  const md = (date.getMonth() + 1) * 100 + date.getDate();
  // On cherche le dernier signe dont la date de début est <= md (le Capricorne boucle sur l'année).
  let sign = ZODIAC[0];
  for (const z of ZODIAC.slice(1)) {
    if (md >= z.from[0] * 100 + z.from[1]) sign = z;
  }
  if (md >= 1222) sign = ZODIAC[0];
  return sign;
}

export const CHINESE_ANIMALS = [
  { name: 'Rat', emoji: '🐀' },
  { name: 'Buffle', emoji: '🐂' },
  { name: 'Tigre', emoji: '🐅' },
  { name: 'Lapin', emoji: '🐇' },
  { name: 'Dragon', emoji: '🐉' },
  { name: 'Serpent', emoji: '🐍' },
  { name: 'Cheval', emoji: '🐎' },
  { name: 'Chèvre', emoji: '🐐' },
  { name: 'Singe', emoji: '🐒' },
  { name: 'Coq', emoji: '🐓' },
  { name: 'Chien', emoji: '🐕' },
  { name: 'Cochon', emoji: '🐖' },
];
const ELEMENTS = ['Métal', 'Métal', 'Eau', 'Eau', 'Bois', 'Bois', 'Feu', 'Feu', 'Terre', 'Terre'];

const BEIJING_OFFSET = 8 * 3_600_000;

// Termes périodiques des équinoxes et solstices (Meeus, table 27.C) : [A, B (°), C (°)].
const SOLSTICE_TERMS = [
  [485, 324.96, 1934.136], [203, 337.23, 32964.467], [199, 342.08, 20.186], [182, 27.85, 445267.112],
  [156, 73.14, 45036.886], [136, 171.52, 22518.443], [77, 222.54, 65928.934], [74, 296.72, 3034.906],
  [70, 243.58, 9037.513], [58, 119.81, 33718.147], [52, 297.17, 150.678], [50, 21.02, 2281.226],
  [45, 247.54, 29929.562], [44, 325.15, 31555.956], [29, 60.93, 4443.417], [18, 155.12, 67555.328],
  [17, 288.79, 4562.452], [16, 198.04, 62894.029], [14, 199.76, 31436.921], [12, 95.39, 14577.848],
  [12, 287.11, 31931.756], [12, 320.81, 34777.259], [9, 227.73, 1222.114], [8, 15.45, 16859.074],
];

/** Instant (ms UTC) du solstice de décembre d'une année (Meeus, chap. 27). */
export function decemberSolstice(year) {
  const Y = (year - 2000) / 1000;
  const jde0 = 2451900.05952 + 365242.74049 * Y - 0.06223 * Y * Y - 0.00823 * Y ** 3 + 0.00032 * Y ** 4;
  const T = (jde0 - 2451545) / 36525;
  const W = (35999.373 * T - 2.47) * RAD;
  const dl = 1 + 0.0334 * Math.cos(W) + 0.0007 * Math.cos(2 * W);
  const S = SOLSTICE_TERMS.reduce((s, [A, B, C]) => s + A * Math.cos((B + C * T) * RAD), 0);
  return (jde0 + (0.00001 * S) / dl - JD_UNIX_EPOCH) * DAY;
}

const beijingDay = (ms) => Math.floor((ms + BEIJING_OFFSET) / DAY);

/**
 * Date du Nouvel An chinois pour une année grégorienne. Règle du calendrier
 * chinois (dates à Pékin, UTC+8) : le 11ᵉ mois commence à la nouvelle lune qui
 * précède (ou tombe le jour du) solstice d'hiver ; le Nouvel An est la 2ᵉ
 * nouvelle lune suivante. Exact de 1900 à 2033 (le cas du mois intercalaire
 * 11/12 de 2033 n'est pas géré, sans effet pour des dates de naissance).
 * Renvoie { month, day } (calendrier civil).
 */
export function chineseNewYear(year) {
  const sol = decemberSolstice(year - 1);
  const moons = newMoonsBetween(sol - 40 * DAY, sol + 100 * DAY);
  const solDay = beijingDay(sol);
  let i11 = 0;
  moons.forEach((t, i) => { if (beijingDay(t) <= solDay) i11 = i; });
  const d = new Date(moons[i11 + 2] + BEIJING_OFFSET);
  return { month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** Signe chinois (animal + élément) d'une date de naissance. */
export function chineseZodiac(date) {
  let year = date.getFullYear();
  const cny = chineseNewYear(year);
  const md = (date.getMonth() + 1) * 100 + date.getDate();
  if (md < cny.month * 100 + cny.day) year -= 1;
  const animal = CHINESE_ANIMALS[(((year - 2020) % 12) + 12) % 12];
  const element = ELEMENTS[((year % 10) + 10) % 10];
  return { ...animal, element, year };
}

/* ------------------------------------------------------------------ */
/* Export calendrier (.ics, RFC 5545)                                  */
/* ------------------------------------------------------------------ */

const icsEscape = (s) => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
const pad2 = (n) => String(n).padStart(2, '0');
const icsDate = (d) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
const icsStamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Replie une ligne à 75 octets (UTF-8) maximum, comme l'exige la RFC. */
export function foldLine(line) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const parts = [];
  let cur = '';
  let limit = 75;
  for (const ch of line) {
    if (enc.encode(cur + ch).length > limit) {
      parts.push(cur);
      cur = ch;
      limit = 74; // la ligne de continuation commence par une espace
    } else cur += ch;
  }
  parts.push(cur);
  return parts.join('\r\n ');
}

/**
 * Génère un fichier .ics contenant un événement « journée entière » avec rappel la veille.
 * @param {{title: string, description?: string, date: Date, uid: string, url?: string, now?: Date}} ev
 */
export function buildIcs({ title, description = '', date, uid, url, now = new Date() }) {
  const end = addDays(date, 1);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Zinzin//Ce jour-la//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${icsStamp(now)}`,
    `DTSTART;VALUE=DATE:${icsDate(date)}`,
    `DTEND;VALUE=DATE:${icsDate(end)}`,
    `SUMMARY:${icsEscape(title)}`,
    description && `DESCRIPTION:${icsEscape(description)}`,
    url && `URL:${url}`,
    'TRANSP:TRANSPARENT',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsEscape(title)}`,
    'TRIGGER:-PT12H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
