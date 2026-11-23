// Chrono parfait — logique pure.
import { createRng } from '../shared/rng.js';

export const DEFAULT_TARGET = 10_000; // ms
export const VISIBLE_FOR = 3_000;     // le chrono disparaît après 3 s

/** Cible du défi du jour : entre 4,00 s et 15,00 s, au centième, la même pour tout le monde. */
export function dailyTarget(dateKey) {
  const r = createRng(`zinzin-chrono#${dateKey}`);
  return 4000 + Math.round(r() * 1100) * 10;
}

/** Note d'un essai selon l'écart absolu (ms). */
export function rate(diffMs) {
  const d = Math.abs(diffMs);
  if (d <= 10) return { stars: 5, label: '🤯 PILE ! Horloge atomique humaine.' };
  if (d <= 50) return { stars: 5, label: '🎯 Incroyable précision.' };
  if (d <= 150) return { stars: 4, label: '👏 Très fort !' };
  if (d <= 400) return { stars: 3, label: '🙂 Pas mal du tout.' };
  if (d <= 1000) return { stars: 2, label: '😅 Le temps file, hein ?' };
  return { stars: 1, label: '🐌 Le temps est relatif, paraît-il.' };
}

/** « 9,87 s » */
export function formatSeconds(ms) {
  return `${(ms / 1000).toFixed(2).replace('.', ',')} s`;
}

/** « +0,13 s » / « −0,42 s » */
export function formatDiff(diffMs) {
  const sign = diffMs > 0 ? '+' : diffMs < 0 ? '−' : '±';
  return `${sign}${(Math.abs(diffMs) / 1000).toFixed(2).replace('.', ',')} s`;
}

/** Meilleur essai (écart le plus petit). */
export function best(attempts) {
  return attempts.reduce((b, a) => (b === null || Math.abs(a) < Math.abs(b) ? a : b), null);
}
