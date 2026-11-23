// Helpers d'interface communs : sélection DOM, création d'éléments, toasts,
// annonces pour lecteurs d'écran, détection du mouvement réduit.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/**
 * Crée un élément. `attrs` accepte class, text, html (à éviter), dataset, on{Event}.
 * Les enfants peuvent être des nœuds ou des chaînes (insérées en texte).
 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) node.setAttribute(k, '');
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

let zone;
/** Affiche un petit message temporaire (annoncé aux lecteurs d'écran). */
export function toast(message, duration = 2400) {
  if (!zone) {
    zone = el('div', { class: 'toast-zone', role: 'status', 'aria-live': 'polite' });
    document.body.append(zone);
  }
  const t = el('div', { class: 'toast', text: message });
  zone.append(t);
  setTimeout(() => {
    t.classList.add('is-leaving');
    t.addEventListener('animationend', () => t.remove(), { once: true });
    setTimeout(() => t.remove(), 400);
  }, duration);
}

/** Vrai si l'utilisateur préfère réduire les animations. */
export function prefersReducedMotion() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/* Mode hors ligne : enregistre le service worker (toutes les pages importent ce module). */
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* pas grave : le site marche sans */ });
  });
}

/** Lance une fonction toutes les secondes, calée sur le changement de seconde. */
export function everySecond(fn) {
  let timer;
  const tick = () => {
    fn();
    timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
  };
  tick();
  return () => clearTimeout(timer);
}
