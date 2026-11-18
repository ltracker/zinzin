// Accès sécurisé au localStorage : toutes les opérations sont dans des try/catch
// (navigation privée, quota plein, stockage désactivé…). En cas d'échec, on
// retombe sur un stockage en mémoire pour que la page fonctionne quand même.

export const PREFIX = 'zinzin:';
const memory = new Map();

function backend() {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return null;
    const probe = `${PREFIX}__probe`;
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return null;
  }
}

/** Lit une valeur JSON ; renvoie `fallback` si absente ou illisible. */
export function load(key, fallback = null) {
  const k = PREFIX + key;
  try {
    const ls = backend();
    const raw = ls ? ls.getItem(k) : memory.get(k);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Enregistre une valeur (sérialisée en JSON). Renvoie true si persistée sur disque. */
export function save(key, value) {
  const k = PREFIX + key;
  const raw = JSON.stringify(value);
  try {
    const ls = backend();
    if (ls) { ls.setItem(k, raw); return true; }
  } catch { /* on tombe sur la mémoire */ }
  memory.set(k, raw);
  return false;
}

/** Supprime une clé. */
export function remove(key) {
  const k = PREFIX + key;
  memory.delete(k);
  try { backend()?.removeItem(k); } catch { /* rien */ }
}

/** Liste les clés Zinzin (sans le préfixe). */
export function keys() {
  const out = new Set();
  for (const k of memory.keys()) out.add(k.slice(PREFIX.length));
  try {
    const ls = backend();
    if (ls) {
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        if (k && k.startsWith(PREFIX)) out.add(k.slice(PREFIX.length));
      }
    }
  } catch { /* rien */ }
  return [...out];
}

/** Efface toutes les données Zinzin. Renvoie le nombre de clés supprimées. */
export function clearAll() {
  const all = keys();
  all.forEach(remove);
  return all.length;
}
