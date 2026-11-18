// Générateur pseudo-aléatoire à graine — identique dans le navigateur et dans Node.
// - hashString : cyrb53 (domaine public), ramené à 32 bits non signés.
// - mulberry32 : PRNG 32 bits rapide et de bonne qualité pour un usage ludique.

/**
 * Hache une chaîne en entier 32 bits non signé (déterministe).
 * @param {string} str
 * @param {number} [seed=0]
 * @returns {number}
 */
export function hashString(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 ^ (h2 >>> 3)) >>> 0;
}

/**
 * PRNG mulberry32.
 * @param {number} seed entier 32 bits
 * @returns {() => number} fonction renvoyant un flottant dans [0, 1)
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Crée un RNG à partir d'une graine quelconque (nombre ou chaîne).
 * Une chaîne est normalisée (minuscules, sans espaces superflus) pour que
 * « Léa », « léa » et « léa  » donnent le même résultat.
 * @param {number|string} seed
 */
export function createRng(seed) {
  if (typeof seed === 'number') return mulberry32(seed);
  const normalized = String(seed).trim().toLowerCase().replace(/\s+/g, ' ');
  return mulberry32(hashString(normalized));
}

/** Entier uniforme dans [min, max] (bornes incluses). */
export function int(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Élément au hasard d'un tableau non vide. */
export function pick(rng, arr) {
  if (!arr.length) throw new Error('pick: tableau vide');
  return arr[Math.floor(rng() * arr.length)];
}

/** Vrai avec la probabilité p. */
export function chance(rng, p) {
  return rng() < p;
}

/** Mélange de Fisher-Yates ; renvoie une NOUVELLE liste. */
export function shuffle(rng, arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Graine aléatoire « vraie » (crypto si disponible). */
export function randomSeed() {
  const c = globalThis.crypto;
  if (c && c.getRandomValues) return c.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * 4294967296);
}
