// Père Noël secret — logique pure (tests/santa.test.js).
// Le tirage est un « dérangement » (personne ne s'offre à soi-même) qui respecte les exclusions.
// Chaque participant reçoit un lien dont le fragment (#…) contient son attribution chiffrée en
// AES-GCM (Web Crypto, disponible dans le navigateur et dans Node ≥ 20). La clé voyage dans le
// lien : c'est une protection contre le spoiler accidentel, pas contre un curieux déterminé.

export const MAX_PEOPLE = 50;
export const MAX_NAME = 40;

/** Nettoie la liste des noms : espaces, longueur, doublons (insensibles à la casse et aux accents). */
export function sanitizeNames(names) {
  const seen = new Set();
  const out = [];
  for (const raw of names || []) {
    const name = String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
    const key = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (name && !seen.has(key)) { seen.add(key); out.push(name); }
  }
  return out.slice(0, MAX_PEOPLE);
}

/**
 * Tirage au sort avec retour arrière (backtracking) et ordre aléatoire.
 * @param {number} n               nombre de participants
 * @param {Array<[number, number]>} exclusions  [donneur, receveur] interdits
 * @param {() => number} rng
 * @returns {number[] | null}  receveur[i] pour chaque donneur i, ou null si impossible
 */
export function draw(n, exclusions = [], rng = Math.random, maxSteps = 200_000) {
  if (n < 2) return null;
  const forbidden = Array.from({ length: n }, (_, i) => new Set([i]));
  for (const [a, b] of exclusions) if (a >= 0 && a < n && b >= 0 && b < n) forbidden[a].add(b);

  // On traite d'abord les donneurs les plus contraints (heuristique classique).
  const order = [...Array(n).keys()].sort((a, b) => forbidden[b].size - forbidden[a].size || rng() - 0.5);
  const result = new Array(n).fill(-1);
  const taken = new Array(n).fill(false);
  let steps = 0;

  const shuffled = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };

  function place(k) {
    if (k === n) return true;
    if (++steps > maxSteps) return false;
    const giver = order[k];
    for (const r of shuffled([...Array(n).keys()])) {
      if (taken[r] || forbidden[giver].has(r)) continue;
      taken[r] = true; result[giver] = r;
      if (place(k + 1)) return true;
      taken[r] = false; result[giver] = -1;
    }
    return false;
  }

  return place(0) ? result : null;
}

/** Vérifie qu'un tirage est valide (utile pour les tests et par sécurité avant affichage). */
export function isValidDraw(result, exclusions = []) {
  if (!Array.isArray(result) || result.length < 2) return false;
  const n = result.length;
  if (new Set(result).size !== n) return false;
  if (result.some((r, i) => r === i || r < 0 || r >= n)) return false;
  return !exclusions.some(([a, b]) => result[a] === b);
}

/* ------------------------------------------------------------------ */
/* Tickets chiffrés (fragment d'URL)                                   */
/* ------------------------------------------------------------------ */

const subtle = () => globalThis.crypto.subtle;

function toB64Url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64Url(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/**
 * Chiffre un ticket { event, giver, receiver, budget, date, message } → chaîne base64url
 * (clé 128 bits + IV 96 bits + texte chiffré).
 */
export async function encodeTicket(ticket) {
  const key = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const k = await subtle().importKey('raw', key, 'AES-GCM', false, ['encrypt']);
  const data = new TextEncoder().encode(JSON.stringify({ v: 1, ...ticket }));
  const ct = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv }, k, data));
  const out = new Uint8Array(key.length + iv.length + ct.length);
  out.set(key, 0); out.set(iv, 16); out.set(ct, 28);
  return toB64Url(out);
}

/** Déchiffre un ticket ; renvoie null s'il est invalide ou modifié. */
export async function decodeTicket(s) {
  try {
    const bytes = fromB64Url(String(s));
    if (bytes.length < 29) return null;
    const k = await subtle().importKey('raw', bytes.slice(0, 16), 'AES-GCM', false, ['decrypt']);
    const plain = await subtle().decrypt({ name: 'AES-GCM', iv: bytes.slice(16, 28) }, k, bytes.slice(28));
    const t = JSON.parse(new TextDecoder().decode(plain));
    return t && t.v === 1 && t.giver && t.receiver ? t : null;
  } catch {
    return null;
  }
}

/** Message prêt à envoyer à un participant. */
export function inviteMessage({ event, giver, url }) {
  return `🎅 ${giver}, voici ton lien secret pour « ${event} » : il te révèle (à toi seul·e !) à qui tu offres un cadeau.\n${url}`;
}
