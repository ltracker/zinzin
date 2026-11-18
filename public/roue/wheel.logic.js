// Roue de la décision — logique pure (tests/wheel.test.js).
// Convention : la roue tourne dans le sens horaire (angle croissant, repère canvas) ;
// le pointeur est en haut (angle -π/2). La taille de chaque part est proportionnelle
// à son poids : la probabilité affichée = la probabilité réelle.

export const TAU = Math.PI * 2;
export const POINTER_ANGLE = -Math.PI / 2;
export const MAX_OPTIONS = 40;
export const MAX_LABEL = 40;
export const MIN_WEIGHT = 1;
export const MAX_WEIGHT = 10;

export const PALETTE = ['#ffd23f', '#ff6fae', '#3ddc97', '#4cc3ff', '#ff7a45', '#b28dff', '#ffe08a', '#7ef0c4', '#ffa3c9', '#9be3ff'];

/** Nettoie une option : libellé tronqué, poids entier borné, couleur hexadécimale valide. */
export function sanitizeOption(o, i = 0) {
  const label = String(o?.label ?? '').trim().slice(0, MAX_LABEL);
  const w = Math.round(Number(o?.weight));
  const weight = Number.isFinite(w) ? Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, w)) : 1;
  const color = /^#[0-9a-f]{6}$/i.test(o?.color || '') ? o.color.toLowerCase() : PALETTE[i % PALETTE.length];
  return { label, weight, color };
}

export function sanitizeOptions(list) {
  return (Array.isArray(list) ? list : [])
    .map(sanitizeOption)
    .filter((o) => o.label)
    .slice(0, MAX_OPTIONS);
}

/** Parts de la roue : [{ start, end, mid }] en radians à partir de 0 (avant rotation). */
export function segments(options) {
  const total = options.reduce((s, o) => s + o.weight, 0);
  let a = 0;
  return options.map((o) => {
    const span = total ? (o.weight / total) * TAU : 0;
    const seg = { start: a, end: a + span, mid: a + span / 2, span };
    a += span;
    return seg;
  });
}

/** Tirage pondéré : r ∈ [0, 1) → index. */
export function weightedIndex(options, r) {
  const total = options.reduce((s, o) => s + o.weight, 0);
  if (!total) return -1;
  let x = r * total;
  for (let i = 0; i < options.length; i++) {
    x -= options[i].weight;
    if (x < 0) return i;
  }
  return options.length - 1;
}

const mod = (a, m) => ((a % m) + m) % m;

/** Index de la part sous le pointeur pour une rotation donnée. */
export function indexAtRotation(options, rotation) {
  const segs = segments(options);
  const a = mod(POINTER_ANGLE - rotation, TAU);
  const i = segs.findIndex((s) => a >= s.start && a < s.end);
  return i === -1 ? segs.length - 1 : i;
}

/**
 * Rotation finale (absolue) pour que le pointeur s'arrête sur la part `index`.
 * @param {number} offset  ∈ [0, 1) position dans la part (on reste dans les 80 % centraux)
 * @param {number} turns   nombre de tours complets minimum
 */
export function targetRotation(options, index, offset, current, turns = 5) {
  const s = segments(options)[index];
  const inSeg = s.start + s.span * (0.1 + 0.8 * offset);
  // On veut : POINTER_ANGLE - rotation ≡ inSeg (mod 2π)
  const desired = mod(POINTER_ANGLE - inSeg, TAU);
  const base = current + turns * TAU;
  return base + mod(desired - base, TAU);
}

/**
 * Courbe de progression d'un lancer (0 → 1) : accélération linéaire de la vitesse
 * pendant `a`, puis décélération quadratique jusqu'à l'arrêt (vitesse continue).
 */
export function spinProgress(t, a = 0.12) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const total = a / 2 + (1 - a) / 3;
  if (t < a) return (t * t) / (2 * a) / total;
  const u = (1 - t) / (1 - a);
  return (a / 2 + ((1 - a) / 3) * (1 - u * u * u)) / total;
}

/** Retire l'option d'index i (mode « éliminer »). */
export function removeAt(options, i) {
  return options.filter((_, j) => j !== i);
}

/** Probabilité (0-1) de chaque option. */
export function probabilities(options) {
  const total = options.reduce((s, o) => s + o.weight, 0);
  return options.map((o) => (total ? o.weight / total : 0));
}

/* ---------- Sérialisation dans l'URL (base64url d'un JSON compact) ---------- */

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** { title, options } → chaîne courte pour l'URL. */
export function encodeList({ title = '', options }) {
  const compact = [String(title).slice(0, 60), ...sanitizeOptions(options).map((o) => [o.label, o.weight, o.color.slice(1)])];
  return toBase64Url(JSON.stringify(compact));
}

/** Chaîne de l'URL → { title, options } ou null si invalide. */
export function decodeList(s) {
  try {
    const [title, ...rows] = JSON.parse(fromBase64Url(String(s)));
    if (typeof title !== 'string' || !Array.isArray(rows)) return null;
    const options = sanitizeOptions(rows.map(([label, weight, color]) => ({ label, weight, color: `#${color}` })));
    return options.length ? { title: title.slice(0, 60), options } : null;
  } catch {
    return null;
  }
}
