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

/* ------------------------------------------------------------------ */
/* Thème clair / sombre manuel (bouton 🌗 injecté dans l'en-tête)      */
/* ------------------------------------------------------------------ */

const THEMES = [
  { id: 'auto', icon: '🌗', label: 'Thème : automatique' },
  { id: 'light', icon: '☀️', label: 'Thème : clair' },
  { id: 'dark', icon: '🌙', label: 'Thème : sombre' },
];

export function currentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'auto';
}

export function setTheme(id) {
  if (id === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', id);
  try {
    if (id === 'auto') localStorage.removeItem('zinzin:theme');
    else localStorage.setItem('zinzin:theme', JSON.stringify(id));
  } catch { /* stockage indisponible */ }
  // Les canvas (roue) relisent leurs couleurs.
  document.dispatchEvent(new CustomEvent('zinzin:theme', { detail: id }));
}

function mountThemeToggle() {
  const header = document.querySelector('.site-header__inner');
  if (!header || header.querySelector('.theme-toggle')) return;
  const btn = el('button', { type: 'button', class: 'theme-toggle' });
  const refresh = () => {
    const t = THEMES.find((x) => x.id === currentTheme()) || THEMES[0];
    btn.textContent = t.icon;
    btn.setAttribute('aria-label', `${t.label} (cliquer pour changer)`);
    btn.title = t.label;
  };
  btn.addEventListener('click', () => {
    const i = THEMES.findIndex((x) => x.id === currentTheme());
    const next = THEMES[(i + 1) % THEMES.length];
    setTheme(next.id);
    refresh();
    toast(next.label);
  });
  refresh();
  header.append(btn);
}

/* ------------------------------------------------------------------ */
/* Easter egg : code Konami ↑↑↓↓←→←→ B A                              */
/* ------------------------------------------------------------------ */

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

function unicornRain() {
  if (prefersReducedMotion()) return;
  const zone = el('div', { class: 'unicorn-rain', 'aria-hidden': 'true' });
  for (let i = 0; i < 36; i++) {
    const u = el('span', {}, ['🦄', '🌈', '✨'][i % 3]);
    u.style.left = `${Math.random() * 100}%`;
    u.style.animationDelay = `${Math.random() * 1.2}s`;
    u.style.fontSize = `${1.2 + Math.random() * 2}rem`;
    zone.append(u);
  }
  document.body.append(zone);
  setTimeout(() => zone.remove(), 4200);
}

function listenKonami() {
  let pos = 0;
  document.addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = key === KONAMI[pos] ? pos + 1 : key === KONAMI[0] ? 1 : 0;
    if (pos === KONAMI.length) {
      pos = 0;
      unicornRain();
      toast('🦄 Mode licorne activé !');
      import('./stickers.js').then((m) => m.unlock('licorne')).catch(() => {});
    }
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountThemeToggle);
  else mountThemeToggle();
  listenKonami();
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
